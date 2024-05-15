import * as core from '@actions/core';
import { beforeEach, describe, it, spyOn } from 'bun:test';
import * as main from '../../src/main';
import { expectFail, setupInputRepo } from '../utils';

const getInputMock = spyOn(core, 'getInput');
const setFailedMock = spyOn(core, 'setFailed');
const debugMock = spyOn(core, 'debug');

describe('action', () => {
  beforeEach(() => {
    getInputMock.mockReset();
    setFailedMock.mockReset();
    debugMock.mockReset();
  });

  it('handles backstage/backstage', async () => {
    await setupInputRepo(getInputMock, {
      repoName: 'backstage/backstage',
      urlOpenApi:
        'https://github.com/backstage/backstage/blob/2f6e3e6b47d7c710ef8f137625699080cda8cb79/plugins/catalog-backend/src/schema/openapi.yaml',
      urlDoc:
        'https://github.com/backstage/backstage/blob/2f6e3e6b47d7c710ef8f137625699080cda8cb79/docs/features/software-catalog/api.md',
    });

    await main.run();

    expectFail(setFailedMock).toEqual([
      {
        type: 'only-in-oas',
        endpoint: {
          method: 'post',
          servers: [{ basePath: [] }],
          pathParts: [{ type: 'literal', value: 'refresh' }],
          queryParameters: [],
        },
      },
      {
        type: 'only-in-oas',
        endpoint: {
          method: 'get',
          servers: [{ basePath: [] }],
          pathParts: [
            { type: 'literal', value: 'entities' },
            { type: 'literal', value: 'by-name' },
            { type: 'parameter', name: 'kind' },
            { type: 'parameter', name: 'namespace' },
            { type: 'parameter', name: 'name' },
            { type: 'literal', value: 'ancestry' },
          ],
          queryParameters: [],
        },
      },
      {
        type: 'only-in-oas',
        endpoint: {
          method: 'get',
          servers: [{ basePath: [] }],
          pathParts: [{ type: 'literal', value: 'entity-facets' }],
          queryParameters: [
            { name: 'facet', required: true },
            { name: 'filter', required: false },
          ],
        },
      },
      {
        type: 'only-in-oas',
        endpoint: {
          method: 'post',
          servers: [{ basePath: [] }],
          pathParts: [{ type: 'literal', value: 'analyze-location' }],
          queryParameters: [],
        },
      },
      {
        type: 'only-in-oas',
        endpoint: {
          method: 'post',
          servers: [{ basePath: [] }],
          pathParts: [{ type: 'literal', value: 'validate-entity' }],
          queryParameters: [],
        },
      },
      {
        type: 'match-with-inconsistenties',
        oasEndpoint: {
          method: 'delete',
          servers: [{ basePath: [] }],
          pathParts: [
            { type: 'literal', value: 'locations' },
            { type: 'parameter', name: 'id' },
          ],
          queryParameters: [],
        },
        docEndpoint: {
          method: 'delete',
          pathParts: [
            { type: 'literal', value: 'locations' },
            { type: 'parameter', name: 'uid' },
          ],
          queryParameters: [],
        },
        inconsistencies: [
          {
            type: 'parameter-name-mismatch',
            parameterIndex: 0,
          },
        ],
      },
    ]);
  });
});
