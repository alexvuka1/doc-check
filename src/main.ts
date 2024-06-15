import * as core from '@actions/core';
import * as github from '@actions/github';
import assert from 'assert';
import { writeFile } from 'fs/promises';
import { differenceWith, isEqual } from 'lodash-es';
import { Literal, Node, Nodes, Parent, Parents } from 'mdast';
import { join } from 'path';
import { selectAll } from 'unist-util-select';
import { visit } from 'unist-util-visit';
import { visitParents } from 'unist-util-visit-parents';
import { isLiteralNode, literalsToCheck, shouldSkipLiteral } from './ast';
import { formatOutput } from './formatOutput';
import {
  areDifferentPaths,
  areEqualParams,
  areEqualRequestConfig,
  findBestMatches,
} from './matching';
import {
  DocRequestConfig,
  FailOutput,
  Conflict,
  Method,
  methods,
} from './parsing';
import {
  docCreateRequestConfig,
  docParse,
  extractPaths,
  getMethodRegex,
  oasRequestConfigToDocRegex,
} from './parsing/markdown';
import {
  oasParse,
  oasParseRequestConfigs,
  oasPathSegsToPath,
} from './parsing/openapi';
import { makeKey, mapGetOrSetDefault } from './utils';

export const run = async () => {
  try {
    const oasPath = core.getInput('openapi-path', { required: true });
    const docPath = core.getInput('doc-path', { required: true });
    const token = core.getInput('token');

    const oas = await oasParse(oasPath);

    const oasIdToRequestConfig = oasParseRequestConfigs(oas);

    const tree = await docParse(docPath);

    const oasIdToDocMatches = new Map<
      string,
      {
        node: Node & { type: (typeof literalsToCheck)[number] };
        siblingWithMethod: Node | null;
      }[]
    >([...oasIdToRequestConfig.keys()].map(k => [k, []] as const));

    const docSelectors = new Set<string>();
    const matchedStructures = new Set<Node>();
    const tablesToCheck = new Set<Node>();
    const listSelectorsToCheck = new Set<string>();
    const tableToRequestKeys = new Map<Node, string[]>();
    const oasKeyToDocKey = new Map<string, string>();

    const matchedRequestKeys = new Set<string>();
    const matchedNodes = new Set<
      Node & { type: (typeof literalsToCheck)[number] }
    >();

    const getStructuredParent = (ancestors: Parents[]) =>
      ancestors.findLast(a =>
        (['list', 'tableRow'] satisfies Nodes['type'][]).some(
          t => t === a.type,
        ),
      ) ?? null;

    const getStructureMethodLiteral = (
      structuredParent: Parent,
      possibleMethods: Method[],
    ) => {
      let methodLiteral: Literal | undefined;
      for (const literal of literalsToCheck) {
        if (methodLiteral) break;
        visit(structuredParent, literal, node => {
          if (methodLiteral || shouldSkipLiteral(node)) {
            return;
          }
          const isValueMethod = getMethodRegex(possibleMethods, {
            onlyUppercase: true,
          }).test(node.value);
          if (!isValueMethod) return;
          methodLiteral = node;
        });
      }
      return methodLiteral ?? null;
    };

    for (const literal of literalsToCheck) {
      visitParents(tree, literal, (node, ancestors) => {
        if (shouldSkipLiteral(node)) return;
        const parentSelector = ancestors.map(a => a.type).join(' > ');
        for (const [
          requestConfigId,
          requestConfig,
        ] of oasIdToRequestConfig.entries()) {
          const containsPath = oasRequestConfigToDocRegex(requestConfig).test(
            node.value,
          );
          if (!containsPath) continue;
          const containsMethod = getMethodRegex([requestConfig.method]).test(
            node.value,
          );
          const structuredParent = !containsMethod
            ? getStructuredParent(ancestors)
            : null;
          const siblingWithMethod = structuredParent
            ? getStructureMethodLiteral(structuredParent, [
                requestConfig.method,
              ])
            : null;
          if (!containsMethod && !siblingWithMethod) continue;

          const docMatches = oasIdToDocMatches.get(requestConfigId);
          assert(
            docMatches,
            'Map should have been initialised to have entries for all oas paths',
          );
          docMatches.push({ node, siblingWithMethod });
          if (!structuredParent) docSelectors.add(parentSelector);
          else if (structuredParent.type === 'tableRow') {
            const tableIndex = ancestors.findLastIndex(n => n.type === 'table');
            const tableNode = tableIndex !== -1 ? ancestors[tableIndex] : null;
            assert(tableNode, 'Expected table node');
            tablesToCheck.add(tableNode);
            matchedStructures.add(structuredParent);
            const docKey = `${requestConfig.method} ${node.value.match(oasRequestConfigToDocRegex(requestConfig))}`;
            oasKeyToDocKey.set(requestConfigId, docKey);
            mapGetOrSetDefault(tableToRequestKeys, tableNode, []).push(docKey);
          } else {
            const listNodeIndex = ancestors.findLastIndex(
              n => n.type === 'list',
            );
            assert(listNodeIndex !== -1, 'Expected list node');
            const parentListSelector = ancestors
              .slice(0, listNodeIndex)
              .map(a => a.type)
              .join(' > ');
            listSelectorsToCheck.add(parentListSelector);
            const listNode = ancestors[listNodeIndex];
            assert(listNode, 'Expected list node');
            matchedStructures.add(listNode);
          }
          matchedRequestKeys.add(requestConfigId);
          matchedNodes.add(node);
        }
      });
    }

    const docIdToUnmatchedRequestConfig = new Map<string, DocRequestConfig>();

    const handleFindDocRequestConfig = (
      method: Method,
      path: string,
      literal: Literal,
    ) => {
      const id = `${method} ${path.split('?')[0]}`;
      if (docIdToUnmatchedRequestConfig.has(id) || matchedRequestKeys.has(id)) {
        return;
      }
      const { position } = literal;
      assert(position, 'All nodes should have a position');
      const requestConfig = docCreateRequestConfig(
        method,
        path,
        position.start.line,
      );
      docIdToUnmatchedRequestConfig.set(id, requestConfig);
    };

    const searchLiteralForRequestConfig = (literal: Literal) => {
      if (shouldSkipLiteral(literal)) return;
      const paths = extractPaths(literal.value);
      const foundMethods =
        literal.value
          .match(getMethodRegex(methods))
          ?.flatMap(m => (m ? [m.toLowerCase() as Method] : [])) ?? [];
      for (const path of paths) {
        for (const method of foundMethods) {
          handleFindDocRequestConfig(method, path, literal);
        }
      }
    };

    if (matchedNodes.size === 0) {
      for (const literal of literalsToCheck) {
        visit(tree, literal, searchLiteralForRequestConfig);
      }
    } else {
      for (const parentSelector of docSelectors) {
        const siblingSelector = literalsToCheck
          .map(l => [parentSelector, l].join(' > '))
          .join(', ');
        const siblings = selectAll(siblingSelector, tree);
        for (const sibling of siblings) {
          if (!isLiteralNode(sibling)) {
            throw new Error('Expected literal node');
          }
          searchLiteralForRequestConfig(sibling);
        }
      }

      for (const listSelector of listSelectorsToCheck.values()) {
        const listSiblings = selectAll(listSelector, tree) as Parent[];
        for (const listSibling of listSiblings) {
          if (matchedStructures.has(listSibling)) {
            continue;
          }
          const methodLiteral = getStructureMethodLiteral(listSibling, methods);
          if (!methodLiteral) continue;

          const method = methodLiteral.value
            .match(
              getMethodRegex(methods, {
                onlyUppercase: true,
              }),
            )?.[0]
            .toLowerCase() as Method;
          for (const literal of literalsToCheck) {
            visit(listSibling, literal, node => {
              if (shouldSkipLiteral(node) || node === methodLiteral) return;
              const paths = extractPaths(node.value);
              for (const path of paths) {
                handleFindDocRequestConfig(method, path, node);
              }
            });
          }
        }
      }

      for (const tableToCheck of tablesToCheck.values()) {
        const tableRowSiblings = selectAll(
          'tableRow',
          tableToCheck,
        ) as Parent[];
        for (const tableRowSibling of tableRowSiblings) {
          if (matchedStructures.has(tableRowSibling)) {
            continue;
          }
          const methodLiteral = getStructureMethodLiteral(
            tableRowSibling,
            methods,
          );
          if (!methodLiteral) continue;
          const method = methodLiteral.value.toLowerCase() as Method;
          for (const literal of literalsToCheck) {
            visit(tableRowSibling, literal, node => {
              if (shouldSkipLiteral(node) || node === methodLiteral) return;
              const paths = extractPaths(node.value);
              for (const path of paths) {
                handleFindDocRequestConfig(method, path, node);
                mapGetOrSetDefault(tableToRequestKeys, tableToCheck, []).push(
                  `${method} ${path}`,
                );
              }
            });
          }
        }
      }
    }

    let unmatchedOasRequestConfigs = differenceWith(
      [...oasIdToRequestConfig.keys()],
      [...matchedRequestKeys.values()],
      isEqual,
    ).map(id => {
      const oasRequestConfig = oasIdToRequestConfig.get(id);
      if (!oasRequestConfig) throw new Error('Expected oas path to be defined');
      return oasRequestConfig;
    });

    let unmatchedDocRequestConfigs = [
      ...docIdToUnmatchedRequestConfig.values(),
    ];

    const matchedOasIndices = new Set<number>();
    const matchedDocIndices = new Set<number>();
    for (const [i, oasRequestConfig] of unmatchedOasRequestConfigs.entries()) {
      if (matchedOasIndices.has(i)) continue;
      for (const [
        j,
        docRequestConfig,
      ] of unmatchedDocRequestConfigs.entries()) {
        if (
          matchedOasIndices.has(i) ||
          matchedDocIndices.has(j) ||
          !areEqualRequestConfig(oasRequestConfig, docRequestConfig)
        ) {
          continue;
        }

        matchedRequestKeys.add(
          `${oasRequestConfig.method} ${oasPathSegsToPath(
            oasRequestConfig.pathSegs,
          )}`,
        );
        matchedOasIndices.add(i);
        matchedDocIndices.add(j);
      }
    }
    unmatchedOasRequestConfigs = unmatchedOasRequestConfigs.filter(
      (_, i) => !matchedOasIndices.has(i),
    );
    unmatchedDocRequestConfigs = unmatchedDocRequestConfigs.filter(
      (_, i) => !matchedDocIndices.has(i),
    );

    matchedDocIndices.clear();
    for (const [i, docRequestConfig] of unmatchedDocRequestConfigs.entries()) {
      if (matchedDocIndices.has(i)) continue;
      for (const oasRequestConfig of oasIdToRequestConfig.values()) {
        if (!areEqualRequestConfig(oasRequestConfig, docRequestConfig)) {
          continue;
        }
        matchedDocIndices.add(i);
      }
    }
    unmatchedDocRequestConfigs = unmatchedDocRequestConfigs.filter(
      (_, i) => !matchedDocIndices.has(i),
    );

    const allOasRequestConfigs = [...oasIdToRequestConfig.values()];
    const unmatchedRequestConfigsTable: (
      | Conflict[]
      | 'different-request-configs'
    )[][] = [...Array(allOasRequestConfigs.length)].map(() =>
      Array(unmatchedDocRequestConfigs.length).fill(
        'different-request-configs',
      ),
    );

    for (const [i, oasRequestConfig] of allOasRequestConfigs.entries()) {
      for (const [
        j,
        docRequestConfig,
      ] of unmatchedDocRequestConfigs.entries()) {
        if (areDifferentPaths(oasRequestConfig, docRequestConfig)) continue;

        const conflicts: Conflict[] = [];
        if (oasRequestConfig.method !== docRequestConfig.method) {
          conflicts.push({ type: 'method-mismatch' });
        }

        const serversConflicts = [...oasRequestConfig.servers, void 0].map(
          (s, i, arr) => {
            if (
              s &&
              !(
                (docRequestConfig.scheme &&
                  s.scheme === docRequestConfig.scheme) ||
                (docRequestConfig.host && s.host === docRequestConfig.host) ||
                (s.basePath &&
                  s.basePath.some(sPart =>
                    docRequestConfig.pathSegs.some(dPart =>
                      isEqual(sPart, dPart),
                    ),
                  ))
              )
            ) {
              return [s, null] as const;
            }
            const serverConflicts: Conflict[] = [];
            if (s) {
              const { host, scheme } = s;
              if (docRequestConfig.host && host !== docRequestConfig.host) {
                serverConflicts.push({
                  type: 'host-mismatch',
                  oasHost: host,
                });
              }
              if (
                docRequestConfig.scheme &&
                scheme &&
                scheme !== docRequestConfig.scheme
              ) {
                serverConflicts.push({
                  type: 'doc-scheme-not-supported-by-oas-server',
                });
              }
            }

            const basePath = s?.basePath ?? [];
            const lengthDiff =
              basePath.length +
              oasRequestConfig.pathSegs.length -
              docRequestConfig.pathSegs.length;

            if (lengthDiff >= 0) {
              const partialBasePath = basePath.slice(lengthDiff);
              const oasFullPathSegs = [
                ...partialBasePath,
                ...oasRequestConfig.pathSegs,
              ];
              let parameterIndex = -1;
              for (const [k, oasPart] of oasFullPathSegs.entries()) {
                if (oasPart.type === 'parameter') parameterIndex++;
                const docPart = docRequestConfig.pathSegs[k];
                if (!docPart) {
                  throw new Error('Expected doc path part to be defined');
                }
                if (isEqual(oasPart, docPart)) continue;
                if (
                  oasPart.type === 'parameter' &&
                  docPart.type === 'parameter' &&
                  !areEqualParams(
                    oasFullPathSegs,
                    k,
                    docRequestConfig.pathSegs,
                    k,
                  )
                ) {
                  serverConflicts.push({
                    type: 'path-parameter-name-mismatch',
                    parameterIndex,
                    oasServerIndex: i === arr.length - 1 ? null : i,
                  });
                }
              }
            }
            return [s, serverConflicts] as const;
          },
        );

        const serverConflicts = serversConflicts.reduce((si1, si2) => {
          const [s1, i1] = si1;
          const [, i2] = si2;
          if (i1 === null) return si2;
          if (i2 === null) return si1;
          if (i1.length === i2.length) return s1 === void 0 ? si2 : si1;
          return i1.length > i2.length ? si2 : si1;
        })?.[1];

        const oasRequestConfigConflicts = unmatchedRequestConfigsTable[i];
        if (!oasRequestConfigConflicts) {
          throw new Error('Expected conflicts to be defined');
        }
        oasRequestConfigConflicts[j] = [
          ...conflicts,
          ...(serverConflicts ?? []),
        ];
      }
    }

    const failOutput: FailOutput = [];

    const handledOasIndices = new Set<number>();
    const handledDocIndices = new Set<number>();

    for (const unmatchedOasRequestConfig of unmatchedOasRequestConfigs) {
      const index = allOasRequestConfigs.findIndex(c =>
        isEqual(c, unmatchedOasRequestConfig),
      );
      assert(index !== -1, 'Expected index to be defined');
      const oasRequestConfigConflicts = unmatchedRequestConfigsTable[index];
      if (!oasRequestConfigConflicts) {
        throw new Error('Inconsistency table is not instantiated fully');
      }
      const onlyInOas = oasRequestConfigConflicts.every(
        i => i === 'different-request-configs',
      );
      if (onlyInOas) {
        failOutput.push({
          type: 'only-in-oas',
          requestConfig: unmatchedOasRequestConfig,
        });
      }
      const hasFullMatch = oasRequestConfigConflicts.some(
        i => i !== 'different-request-configs' && i.length === 0,
      );
      if (onlyInOas || hasFullMatch) handledOasIndices.add(index);
    }

    for (const [
      index,
      unmatchedDocRequestConfig,
    ] of unmatchedDocRequestConfigs.entries()) {
      const docRequestConfigConflicts = unmatchedRequestConfigsTable.map(
        row => {
          const docRequestConfigInconsistency = row[index];
          if (!docRequestConfigInconsistency) {
            throw new Error('Inconsistency table is not instantiated fully');
          }
          return docRequestConfigInconsistency;
        },
      );

      const notDifferent = docRequestConfigConflicts.flatMap((i, index) =>
        i === 'different-request-configs' ? [] : [index],
      );

      const onlyInDoc =
        notDifferent.length === 0 ||
        notDifferent.every(i => {
          const oasRequestConfig = allOasRequestConfigs[i];
          assert(
            oasRequestConfig,
            `No unmatched oas requestConfig with index ${i}`,
          );
          const oasKey = `${oasRequestConfig.method} ${oasPathSegsToPath(
            oasRequestConfig.pathSegs,
          )}`;
          return (
            matchedRequestKeys.has(oasKey) &&
            [...tableToRequestKeys.values()].some(
              keys =>
                keys.some(
                  requestKey => requestKey === oasKeyToDocKey.get(oasKey),
                ) &&
                keys.some(
                  requestKey =>
                    requestKey ===
                    `${unmatchedDocRequestConfig.method} ${unmatchedDocRequestConfig.originalPath}`,
                ),
            )
          );
        });

      if (onlyInDoc) {
        failOutput.push({
          type: 'only-in-doc',
          requestConfig: unmatchedDocRequestConfig,
        });
      }
      const hasFullMatch = docRequestConfigConflicts.some(
        i => i !== 'different-request-configs' && i.length === 0,
      );
      if (onlyInDoc || hasFullMatch) handledDocIndices.add(index);
    }

    const conflictsMap = new Map<string, Conflict[]>();
    const oasIndexToDocIndicesInconsistencyMatches = new Map<
      number,
      number[]
    >();
    const docIndexToOasIndicesInconsistencyMatches = new Map<
      number,
      number[]
    >();

    for (const [i, row] of unmatchedRequestConfigsTable.entries()) {
      const oasRequestConfig = allOasRequestConfigs[i];
      assert(
        oasRequestConfig,
        `No unmatched oas requestConfig with index ${i}`,
      );
      if (handledOasIndices.has(i)) {
        continue;
      }
      for (const [j, conflicts] of row.entries()) {
        if (
          handledDocIndices.has(j) ||
          conflicts === 'different-request-configs'
        ) {
          continue;
        }
        conflictsMap.set(makeKey([i, j]), conflicts);
        mapGetOrSetDefault(
          oasIndexToDocIndicesInconsistencyMatches,
          i,
          [],
        ).push(j);
        mapGetOrSetDefault(
          docIndexToOasIndicesInconsistencyMatches,
          j,
          [],
        ).push(i);
      }
    }

    const bestMatches = findBestMatches(
      oasIndexToDocIndicesInconsistencyMatches,
      docIndexToOasIndicesInconsistencyMatches,
      conflictsMap,
    );

    for (const i of bestMatches.unmatchedOas) {
      const requestConfig = allOasRequestConfigs[i];
      assert(requestConfig, `No unmatched oas requestConfig with index ${i}`);
      if (!unmatchedOasRequestConfigs.some(c => isEqual(c, requestConfig))) {
        continue;
      }
      failOutput.push({ type: 'only-in-oas', requestConfig });
    }

    for (const i of bestMatches.unmatchedDoc) {
      const requestConfig = unmatchedDocRequestConfigs[i];
      assert(requestConfig, `No unmatched doc requestConfig with index ${i}`);
      failOutput.push({ type: 'only-in-doc', requestConfig });
    }

    for (const [i, j] of bestMatches.bestMatchesOasToDoc) {
      const oasRequestConfig = allOasRequestConfigs[i];
      assert(
        oasRequestConfig,
        `No unmatched oas requestConfig with index ${i}`,
      );
      const docRequestConfig = unmatchedDocRequestConfigs[j];
      assert(
        docRequestConfig,
        `No unmatched doc requestConfig with index ${i}`,
      );
      const conflicts = conflictsMap.get(makeKey([i, j]));
      assert(conflicts, `No conflicts for [${i}, ${j}]`);
      if (!conflicts) continue;
      failOutput.push({
        type: 'match-with-conflicts',
        oasRequestConfig,
        docRequestConfig,
        conflicts,
      });
    }

    const isTestEnv = process.env.NODE_ENV === 'test';
    const githubBase = () =>
      `https://github.com/${github.context.repo.owner}/${github.context.repo.repo}/blob/${github.context.sha}`;
    const output = isTestEnv
      ? process.env.OAS_PATH && process.env.DOC_PATH
        ? formatOutput(failOutput, {
            oasPath: process.env.OAS_PATH,
            docPath: process.env.DOC_PATH,
          })
        : ''
      : formatOutput(failOutput, {
          oasPath: `${githubBase()}/${oasPath}`,
          docPath: `${githubBase()}/${docPath}`,
        });

    if (token !== '') {
      const octokit = github.getOctokit(token);
      const { context } = github;
      if (context.eventName === 'pull_request') {
        const issue_number =
          context.payload.pull_request?.number ?? context.issue.number;
        core.debug(`Commenting on issue ${issue_number}`);
        await octokit.rest.issues.createComment({
          issue_number,
          owner: context.repo.owner,
          repo: context.repo.repo,
          body: output,
        });
      }
    }

    if (isTestEnv && !process.env.OAS_PATH && !process.env.DOC_PATH) {
      await writeFile(join(import.meta.dir, 'tests', 'output.md'), output);
    }

    if (failOutput.length > 0) {
      throw new Error(JSON.stringify(failOutput));
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message);
  }
};
