import * as core from '@actions/core';
import { beforeEach, describe, expect, it, spyOn } from 'bun:test';
import * as main from '../../src/main';
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

  it('handles gothinkster/realworld', async () => {
    await setupInputRepo(getInputMock, {
      repoName: 'gothinkster/realworld',
      sha: '11c81f64f04fff8cfcd60ddf4eb0064c01fa1730',
      pathOas: 'api/openapi.yml',
      pathDoc: 'apps/documentation/docs/specs/backend-specs/endpoints.md',
    });

    await main.run();

    expect(setFailedMock).not.toHaveBeenCalled();
  });
});
