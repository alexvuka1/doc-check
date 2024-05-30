import * as core from '@actions/core';
import { beforeEach, describe, it, spyOn } from 'bun:test';
import * as main from '../../main';
import { expectFail, setupInputRepo } from '../utils';
import { repoInfos } from '../data/repoInfos';

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
    await setupInputRepo(getInputMock, repoInfos['backstage/backstage']);

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
          originalPath: '/locations/<uid>',
          method: 'delete',
          pathParts: [
            { type: 'literal', value: 'locations' },
            { type: 'parameter', name: 'uid' },
          ],
          queryParameters: [],
          line: 545,
        },
        inconsistencies: [
          {
            type: 'path-path-parameter-name-mismatch',
            parameterIndex: 0,
            oasServerIndex: null,
          },
        ],
      },
    ]);
  });
});
