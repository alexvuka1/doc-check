/**
 * Unit tests for the action's main functionality, src/main.ts
 */

import * as core from '@actions/core';
import { describe, expect, it, spyOn, beforeEach } from 'bun:test';
import * as main from '../src/main';
import { setupInput, expectFail, setupInputRepo } from './utils';

// Mock the GitHub Actions core library
const getInputMock = spyOn(core, 'getInput');
const setFailedMock = spyOn(core, 'setFailed');

describe('action', () => {
  beforeEach(() => {
    getInputMock.mockReset();
    setFailedMock.mockReset();
  });

  it('handles basic success', async () => {
    setupInput(getInputMock, './data/custom/basic');

    await main.run();

    expect(setFailedMock).not.toHaveBeenCalled();
  });

  it('handles basic fail', async () => {
    setupInput(getInputMock, './data/custom/basic-fail');

    await main.run();

    expectFail(setFailedMock).toEqual({
      notDocumented: [{ method: 'get', servers: [], pathParts: [] }],
      outdated: [
        { method: 'get', pathParts: [{ type: 'literal', value: 'hello' }] },
      ],
    });
  });

  it('handles basic fail 2', async () => {
    setupInput(getInputMock, './data/custom/basic-fail-2');

    await main.run();

    expectFail(setFailedMock).toEqual({
      notDocumented: [],
      outdated: [
        { method: 'get', pathParts: [{ type: 'literal', value: 'hello' }] },
      ],
    });
  });

  it('handles gothinkster/realworld', async () => {
    await setupInputRepo(getInputMock, {
      repoName: 'gothinkster/realworld',
      urlOpenApi:
        'https://raw.githubusercontent.com/gothinkster/realworld/11c81f64f04fff8cfcd60ddf4eb0064c01fa1730/api/openapi.yml',
      urlDoc:
        'https://raw.githubusercontent.com/gothinkster/realworld/11c81f64f04fff8cfcd60ddf4eb0064c01fa1730/apps/documentation/docs/specs/backend-specs/endpoints.md',
    });

    await main.run();

    expect(setFailedMock).not.toHaveBeenCalled();
  });
});
