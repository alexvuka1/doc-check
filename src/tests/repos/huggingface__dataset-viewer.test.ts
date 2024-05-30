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

  it('handles huggingface/dataset-viewer', async () => {
    await setupInputRepo(getInputMock, repoInfos['huggingface/dataset-viewer']);

    await main.run();

    expectFail(setFailedMock).toEqual([
      {
        type: 'only-in-oas',
        endpoint: {
          method: 'get',
          servers: [
            {
              schemes: ['https'],
              basePath: [],
              host: 'datasets-server.huggingface.co',
            },
          ],
          pathParts: [{ type: 'literal', value: 'info' }],
          queryParameters: [
            { name: 'dataset', required: true },
            { name: 'config', required: false },
          ],
        },
      },
      {
        type: 'only-in-oas',
        endpoint: {
          method: 'get',
          servers: [
            {
              schemes: ['https'],
              basePath: [],
              host: 'datasets-server.huggingface.co',
            },
          ],
          pathParts: [{ type: 'literal', value: 'opt-in-out-urls' }],
          queryParameters: [
            { name: 'dataset', required: true },
            { name: 'config', required: false },
            { name: 'split', required: false },
          ],
        },
      },
      {
        type: 'only-in-oas',
        endpoint: {
          method: 'get',
          servers: [
            {
              schemes: ['https'],
              basePath: [],
              host: 'datasets-server.huggingface.co',
            },
          ],
          pathParts: [{ type: 'literal', value: 'presidio-entities' }],
          queryParameters: [{ name: 'dataset', required: true }],
        },
      },
      {
        type: 'only-in-doc',
        endpoint: {
          originalPath: '/croissant',
          method: 'get',
          pathParts: [{ type: 'literal', value: 'croissant' }],
          queryParameters: [],
          line: 32,
        },
      },
    ]);
  });
});
