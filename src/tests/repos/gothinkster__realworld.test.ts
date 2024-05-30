import * as core from '@actions/core';
import { beforeEach, describe, expect, it, spyOn } from 'bun:test';
import * as main from '../../main';
import { setupInputRepo } from '../utils';
import { repoInfos } from '../data/repoInfos';

const getInputMock = spyOn(core, 'getInput');
const setFailedMock = spyOn(core, 'setFailed');
const debugMock = spyOn(core, 'debug');

describe('action', () => {
  beforeEach(() => {
    getInputMock.mockReset();
    setFailedMock.mockReset();
    debugMock.mockReset();
  });

  it('handles gothinkster/realworld', async () => {
    await setupInputRepo(getInputMock, repoInfos['gothinkster/realworld']);

    await main.run();

    expect(setFailedMock).not.toHaveBeenCalled();
  });
});
