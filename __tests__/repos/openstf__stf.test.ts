/**
 * Unit tests for the action's main functionality, src/main.ts
 */

import * as core from '@actions/core';
import { beforeEach, describe, it, spyOn } from 'bun:test';
import * as main from '../../src/main';
import { expectFail, setupInputRepo } from '../utils';

// Mock the GitHub Actions core library
const getInputMock = spyOn(core, 'getInput');
const setFailedMock = spyOn(core, 'setFailed');
const debugMock = spyOn(core, 'debug');

describe('action', () => {
  beforeEach(() => {
    getInputMock.mockReset();
    setFailedMock.mockReset();
    debugMock.mockReset();
  });

  it('handles openstf/stf', async () => {
    await setupInputRepo(getInputMock, {
      repoName: 'openstf/stf',
      urlOpenApi:
        'https://github.com/openstf/stf/blob/2b9649009722794dee9efd32b71bccbcbfe9d794/lib/units/api/swagger/api_v1_generated.json',
      urlDoc:
        'https://github.com/openstf/stf/blob/2b9649009722794dee9efd32b71bccbcbfe9d794/doc/API.md',
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
