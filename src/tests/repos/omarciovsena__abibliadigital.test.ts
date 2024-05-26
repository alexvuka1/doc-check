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

  it('handles omarciovsena/abibliadigital', async () => {
    await setupInputRepo(getInputMock, {
      repoName: 'omarciovsena/abibliadigital',
      sha: 'fc31798a790c1c36d072d2e422dba82fa1a74bcd',
      pathOas: 'docs/openapi.yaml',
      pathDoc: 'DOCUMENTATION.md',
    });

    await main.run();

    expect(setFailedMock).not.toHaveBeenCalled();
  });
});
