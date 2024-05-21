import * as core from '@actions/core';
import * as github from '@actions/github';
import assert from 'assert';
import { writeFile } from 'fs/promises';
import { differenceWith, isEqual } from 'lodash-es';
import { Node } from 'mdast';
import { join } from 'path';
import { selectAll } from 'unist-util-select';
import { visit } from 'unist-util-visit';
import { visitParents } from 'unist-util-visit-parents';
import { codeLangsToCheck, isLiteralNode, literalsToCheck } from './ast';
import { formatOutput } from './formatOutput';
import { findBestMatches } from './matching';
import {
  DocEndpoint,
  FailOutput,
  Inconsistency,
  Method,
  OasEndpoint,
  methods,
} from './parsing';
import {
  docCreateEndpoint,
  docParse,
  extractPath,
  getMethodRegex,
  oasEndpointToDocRegex,
} from './parsing/markdown';
import { oasParse, oasParseEndpoints } from './parsing/openapi';
import { makeKey, mapGetOrSetDefault } from './utils';

export const run = async () => {
  try {
    const oasPath = core.getInput('openapi-path', { required: true });
    const docPath = core.getInput('doc-path', { required: true });
    const token = core.getInput('token');

    const oas = await oasParse(oasPath);

    const oasIdToEndpoint = oasParseEndpoints(oas);

    const tree = await docParse(docPath);

    const oasIdToDocMatches = new Map<
      string,
      {
        node: Node & { type: (typeof literalsToCheck)[number] };
        parentSelector: string;
      }[]
    >([...oasIdToEndpoint.keys()].map(k => [k, []] as const));

    const docSelectorToMatchedNodes = new Map<string, Set<Node>>();

    for (const literal of literalsToCheck) {
      visitParents(tree, literal, (node, ancestors) => {
        if (
          node.type === 'code' &&
          !codeLangsToCheck.some(l => l === node.lang)
        ) {
          return;
        }
        for (const [endpointId, endpoint] of oasIdToEndpoint.entries()) {
          const containsMethod = getMethodRegex([endpoint.method]).test(
            node.value,
          );
          if (!containsMethod) continue;
          const containsPath = oasEndpointToDocRegex(endpoint).test(node.value);
          if (!containsPath) continue;
          const docMatches = oasIdToDocMatches.get(endpointId);
          if (!docMatches) {
            throw new Error(
              'Map should have been initialised to have entries for all oas paths',
            );
          }
          const parentSelector = ancestors.map(a => a.type).join(' > ');
          docMatches.push({ node, parentSelector });
          const matchedNodes = mapGetOrSetDefault(
            docSelectorToMatchedNodes,
            parentSelector,
            new Set(),
          );
          matchedNodes.add(node);
        }
      });
    }

    const docIdToUnmatchedEndpoint = new Map<string, DocEndpoint>();

    if (docSelectorToMatchedNodes.size === 0) {
      for (const literal of literalsToCheck) {
        visit(tree, literal, node => {
          const method = getMethodRegex(methods)
            .exec(node.value)?.[0]
            .toLowerCase() as Method | undefined;
          if (!method) return;
          const path = extractPath(node.value);
          if (!path) return;
          const id = `${method} ${path}`;
          if (docIdToUnmatchedEndpoint.has(id)) return;
          const { position } = node;
          assert(position);
          const endpoint = docCreateEndpoint(method, path, position.start.line);
          docIdToUnmatchedEndpoint.set(id, endpoint);
        });
      }
    } else {
      for (const [
        parentSelector,
        matchedNodes,
      ] of docSelectorToMatchedNodes.entries()) {
        const siblingSelector = literalsToCheck
          .map(l => [parentSelector, l].join(' > '))
          .join(', ');
        const siblings = selectAll(siblingSelector, tree);
        for (const sibling of siblings) {
          if (!isLiteralNode(sibling)) throw new Error('Expected literal node');
          if (matchedNodes.has(sibling)) continue;
          const method = getMethodRegex(methods)
            .exec(sibling.value)?.[0]
            .toLowerCase() as Method | undefined;
          if (!method) continue;
          const path = extractPath(sibling.value);
          if (!path) continue;
          const id = `${method} ${path}`;
          if (docIdToUnmatchedEndpoint.has(id)) continue;
          const { position } = sibling;
          assert(position);
          const endpoint = docCreateEndpoint(method, path, position.start.line);
          docIdToUnmatchedEndpoint.set(id, endpoint);
        }
      }
    }

    let unmatchedOasEndpoints = differenceWith(
      [...oasIdToEndpoint.keys()],
      [...oasIdToDocMatches.entries()]
        .filter(([, docMatches]) => docMatches.length > 0)
        .map(([id]) => id),
      isEqual,
    ).map(id => {
      const oasEndpoint = oasIdToEndpoint.get(id);
      if (!oasEndpoint) throw new Error('Expected oas path to be defined');
      return oasEndpoint;
    });
    let unmatchedDocEndpoints = [...docIdToUnmatchedEndpoint.values()];

    const areEqualEndpoints = (
      oasEndpoint: OasEndpoint,
      docEndpoint: DocEndpoint,
    ) => {
      if (oasEndpoint.method !== docEndpoint.method) return false;
      const { scheme, host } = docEndpoint;
      const docHasServer =
        scheme ||
        host ||
        oasEndpoint.pathParts.length < docEndpoint.pathParts.length;
      const server = docHasServer
        ? oasEndpoint.servers.find(
            s =>
              (!scheme || s.schemes?.includes(scheme)) &&
              (!host || s.host?.includes(host)) &&
              (oasEndpoint.pathParts.length === docEndpoint.pathParts.length ||
                (s.basePath &&
                  s.basePath.length + oasEndpoint.pathParts.length ===
                    docEndpoint.pathParts.length &&
                  s.basePath.every((part, i) =>
                    isEqual(part, docEndpoint.pathParts[i]),
                  ))),
          )
        : null;
      if (docHasServer && !server) return false;

      return isEqual(
        [...(server?.basePath ?? []), ...oasEndpoint.pathParts],
        docEndpoint.pathParts,
      );
    };

    const matchedOasIndices = new Set<number>();
    const matchedDocIndices = new Set<number>();
    for (const [i, oasEndpoint] of unmatchedOasEndpoints.entries()) {
      if (matchedOasIndices.has(i)) continue;
      for (const [j, docEndpoint] of unmatchedDocEndpoints.entries()) {
        if (
          matchedOasIndices.has(i) ||
          matchedDocIndices.has(j) ||
          !areEqualEndpoints(oasEndpoint, docEndpoint)
        ) {
          continue;
        }
        matchedOasIndices.add(i);
        matchedDocIndices.add(j);
      }
    }
    unmatchedOasEndpoints = unmatchedOasEndpoints.filter(
      (_, i) => !matchedOasIndices.has(i),
    );
    unmatchedDocEndpoints = unmatchedDocEndpoints.filter(
      (_, i) => !matchedDocIndices.has(i),
    );

    matchedDocIndices.clear();
    for (const [i, docEndpoint] of unmatchedDocEndpoints.entries()) {
      if (matchedDocIndices.has(i)) continue;
      for (const oasEndpoint of oasIdToEndpoint.values()) {
        if (!areEqualEndpoints(oasEndpoint, docEndpoint)) {
          continue;
        }
        matchedDocIndices.add(i);
      }
    }
    unmatchedDocEndpoints = unmatchedDocEndpoints.filter(
      (_, i) => !matchedDocIndices.has(i),
    );

    const unmatchedEndpointsTable: (
      | Inconsistency[]
      | 'different-endpoints'
    )[][] = [...Array(unmatchedOasEndpoints.length)].map(() =>
      Array(unmatchedDocEndpoints.length).fill('different-endpoints'),
    );

    const areDifferentPaths = (
      oasEndpoint: OasEndpoint,
      docEndpoint: DocEndpoint,
    ) =>
      ![
        ...oasEndpoint.servers,
        {} satisfies (typeof oasEndpoint.servers)[number],
      ].some(s => {
        const basePath = s.basePath ?? [];
        if (oasEndpoint.pathParts.length > docEndpoint.pathParts.length) {
          return false;
        }
        const lengthDiff =
          basePath.length +
          oasEndpoint.pathParts.length -
          docEndpoint.pathParts.length;
        if (lengthDiff < 0) return false;
        const partialBasePath = basePath.slice(lengthDiff);
        const oasPath = [...partialBasePath, ...oasEndpoint.pathParts];
        return (
          oasPath.length === docEndpoint.pathParts.length &&
          oasPath.every((oasP, i) => {
            const docP = docEndpoint.pathParts[i];
            return (
              (docP &&
                oasP.type === 'parameter' &&
                docP.type === 'parameter') ||
              isEqual(oasP, docP)
            );
          })
        );
      });

    for (const [i, oasEndpoint] of unmatchedOasEndpoints.entries()) {
      for (const [j, docEndpoint] of unmatchedDocEndpoints.entries()) {
        if (areDifferentPaths(oasEndpoint, docEndpoint)) continue;

        const inconsistencies: Inconsistency[] = [];
        if (oasEndpoint.method !== docEndpoint.method) {
          inconsistencies.push({ type: 'method-mismatch' });
        }

        const serversInconsistencies = [...oasEndpoint.servers, void 0].map(
          (s, i, arr) => {
            if (
              s &&
              !(
                (docEndpoint.scheme &&
                  s.schemes?.includes(docEndpoint.scheme)) ||
                (docEndpoint.host && s.host === docEndpoint.host) ||
                (s.basePath &&
                  s.basePath.some(sPart =>
                    docEndpoint.pathParts.some(dPart => isEqual(sPart, dPart)),
                  ))
              )
            ) {
              return [s, null] as const;
            }
            const serverInconsistencies: Inconsistency[] = [];
            if (s) {
              const { host, schemes } = s;
              if (docEndpoint.host && host !== docEndpoint.host) {
                serverInconsistencies.push({
                  type: 'host-mismatch',
                  oasHost: host,
                });
              }
              if (
                docEndpoint.scheme &&
                schemes &&
                schemes.includes(docEndpoint.scheme)
              ) {
                serverInconsistencies.push({
                  type: 'doc-scheme-not-supported-by-oas-server',
                });
              }
            }

            const basePath = s?.basePath ?? [];
            const lengthDiff =
              basePath.length +
              oasEndpoint.pathParts.length -
              docEndpoint.pathParts.length;

            if (lengthDiff >= 0) {
              const partialBasePath = basePath.slice(lengthDiff);
              const oasFullPathParts = [
                ...partialBasePath,
                ...oasEndpoint.pathParts,
              ];
              let parameterIndex = -1;
              for (const [k, oasPart] of oasFullPathParts.entries()) {
                if (oasPart.type === 'parameter') parameterIndex++;
                const docPart = docEndpoint.pathParts[k];
                if (!docPart) {
                  throw new Error('Expected doc path part to be defined');
                }
                if (isEqual(oasPart, docPart)) continue;
                if (
                  oasPart.type === 'parameter' &&
                  docPart.type === 'parameter' &&
                  oasPart.name !== docPart.name
                ) {
                  serverInconsistencies.push({
                    type: 'path-path-parameter-name-mismatch',
                    parameterIndex,
                    oasServerIndex: i === arr.length - 1 ? null : i,
                  });
                }
              }
            }
            return [s, serverInconsistencies] as const;
          },
        );

        const serverInconsistencies = serversInconsistencies.reduce(
          (si1, si2) => {
            const [s1, i1] = si1;
            const [, i2] = si2;
            if (i1 === null || i1.length === 0) return si2;
            if (i2 === null || i2.length === 0) return si1;
            if (i1.length === i2.length) {
              return s1 === void 0 ? si1 : si2;
            }
            return i1.length > i2.length ? si2 : si1;
          },
        )?.[1];

        const oasEndpointInconsistencies = unmatchedEndpointsTable[i];
        if (!oasEndpointInconsistencies) {
          throw new Error('Expected inconsistencies to be defined');
        }
        oasEndpointInconsistencies[j] = [
          ...inconsistencies,
          ...(serverInconsistencies ?? []),
        ];
      }
    }

    const failOutput: FailOutput = [];

    const handledOasIndices = new Set<number>();
    const handledDocIndices = new Set<number>();

    for (const [
      index,
      unmatchedOasEndpoint,
    ] of unmatchedOasEndpoints.entries()) {
      const oasEndpointInconsistencies = unmatchedEndpointsTable[index];
      if (!oasEndpointInconsistencies) {
        throw new Error('Inconsistency table is not instantiated fully');
      }
      if (oasEndpointInconsistencies.some(i => i !== 'different-endpoints')) {
        continue;
      }
      failOutput.push({
        type: 'only-in-oas',
        endpoint: unmatchedOasEndpoint,
      });
      handledOasIndices.add(index);
    }
    for (const [
      index,
      unmatchedDocEndpoint,
    ] of unmatchedDocEndpoints.entries()) {
      const docEnpointInconsistencies = unmatchedEndpointsTable.map(row => {
        const docEnpointInconsistency = row[index];
        if (!docEnpointInconsistency) {
          throw new Error('Inconsistency table is not instantiated fully');
        }
        return docEnpointInconsistency;
      });
      if (docEnpointInconsistencies.some(i => i !== 'different-endpoints')) {
        continue;
      }
      failOutput.push({
        type: 'only-in-doc',
        endpoint: unmatchedDocEndpoint,
      });
      handledDocIndices.add(index);
    }

    const inconsistenciesMap = new Map<string, Inconsistency[]>();
    const oasIndexToDocIndicesInconsistencyMatches = new Map<
      number,
      number[]
    >();
    const docIndexToOasIndicesInconsistencyMatches = new Map<
      number,
      number[]
    >();
    for (const [i, row] of unmatchedEndpointsTable.entries()) {
      if (handledOasIndices.has(i)) continue;
      for (const [j, inconsistencies] of row.entries()) {
        if (
          handledDocIndices.has(j) ||
          inconsistencies === 'different-endpoints'
        ) {
          continue;
        }
        inconsistenciesMap.set(makeKey([i, j]), inconsistencies);
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
      inconsistenciesMap,
    );

    for (const [i, j] of bestMatches) {
      const oasEndpoint = unmatchedOasEndpoints[i];
      const docEndpoint = unmatchedDocEndpoints[j];
      const inconsistencies = inconsistenciesMap.get(makeKey([i, j]));
      assert(oasEndpoint && docEndpoint && inconsistencies);
      failOutput.push({
        type: 'match-with-inconsistenties',
        oasEndpoint,
        docEndpoint,
        inconsistencies,
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

    if (isTestEnv) {
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
