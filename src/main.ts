import * as core from '@actions/core';
import * as github from '@actions/github';
import SwaggerParser from '@apidevtools/swagger-parser';
import { differenceWith, intersection } from 'lodash-es';
import { Literals, Node, Parent, Root } from 'mdast';
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

const methods = intersection([
  ...(Object.values(OpenAPIV2.HttpMethods) as `${OpenAPIV2.HttpMethods}`[]),
  ...(Object.values(OpenAPIV3.HttpMethods) as `${OpenAPIV3.HttpMethods}`[]),
]) as (`${OpenAPIV2.HttpMethods}` & `${OpenAPIV3.HttpMethods}`)[];
type Method = (typeof methods)[number];

type OpenApiParsed = {
  endpoints: {
    path: string;
    method: Method;
  }[];
};

type DocParsed = {
  endpoints: string[];
};

export type DocCheckErrors = {
  outdated: {
    path: string;
    method: Method;
  }[];
  notDocumented: [];
};

const mdastLiterals = [
  'code',
  'html',
  'inlineCode',
  'text',
  'yaml',
] satisfies UnionToArray<Literals['type']>;

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

    const tree = (await remark()
      .use(remarkSectionize)
      .run(remark().parse(await read(docPath)))) as Root;

    const docParsed: DocParsed = {
      endpoints: [],
    };

    const literalsToCheck = [
      'inlineCode',
      'text',
    ] as const satisfies (typeof mdastLiterals)[number][];

    type LiteralNode = Matches<
      InclusiveDescendant<typeof tree>,
      (typeof literalsToCheck)[number]
    >;

    const isLiteralNode = (node: Node): node is LiteralNode =>
      literalsToCheck.some(l => l === node.type);

    const documentedEndpoints: {
      node: Node & { type: (typeof literalsToCheck)[number] };
      parent: Parent;
      selector: string;
    }[] = [];

    for (const l of literalsToCheck) {
      visitParents(tree, l, (litNode, ancestors) => {
        if (!oasParsed.endpoints.some(e => litNode.value.includes(e.path))) {
          return;
        }
        documentedEndpoints.push({
          node: litNode,
          parent: ancestors[ancestors.length - 1],
          selector: [...ancestors.map(a => a.type), litNode.type].join(' > '),
        });
      });
    }

    for (const { node, parent, selector } of documentedEndpoints) {
      console.log(selector);
      const a = selectAll(selector, tree);
      // console.log(a);
      // visitChildren(child => {
      //   if (!isLiteralNode(child) || child === node) return;
      //   console.log(child.value);
      // for (const method of methods) {
      //   if (!child.value.includes(method) || !child.value.includes('/')) {
      //     return;
      //   }
      //   docParsed.endpoints.push(child.value);
      // }
      // })(parent);
    }
    visitParents(tree, 'text', t => {
      for (const method of methods) {
        if (!t.value.includes(method) || !t.value.includes('/')) return;
        docParsed.endpoints.push(t.value);
      }
    });

    const notDocumented = differenceWith(
      oasParsed.endpoints,
      docParsed.endpoints,
      (a, b) => b.toLowerCase().includes(a.method) && b.includes(a.path),
    );
    const outdated = differenceWith(
      docParsed.endpoints,
      oasParsed.endpoints,
      (b, a) => b.toLowerCase().includes(a.method) && b.includes(a.path),
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
