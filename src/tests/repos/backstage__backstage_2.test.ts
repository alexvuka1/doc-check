import * as core from '@actions/core';
import { beforeEach, describe, expect, it, spyOn } from 'bun:test';
import * as main from '../../main';
import { repoInfos } from '../data/repoInfos';
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

  it('handles backstage/backstage_2', async () => {
    await setupInputRepo(getInputMock, repoInfos['backstage/backstage_2']);

    await main.run();

    expect(setFailedMock).not.toHaveBeenCalled();
  });
});
