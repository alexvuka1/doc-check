/**
 * Unit tests for the action's main functionality, src/main.ts
 */

import * as core from '@actions/core';
import * as main from '../src/main';
import { spyOn, describe, beforeEach, it, expect } from 'bun:test';

// Mock the action's main function
const runMock = spyOn(main, 'run');

// Mock the GitHub Actions core library
const debugMock = spyOn(core, 'debug');
const getInputMock = spyOn(core, 'getInput');
const setFailedMock = spyOn(core, 'setFailed');

describe('action', () => {
  beforeEach(() => {
    runMock.mockReset();
    debugMock.mockReset();
    getInputMock.mockReset();
    setFailedMock.mockReset();
  });

  it('handles basic success', async () => {
    getInputMock.mockImplementation((name: string): string => {
      switch (name) {
        case 'openapi-path':
          return './data/basic/success/api.json';
        case 'doc-path':
          return './data/basic/success/openapi.json';
        default:
          return '';
      }
    });

    await main.run();

    expect(setFailedMock).not.toHaveBeenCalled();
  });

  it('handles basic success', async () => {
    getInputMock.mockImplementation((name: string): string => {
      switch (name) {
        case 'openapi-path':
          return './data/basic/success/api.json';
        case 'doc-path':
          return './data/basic/success/openapi.json';
        default:
          return '';
      }
    });

    await main.run();

    expect(setFailedMock).not.toHaveBeenCalled();
  });
});
