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

  it('handles DeviceFarmer/stf', async () => {
    await setupInputRepo(getInputMock, repoInfos['DeviceFarmer/stf']);

    await main.run();

    expectFail(setFailedMock).toEqual([
      {
        type: 'only-in-oas',
        requestConfig: {
          method: 'get',
          servers: [
            {
              basePath: [
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
            },
          ],
          pathSegs: [
            { type: 'literal', value: 'user' },
            { type: 'literal', value: 'devices' },
            { type: 'parameter', name: 'serial' },
          ],
          queryParameters: [{ name: 'fields', required: false }],
        },
      },
      {
        type: 'only-in-oas',
        requestConfig: {
          method: 'get',
          servers: [
            {
              basePath: [
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
            },
          ],
          pathSegs: [
            { type: 'literal', value: 'user' },
            { type: 'literal', value: 'accessTokens' },
          ],
          queryParameters: [],
        },
      },
    ]);
  });
});
