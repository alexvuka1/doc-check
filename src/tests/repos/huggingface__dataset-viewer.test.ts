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
        requestConfig: {
          method: 'get',
          servers: [
            {
              scheme: 'https',
              basePath: [],
              host: 'datasets-server.huggingface.co',
            },
          ],
          pathSegs: [{ type: 'literal', value: 'info' }],
          queryParameters: [
            { name: 'dataset', required: true },
            { name: 'config', required: false },
          ],
        },
      },
      {
        type: 'only-in-oas',
        requestConfig: {
          method: 'get',
          servers: [
            {
              scheme: 'https',
              basePath: [],
              host: 'datasets-server.huggingface.co',
            },
          ],
          pathSegs: [{ type: 'literal', value: 'opt-in-out-urls' }],
          queryParameters: [
            { name: 'dataset', required: true },
            { name: 'config', required: false },
            { name: 'split', required: false },
          ],
        },
      },
      {
        type: 'only-in-oas',
        requestConfig: {
          method: 'get',
          servers: [
            {
              scheme: 'https',
              basePath: [],
              host: 'datasets-server.huggingface.co',
            },
          ],
          pathSegs: [{ type: 'literal', value: 'presidio-entities' }],
          queryParameters: [{ name: 'dataset', required: true }],
        },
      },
      {
        type: 'only-in-doc',
        requestConfig: {
          originalPath: '/croissant',
          method: 'get',
          pathSegs: [{ type: 'literal', value: 'croissant' }],
          queryParameters: [],
          line: 32,
        },
      },
    ]);
  });
});
