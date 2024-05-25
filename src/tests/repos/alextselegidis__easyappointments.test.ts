import * as core from '@actions/core';
import { beforeEach, describe, expect, it, spyOn } from 'bun:test';
import * as main from '../../main';
import { setupInputRepo } from '../utils';

const getInputMock = spyOn(core, 'getInput');
const setFailedMock = spyOn(core, 'setFailed');
const debugMock = spyOn(core, 'debug');

describe('action', () => {
  beforeEach(() => {
    getInputMock.mockReset();
    setFailedMock.mockReset();
    debugMock.mockReset();
  });

  it('handles alextselegidis/easyappointments', async () => {
    await setupInputRepo(getInputMock, {
      repoName: 'alextselegidis/easyappointments',
      sha: '06fddd49f4f6a98a4a90307c1812dd06caa6551b',
      pathOas: 'swagger.yml',
      pathDoc: 'docs/rest-api.md',
    });

    await main.run();

    expect(setFailedMock).not.toHaveBeenCalled();
  });
});
