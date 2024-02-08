/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * These should be run as if the action was called from a workflow.
 * Specifically, the inputs listed in `action.yml` should be set as environment
 * variables following the pattern `INPUT_<INPUT_NAME>`.
 */

import * as core from '@actions/core';
import * as main from '../src/main';

const timeRegex = /^\d{2}:\d{2}:\d{2}/;

// Mock the action's main function
const runMock = jest.spyOn(main, 'run');

// Mock the GitHub Actions core library
let debugMock: jest.SpyInstance;
let getInputMock: jest.SpyInstance;
let setOutputMock: jest.SpyInstance;

describe('action', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    debugMock = jest.spyOn(core, 'debug').mockImplementation();
    getInputMock = jest.spyOn(core, 'getInput').mockImplementation();
    setOutputMock = jest.spyOn(core, 'setOutput').mockImplementation();
  });

  it('prints Hello World', async () => {
    getInputMock.mockImplementation((name: string): string => {
      switch (name) {
        case 'str':
          return 'World';
        default:
          return '';
      }
    });
    await main.run();
    expect(runMock).toHaveReturned();

    expect(debugMock).toHaveBeenNthCalledWith(1, 'Hello World');

    expect(setOutputMock).toHaveBeenNthCalledWith(
      1,
      'time',
      expect.stringMatching(timeRegex),
    );
  });
});
