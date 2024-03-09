import * as core from '@actions/core';
import * as github from '@actions/github';
import SwaggerParser from '@apidevtools/swagger-parser';
import { differenceWith, intersection, isEqual } from 'lodash-es';
import { Literals, Node, Root } from 'mdast';
import { OpenAPIV2, OpenAPIV3 } from 'openapi-types';
import { remark } from 'remark';
import remarkSectionize from 'remark-sectionize';
import { read } from 'to-vfile';
import { selectAll } from 'unist-util-select';
import {
  visitParents,
  type InclusiveDescendant,
  type Matches,
} from 'unist-util-visit-parents';
import { UnionToArray, objectEntries } from './utils';

const methods = intersection(
  Object.values(OpenAPIV2.HttpMethods),
  Object.values(OpenAPIV3.HttpMethods),
) as (`${OpenAPIV2.HttpMethods}` & `${OpenAPIV3.HttpMethods}`)[];
const methodsSet = new Set(methods);

type Method = (typeof methods)[number];

const getMethodRegex = (matchMethods: Method[]) => {
  const matchUnionStr = matchMethods.join('|');
  return new RegExp(
    `\\b(?<!\\/)\\[?${matchUnionStr}|${matchUnionStr.toUpperCase()}\\]?(?!\\/)\\b`,
  );
};

const getPathRegex = (path: string) => {
  const escapedPath = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(\\w)?(?<!\\w)${escapedPath}(?!\\w)(\\w)?`);
};

const extractPath = (str: string) => {
  const match = str.match(/\/\S*?(?=\s|\?|$)/);
  return match && !match[0].includes(' ') ? match[0] : null;
};

type Endpoint = {
  path: string;
  method: Method;
};

type OpenApiParsed = {
  endpoints: Endpoint[];
};

type DocParsed = {
  endpoints: Endpoint[];
};

export type DocCheckErrors = {
  outdated: Endpoint[];
  notDocumented: Endpoint[];
};

const mdastLiterals = [
  'code',
  'html',
  'inlineCode',
  'text',
  'yaml',
] as const satisfies UnionToArray<Literals['type']>;

const literalsToCheck = [
  'inlineCode',
  'text',
] as const satisfies (typeof mdastLiterals)[number][];

type LiteralNode = Matches<
  InclusiveDescendant<Root>,
  (typeof literalsToCheck)[number]
>;

const isLiteralNode = (node: Node): node is LiteralNode =>
  literalsToCheck.some(l => l === node.type);

export const run = async () => {
  try {
    const oasPath = core.getInput('openapi-path', { required: true });
    const docPath = core.getInput('doc-path', { required: true });
    const token = core.getInput('token');

    const oas = await SwaggerParser.validate(oasPath);
    const oasParsed: OpenApiParsed = {
      endpoints: oas.paths
        ? objectEntries(oas.paths).flatMap(([path, pathItem]) =>
            methods.flatMap(method => {
              if (!pathItem) return [];
              const operation = pathItem[method];
              if (!operation) return [];
              return [
                {
                  path,
                  method,
                },
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
            getPathRegex(e.path).test(litNode.value) &&
            getMethodRegex([e.method]).test(litNode.value),
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
        const endpoint: Endpoint = { method, path };
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
    console.log(error);
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message);
  }
};
