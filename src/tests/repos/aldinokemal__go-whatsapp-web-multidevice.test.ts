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

  it('handles aldinokemal/go-whatsapp-web-multidevice', async () => {
    await setupInputRepo(
      getInputMock,
      repoInfos['aldinokemal/go-whatsapp-web-multidevice'],
    );

    await main.run();

    expectFail(setFailedMock).toEqual([
      {
        type: 'only-in-oas',
        requestConfig: {
          method: 'get',
          servers: [{ scheme: 'http', basePath: [], host: 'localhost:3000' }],
          pathSegs: [
            { type: 'literal', value: 'app' },
            { type: 'literal', value: 'devices' },
          ],
          queryParameters: [],
        },
      },
      {
        type: 'only-in-oas',
        requestConfig: {
          method: 'post',
          servers: [{ scheme: 'http', basePath: [], host: 'localhost:3000' }],
          pathSegs: [
            { type: 'literal', value: 'message' },
            { type: 'parameter', name: 'message_id' },
            { type: 'literal', value: 'reaction' },
          ],
          queryParameters: [],
        },
      },
      {
        type: 'only-in-doc',
        requestConfig: {
          originalPath: '/message/:message_id/react',
          method: 'post',
          pathSegs: [
            { type: 'literal', value: 'message' },
            { type: 'parameter', name: 'message_id' },
            { type: 'literal', value: 'react' },
          ],
          queryParameters: [],
          line: 118,
        },
      },
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
          line: 124,
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
          line: 125,
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
          line: 126,
        },
      },
    ]);
  });
});
