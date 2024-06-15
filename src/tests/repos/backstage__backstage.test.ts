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
        requestConfig: {
          method: 'post',
          servers: [{ basePath: [] }],
          pathSegs: [{ type: 'literal', value: 'refresh' }],
          queryParameters: [],
        },
      },
      {
        type: 'only-in-oas',
        requestConfig: {
          method: 'get',
          servers: [{ basePath: [] }],
          pathSegs: [
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
        requestConfig: {
          method: 'get',
          servers: [{ basePath: [] }],
          pathSegs: [{ type: 'literal', value: 'entity-facets' }],
          queryParameters: [
            { name: 'facet', required: true },
            { name: 'filter', required: false },
          ],
        },
      },
      {
        type: 'only-in-oas',
        requestConfig: {
          method: 'post',
          servers: [{ basePath: [] }],
          pathSegs: [{ type: 'literal', value: 'analyze-location' }],
          queryParameters: [],
        },
      },
      {
        type: 'only-in-oas',
        requestConfig: {
          method: 'post',
          servers: [{ basePath: [] }],
          pathSegs: [{ type: 'literal', value: 'validate-entity' }],
          queryParameters: [],
        },
      },
      {
        type: 'match-with-conflicts',
        oasRequestConfig: {
          method: 'delete',
          servers: [{ basePath: [] }],
          pathSegs: [
            { type: 'literal', value: 'locations' },
            { type: 'parameter', name: 'id' },
          ],
          queryParameters: [],
        },
        docRequestConfig: {
          originalPath: '/locations/<uid>',
          method: 'delete',
          pathSegs: [
            { type: 'literal', value: 'locations' },
            { type: 'parameter', name: 'uid' },
          ],
          queryParameters: [],
          line: 545,
        },
        conflicts: [
          {
            type: 'path-parameter-name-mismatch',
            parameterIndex: 0,
            oasServerIndex: null,
          },
        ],
      },
    ]);
  });
});
