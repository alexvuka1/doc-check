/**
 * Unit tests for the action's main functionality, src/main.ts
 */

import * as core from '@actions/core';
import { beforeEach, describe, expect, it, spyOn } from 'bun:test';
import * as main from '../../src/main';
import { setupInputRepo } from '../utils';

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

  it('handles sunflower-land/sunflower-land', async () => {
    await setupInputRepo(getInputMock, {
      repoName: 'sunflower-land/sunflower-land',
      urlOpenApi:
        'https://github.com/sunflower-land/sunflower-land/blob/877234bda1c498505a9be75b83affb487285af5c/docs/openapi.json',
      urlDoc:
        'https://github.com/sunflower-land/sunflower-land/blob/877234bda1c498505a9be75b83affb487285af5c/docs/OFFCHAIN_API.md',
    });

    await main.run();

    expect(setFailedMock).not.toHaveBeenCalled();
  });
});
