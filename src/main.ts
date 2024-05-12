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
import { DocEndpoint, Method, OasEndpoint, methods } from './parsing';
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

    const unmatchedOasPaths = differenceWith(
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

    const areEqualEndpoints = (
      oasEndpoint: OasEndpoint,
      docEndpoint: DocEndpoint,
    ) => {
      const { scheme, host } = docEndpoint;
      const docHasServer = scheme || host;
      const server = docHasServer
        ? oasEndpoint.servers.find(
            s =>
              (!scheme || s.schemes?.includes(scheme)) &&
              (!host || s.host?.includes(host)),
          )
        : null;
      if (docHasServer && !server) return false;
      // Note assumes that the base path will be in the documentation path, which might not be the case in general
      return isEqual(
        [...(server?.basePath ?? []), ...oasEndpoint.pathParts],
        docEndpoint.pathParts,
      );
    };
    const notDocumented = differenceWith(
      unmatchedOasPaths,
      [...docIdToUnmatchedEndpoint.values()],
      areEqualEndpoints,
    );

    const outdated = differenceWith(
      [...docIdToUnmatchedEndpoint.values()],
      unmatchedOasPaths,
      (docEndpt, oasEndpt) => areEqualEndpoints(oasEndpt, docEndpt),
    );

    const errors = [];
    if (notDocumented.length > 0) {
      errors.push(`Not Documented: ${notDocumented.join(', ')}`);
    }
    if (outdated.length > 0) {
      errors.push(`Outdated: ${outdated.join(', ')}`);
    }

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
          body: errors.length > 0 ? errors.join('\n') : successMsg,
        });
      }
    }

    if (errors.length > 0) {
      throw new Error(JSON.stringify({ notDocumented, outdated }));
    }
    core.debug(successMsg);
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message);
  }
};
