import * as core from '@actions/core';
import { beforeEach, describe, it, spyOn } from 'bun:test';
import * as main from '../../main';
import { expectFail, setupInputRepo } from '../utils';

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
    await setupInputRepo(getInputMock, {
      repoName: 'aldinokemal/go-whatsapp-web-multidevice',
      sha: '7292058718a0441cfa75bb05b8ff0475999e1acc',
      pathOas: 'docs/openapi.yaml',
      pathDoc: 'readme.md',
    });

    await main.run();

    expectFail(setFailedMock).toEqual([
      {
        type: 'only-in-oas',
        endpoint: {
          method: 'get',
          servers: [
            { schemes: ['http'], basePath: [], host: 'localhost:3000' },
          ],
          pathParts: [
            { type: 'literal', value: 'app' },
            { type: 'literal', value: 'devices' },
          ],
          queryParameters: [],
        },
      },
      {
        type: 'only-in-oas',
        endpoint: {
          method: 'post',
          servers: [
            { schemes: ['http'], basePath: [], host: 'localhost:3000' },
          ],
          pathParts: [
            { type: 'literal', value: 'message' },
            { type: 'parameter', name: 'message_id' },
            { type: 'literal', value: 'reaction' },
          ],
          queryParameters: [],
        },
      },
      {
        type: 'only-in-doc',
        endpoint: {
          originalPath: '/message/:message_id/react',
          method: 'post',
          pathParts: [
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
        endpoint: {
          originalPath: '/group/participants',
          method: 'delete',
          pathParts: [
            { type: 'literal', value: 'group' },
            { type: 'literal', value: 'participants' },
          ],
          queryParameters: [],
          line: 124,
        },
      },
      {
        type: 'only-in-doc',
        endpoint: {
          originalPath: '/group/participants/promote',
          method: 'post',
          pathParts: [
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
        endpoint: {
          originalPath: '/group/participants/demote',
          method: 'post',
          pathParts: [
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
