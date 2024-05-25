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

  it('handles fleetdm/fleet', async () => {
    await setupInputRepo(getInputMock, {
      repoName: 'fleetdm/fleet',
      sha: '2dd7b6e5644fc8fea045b0ea37f51225b801f105',
      pathOas: 'server/mdm/nanodep/docs/openapi.yaml',
      pathDoc: 'server/mdm/nanodep/docs/operations-guide.md',
    });

    await main.run();

    expect(setFailedMock).not.toHaveBeenCalled();
  });
});