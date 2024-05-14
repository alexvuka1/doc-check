/**
 * Unit tests for the action's main functionality, src/main.ts
 */

import * as core from '@actions/core';
import { beforeEach, describe, expect, it, spyOn } from 'bun:test';
import * as main from '../src/main';
import { expectFail, setupInput } from './utils';

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

  it('handles basic success', async () => {
    setupInput(getInputMock, './data/custom/basic');

    await main.run();

    expect(setFailedMock).not.toHaveBeenCalled();
  });

  it('handles basic fail', async () => {
    setupInput(getInputMock, './data/custom/basic-fail');

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
        type: 'only-in-doc',
        endpoint: {
          method: 'get',
          pathParts: [{ type: 'literal', value: 'hello' }],
          queryParameters: [],
        },
      },
    ]);
  });

  it('handles basic fail 2', async () => {
    setupInput(getInputMock, './data/custom/basic-fail-2');

    await main.run();

    expectFail(setFailedMock).toEqual([
      {
        type: 'only-in-doc',
        endpoint: {
          method: 'get',
          pathParts: [{ type: 'literal', value: 'hello' }],
          queryParameters: [],
        },
      },
    ]);
  });
});
