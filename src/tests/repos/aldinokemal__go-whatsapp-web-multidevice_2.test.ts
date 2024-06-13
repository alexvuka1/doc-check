import * as core from '@actions/core';
import { beforeEach, describe, it, spyOn } from 'bun:test';
import * as main from '../../main';
import { expectFail, setupInputRepo } from '../utils';
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

  it('handles aldinokemal/go-whatsapp-web-multidevice_2', async () => {
    await setupInputRepo(
      getInputMock,
      repoInfos['aldinokemal/go-whatsapp-web-multidevice_2'],
    );

    await main.run();

    expectFail(setFailedMock).toEqual([
      {
        type: 'only-in-doc',
        requestConfig: {
          originalPath: '/group/participants',
          method: 'delete',
          pathSegs: [
            { type: 'literal', value: 'group' },
            { type: 'literal', value: 'participants' },
          ],
          queryParameters: [],
          line: 128,
        },
      },
      {
        type: 'only-in-doc',
        requestConfig: {
          originalPath: '/group/participants/promote',
          method: 'post',
          pathSegs: [
            { type: 'literal', value: 'group' },
            { type: 'literal', value: 'participants' },
            { type: 'literal', value: 'promote' },
          ],
          queryParameters: [],
          line: 129,
        },
      },
      {
        type: 'only-in-doc',
        requestConfig: {
          originalPath: '/group/participants/demote',
          method: 'post',
          pathSegs: [
            { type: 'literal', value: 'group' },
            { type: 'literal', value: 'participants' },
            { type: 'literal', value: 'demote' },
          ],
          queryParameters: [],
          line: 130,
        },
      },
    ]);
  });
});
