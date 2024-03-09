/**
 * Unit tests for the action's main functionality, src/main.ts
 */

import * as core from '@actions/core';
import { describe, expect, it, spyOn } from 'bun:test';
import { resolve } from 'path';
import * as main from '../src/main';

// Mock the GitHub Actions core library
const getInputMock = spyOn(core, 'getInput');
const setFailedMock = spyOn(core, 'setFailed');

describe('action', () => {
  it('handles basic success', async () => {
    getInputMock.mockImplementation((name: string): string => {
      switch (name) {
        case 'openapi-path':
          return resolve(import.meta.dir, './data/basic/success/openapi.json');
        case 'doc-path':
          return resolve(import.meta.dir, './data/basic/success/api.md');
        default:
          return '';
      }
    });

    await main.run();

    expect(setFailedMock).not.toHaveBeenCalled();
  });

  it('handles basic fail', async () => {
    getInputMock.mockImplementation((name: string): string => {
      switch (name) {
        case 'openapi-path':
          return resolve(import.meta.dir, './data/basic/fail/openapi.json');
        case 'doc-path':
          return resolve(import.meta.dir, './data/basic/fail/api.md');
        default:
          return '';
      }
    });

    await main.run();

    expect(setFailedMock).toHaveBeenCalled();
  });

  it('handles random fail', async () => {
    getInputMock.mockImplementation((name: string): string => {
      switch (name) {
        case 'openapi-path':
          return resolve(import.meta.dir, './data/random/fail/openapi.json');
        case 'doc-path':
          return resolve(import.meta.dir, './data/random/fail/api.md');
        default:
          return '';
      }
    });

    await main.run();

    expect(setFailedMock).toHaveBeenCalled();
  });
});
