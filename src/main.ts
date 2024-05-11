import * as core from '@actions/core';
import * as github from '@actions/github';
import SwaggerParser from '@apidevtools/swagger-parser';
import { differenceWith, isEqual } from 'lodash-es';
import { Node, Root } from 'mdast';
import { remark } from 'remark';
import remarkSectionize from 'remark-sectionize';
import { convertObj } from 'swagger2openapi';
import { read } from 'to-vfile';
import { selectAll } from 'unist-util-select';
import { visitParents } from 'unist-util-visit-parents';
import { isLiteralNode, literalsToCheck } from './ast';
import {
  DocParsed,
  Endpoint,
  Method,
  OpenApiParsed,
  methods,
  methodsSet,
} from './parsing';
import { mdCreateEndpoint } from './parsing/markdown';
import { getServersInfo, isV2, oasParsePath } from './parsing/openapi';
import { extractPath, getMethodRegex, getPathRegex } from './regex';
import { objectEntries } from './utils';

export const run = async () => {
  try {
    const oasPath = core.getInput('openapi-path', { required: true });
    const docPath = core.getInput('doc-path', { required: true });
    const token = core.getInput('token');

    const oasDoc = await SwaggerParser.validate(oasPath);
    const oas = isV2(oasDoc) ? (await convertObj(oasDoc, {})).openapi : oasDoc;
    const oasServers = getServersInfo(oas.servers);
    const oasParsed: OpenApiParsed = {
      endpoints: oas.paths
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
                {
                  method,
                  servers: serversInfo,
                  pathParts: oasParsePath(path),
                } satisfies Endpoint,
              ];
            }),
          )
        : [],
    };

    const docAST = remark().parse(await read(docPath));
    const tree = remark().use(remarkSectionize).runSync(docAST) as Root;

    const docParsed: DocParsed = {
      endpoints: [],
    };

    const documentedEndpoints: {
      node: Node & { type: (typeof literalsToCheck)[number] };
      // parent: Parent;
      parentSelector: string;
      endpoint: Endpoint;
    }[] = [];

    for (const l of literalsToCheck) {
      visitParents(tree, l, (litNode, ancestors) => {
        const endpoint = oasParsed.endpoints.find(
          e =>
            getMethodRegex([e.method]).test(litNode.value) &&
            getPathRegex(e).test(litNode.value),
        );
        if (
          !endpoint ||
          documentedEndpoints.some(d => isEqual(d.endpoint, endpoint))
        ) {
          return;
        }
        documentedEndpoints.push({
          node: litNode,
          endpoint,
          // parent: ancestors[ancestors.length - 1],
          parentSelector: ancestors.map(a => a.type).join(' > '),
        });
      });
    }

    docParsed.endpoints = structuredClone(
      documentedEndpoints.map(d => d.endpoint),
    );

    for (const { node, parentSelector } of documentedEndpoints) {
      const siblingSelector = literalsToCheck
        .map(l => [parentSelector, l].join(' > '))
        .join(', ');
      const siblings = selectAll(siblingSelector, tree);
      for (const sibling of siblings) {
        if (!isLiteralNode(sibling) || sibling === node) continue;
        const matches = getMethodRegex(methods).exec(sibling.value);
        if (!matches || !sibling.value.includes('/')) continue;
        const match = matches[0].toLowerCase();
        if (!methodsSet.has(match as Method)) {
          throw new Error(`Matched method is not a valid method: ${match}`);
        }
        const method = match as Method;
        const path = extractPath(sibling.value);
        if (!path) continue;
        const endpoint = mdCreateEndpoint(method, path);
        if (documentedEndpoints.some(d => isEqual(d.endpoint, endpoint))) {
          continue;
        }
        docParsed.endpoints.push(endpoint);
      }
    }

    const notDocumented = differenceWith(
      oasParsed.endpoints,
      docParsed.endpoints,
      isEqual,
    );
    const outdated = differenceWith(
      docParsed.endpoints,
      oasParsed.endpoints,
      isEqual,
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
