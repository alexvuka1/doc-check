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

  it('handles DeviceFarmer/stf', async () => {
    await setupInputRepo(getInputMock, {
      repoName: 'DeviceFarmer/stf',
      sha: '7553c8b88df68bfba60e36d3abd6f9deb8a4ce65',
      pathOas: 'lib/units/api/swagger/api_v1_generated.json',
      pathDoc: 'doc/API.md',
    });

    await main.run();

    expectFail(setFailedMock).toEqual([
      {
        type: 'only-in-oas',
        endpoint: {
          method: 'get',
          servers: [
            {
              basePath: [
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
            },
          ],
          pathParts: [
            { type: 'literal', value: 'user' },
            { type: 'literal', value: 'devices' },
            { type: 'parameter', name: 'serial' },
          ],
          queryParameters: [{ name: 'fields', required: false }],
        },
      },
      {
        type: 'only-in-oas',
        endpoint: {
          method: 'get',
          servers: [
            {
              basePath: [
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
            },
          ],
          pathParts: [
            { type: 'literal', value: 'user' },
            { type: 'literal', value: 'accessTokens' },
          ],
          queryParameters: [],
        },
      },
    ]);
  });
});
