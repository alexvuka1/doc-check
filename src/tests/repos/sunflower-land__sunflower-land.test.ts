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

  it('handles sunflower-land/sunflower-land', async () => {
    await setupInputRepo(getInputMock, {
      repoName: 'sunflower-land/sunflower-land',
      sha: '877234bda1c498505a9be75b83affb487285af5c',
      pathOas: 'docs/openapi.json',
      pathDoc: 'docs/OFFCHAIN_API.md',
    });

    await main.run();

    expect(setFailedMock).not.toHaveBeenCalled();
  });
});
