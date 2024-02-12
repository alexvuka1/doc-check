import * as core from '@actions/core';
import SwaggerParser from '@apidevtools/swagger-parser';
import type { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import { remark } from 'remark';
import { read } from 'to-vfile';
import { visit } from 'unist-util-visit';
import { objectEntries } from './utils';
import { difference } from 'lodash-es';
import * as github from '@actions/github';

type Methods = OpenAPIV2.HttpMethods &
  OpenAPIV3.HttpMethods &
  OpenAPIV3_1.HttpMethods;

const methodMap = {
  get: 'GET',
  post: 'POST',
  put: 'PUT',
  delete: 'DELETE',
  head: 'HEAD',
  options: 'OPTIONS',
  patch: 'PATCH',
} as const satisfies Record<Methods, string>;

export const run = async () => {
  try {
    const oasPath = core.getInput('openapi-path', { required: true });
    const docPath = core.getInput('doc-path', { required: true });
    const token = core.getInput('token', { required: true });
    const octokit = github.getOctokit(token);
    const { context } = github;

    const oas = await SwaggerParser.validate(oasPath);
    const endpoints = oas.paths
      ? objectEntries(oas.paths).flatMap(([path, pathItem]) =>
          objectEntries(methodMap).flatMap(([m, v]) => {
            if (!pathItem) return [];
            const operation = pathItem[m];
            if (!operation) return [];
            return [`${v} ${path}` as const];
          }),
        )
      : [];

    const tree = remark().parse(await read(docPath));
    const docEndpoints: string[] = [];
    visit(tree, 'strong', v => {
      visit(v, 'text', t => {
        for (const m of Object.values(methodMap)) {
          if (!t.value.includes(m) || !t.value.includes('/')) return;
          docEndpoints.push(t.value);
        }
      });
    });

    const notDocumented = difference(endpoints, docEndpoints);
    const outdated = difference(docEndpoints, endpoints);

    const errors = [];
    if (notDocumented.length > 0) {
      errors.push(`Not Documented: ${notDocumented.join(', ')}`);
    }
    if (outdated.length > 0) {
      errors.push(`Outdated: ${outdated.join(', ')}`);
    }

    const body =
      errors.length > 0
        ? errors.join('\n')
        : 'Success - No inconsistencies found!';

    if (context.eventName === 'pull_request') {
      const issue_number =
        context.payload.pull_request?.number ?? context.issue.number;
      core.debug(`Commenting on issue ${issue_number}`);
      await octokit.rest.issues.createComment({
        issue_number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body,
      });
    }

    if (errors.length > 0) {
      throw new Error(body);
    }
    core.debug(body);
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message);
  }
};
