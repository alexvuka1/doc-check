import * as core from '@actions/core';
import * as github from '@actions/github';
import SwaggerParser from '@apidevtools/swagger-parser';
import { differenceWith, isEqual } from 'lodash-es';
import { Node, Root } from 'mdast';
import { remark } from 'remark';
import remarkSectionize from 'remark-sectionize';
import { convertFile } from 'swagger2openapi';
import { read } from 'to-vfile';
import { selectAll } from 'unist-util-select';
import { visit } from 'unist-util-visit';
import { visitParents } from 'unist-util-visit-parents';
import { isLiteralNode, literalsToCheck } from './ast';
import {
  DocEndpoint,
  FailOutput,
  Inconsistency,
  Method,
  OasEndpoint,
  methods,
} from './parsing';
import { mdCreateEndpoint } from './parsing/markdown';
import { getServersInfo, isV2, oasParsePath } from './parsing/openapi';
import { extractPath, getMethodRegex, oasGetEndpointRegex } from './regex';
import { objectEntries } from './utils';

export const run = async () => {
  try {
    const oasPath = core.getInput('openapi-path', { required: true });
    const docPath = core.getInput('doc-path', { required: true });
    const token = core.getInput('token');

    const oasDoc = await SwaggerParser.validate(oasPath);
    const oas = isV2(oasDoc)
      ? (await convertFile(oasPath, {})).openapi
      : oasDoc;

    const oasServers = getServersInfo(oas.servers);

    const oasIdToEndpoint = new Map<string, OasEndpoint>(
      oas.paths
        ? objectEntries(oas.paths).flatMap(([path, pathItem]) =>
            methods.flatMap(method => {
              if (!pathItem) return [];
              const operation = pathItem[method];
              if (!operation) return [];
              const serversInfo = operation.servers
                ? getServersInfo(operation.servers)
                : pathItem.servers
                  ? getServersInfo(pathItem.servers)
                  : oasServers;
              return [
                [
                  // OpenAPI defines a unique operation as a combination of a path and an HTTP method.
                  `${method} ${path}`,
                  {
                    method,
                    servers: serversInfo,
                    pathParts: oasParsePath(path),
                  } satisfies OasEndpoint,
                ],
              ] as const;
            }),
          )
        : [],
    );

    const docAST = remark().parse(await read(docPath));
    const tree = remark().use(remarkSectionize).runSync(docAST) as Root;

    const oasEndpointIdToDocMatches = new Map<
      string,
      {
        node: Node & { type: (typeof literalsToCheck)[number] };
        parentSelector: string;
      }[]
    >([...oasIdToEndpoint.keys()].map(k => [k, []] as const));

    const docSelectorToMatchedNodes = new Map<string, Set<Node>>();

    for (const literal of literalsToCheck) {
      visitParents(tree, literal, (node, ancestors) => {
        for (const [endpointId, endpoint] of oasIdToEndpoint.entries()) {
          const containsMethod = getMethodRegex(methods).test(node.value);
          if (!containsMethod) continue;
          const containsPath = oasGetEndpointRegex(endpoint).test(node.value);
          if (!containsPath) continue;
          const docMatches = oasEndpointIdToDocMatches.get(endpointId);
          if (!docMatches) {
            throw new Error(
              'Map should have been initialised to have entries for all oas paths',
            );
          }
          const parentSelector = ancestors.map(a => a.type).join(' > ');
          docMatches.push({ node, parentSelector });
          let matchedNodes = docSelectorToMatchedNodes.get(parentSelector);
          if (!matchedNodes) {
            matchedNodes = new Set();
            docSelectorToMatchedNodes.set(parentSelector, matchedNodes);
          }
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
          if (!method || !node.value.includes('/')) return;
          const path = extractPath(node.value);
          if (!path) return;
          const id = `${method} ${path}`;
          if (docIdToUnmatchedEndpoint.has(id)) return;
          const endpoint = mdCreateEndpoint(method, path);
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
          if (!method || !sibling.value.includes('/')) continue;
          const path = extractPath(sibling.value);
          if (!path) continue;
          const id = `${method} ${path}`;
          if (docIdToUnmatchedEndpoint.has(id)) continue;
          const endpoint = mdCreateEndpoint(method, path);
          docIdToUnmatchedEndpoint.set(id, endpoint);
        }
      }
    }

    let unmatchedOasEndpoints = differenceWith(
      [...oasIdToEndpoint.keys()],
      [...oasEndpointIdToDocMatches.entries()]
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
      // Note assumes that the base path will be in the documentation path, which might not be the case in general
      return isEqual(
        [...(server?.basePath ?? []), ...oasEndpoint.pathParts],
        docEndpoint.pathParts,
      );
    };

    const matchedOasIndices = new Set<number>();
    const matchedDocIndices = new Set<number>();
    for (const [i, oasEndpoint] of unmatchedOasEndpoints.entries()) {
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

    let unmatchedEndpointsTable: (Inconsistency[] | 'different-endpoints')[][] =
      [...Array(unmatchedOasEndpoints.length)].map(() =>
        Array(unmatchedDocEndpoints.length).fill('different-endpoints'),
      );

    for (const [i, oasEndpoint] of unmatchedOasEndpoints.entries()) {
      for (const [j, docEndpoint] of unmatchedDocEndpoints.entries()) {
        if (
          oasEndpoint.servers.length === 0 &&
          oasEndpoint.pathParts.length !== docEndpoint.pathParts.length
        ) {
          continue;
        }

        const inconsistencies: Inconsistency[] = [];
        if (oasEndpoint.method !== docEndpoint.method) {
          inconsistencies.push({ type: 'method-mismatch' });
        }

        const partialMatchServers = oasEndpoint.servers.filter(
          s =>
            (docEndpoint.scheme && s.schemes?.includes(docEndpoint.scheme)) ||
            (docEndpoint.host && s.host === docEndpoint.host) ||
            (s.basePath &&
              s.basePath.some(sPart =>
                docEndpoint.pathParts.some(dPart => isEqual(sPart, dPart)),
              )),
        );
        if (partialMatchServers.length > 1) {
          throw new Error(
            'Multiple partially matching servers currently not supported',
          );
        }
        const [partialMatchServer] = partialMatchServers;
        if (partialMatchServer) {
          const { host, schemes } = partialMatchServer;
          if (docEndpoint.host && host !== docEndpoint.host) {
            inconsistencies.push({ type: 'host-mismatch', oasHost: host });
          }
          if (
            docEndpoint.scheme &&
            schemes &&
            schemes.includes(docEndpoint.scheme)
          ) {
            inconsistencies.push({
              type: 'doc-scheme-not-supported-by-oas-server',
            });
          }
        }
        const oasFullPathParts =
          oasEndpoint.pathParts.length < docEndpoint.pathParts.length
            ? [
                ...(partialMatchServer?.basePath ?? []),
                ...oasEndpoint.pathParts,
              ]
            : oasEndpoint.pathParts;
        if (oasFullPathParts.length === docEndpoint.pathParts.length) {
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
              inconsistencies.push({
                type: 'parameter-name-mismatch',
                parameterIndex,
              });
            }
          }
        }

        const oasEndpointInconsistencies = unmatchedEndpointsTable[i];
        if (!oasEndpointInconsistencies) {
          throw new Error('Expected inconsistencies to be defined');
        }
        oasEndpointInconsistencies[j] = inconsistencies;
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

    unmatchedEndpointsTable = unmatchedEndpointsTable.flatMap((row, i) => {
      if (handledOasIndices.has(i)) return [];
      return [
        row.flatMap((inconsistency, j) => {
          if (handledDocIndices.has(j)) return [];
          return [inconsistency];
        }),
      ];
    });
    console.log(unmatchedOasEndpoints, unmatchedDocEndpoints);

    const successMsg = 'Success - No inconsistencies found!';

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
          body: failOutput.length > 0 ? failOutput.join('\n') : successMsg,
        });
      }
    }

    if (failOutput.length > 0) {
      throw new Error(JSON.stringify(failOutput));
    }
    core.debug(successMsg);
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message);
  }
};
