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

  it('handles mrhan1993/Fooocus-API', async () => {
    await setupInputRepo(getInputMock, repoInfos['mrhan1993/Fooocus-API']);

    await main.run();

    expectFail(setFailedMock).toEqual([
      {
        type: 'only-in-oas',
        requestConfig: {
          method: 'get',
          servers: [],
          pathSegs: [],
          queryParameters: [],
        },
      },
      {
        type: 'only-in-oas',
        requestConfig: {
          method: 'get',
          servers: [],
          pathSegs: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'generation' },
            { type: 'literal', value: 'job-queue' },
          ],
          queryParameters: [],
        },
      },
      {
        type: 'only-in-doc',
        requestConfig: {
          originalPath: '/v1/engines/refresh-models',
          method: 'post',
          pathSegs: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'engines' },
            { type: 'literal', value: 'refresh-models' },
          ],
          queryParameters: [],
          line: 668,
        },
      },
      {
        type: 'only-in-doc',
        requestConfig: {
          originalPath: '/v1/engines/job-queue',
          method: 'get',
          pathSegs: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'engines' },
            { type: 'literal', value: 'job-queue' },
          ],
          queryParameters: [],
          line: 739,
        },
      },
    ]);
  });
});
