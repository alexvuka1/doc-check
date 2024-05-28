import * as core from '@actions/core';
import { beforeEach, describe, it, spyOn } from 'bun:test';
import * as main from '../../main';
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

  it('handles mrhan1993/Fooocus-API', async () => {
    await setupInputRepo(getInputMock, {
      repoName: 'mrhan1993/Fooocus-API',
      sha: '4d4c8633b964abb1f1845d5ed98b0d53c7edfe10',
      pathOas: 'docs/openapi.json',
      pathDoc: 'docs/api_doc_en.md',
    });

    await main.run();

    expectFail(setFailedMock).toEqual([
      {
        type: 'only-in-oas',
        endpoint: {
          method: 'get',
          servers: [],
          pathParts: [],
          queryParameters: [],
        },
      },
      {
        type: 'only-in-oas',
        endpoint: {
          method: 'get',
          servers: [],
          pathParts: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'generation' },
            { type: 'literal', value: 'job-queue' },
          ],
          queryParameters: [],
        },
      },
      {
        type: 'only-in-doc',
        endpoint: {
          originalPath: '/v1/engines/refresh-models',
          method: 'post',
          pathParts: [
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
        endpoint: {
          originalPath: '/v1/engines/job-queue',
          method: 'get',
          pathParts: [
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
