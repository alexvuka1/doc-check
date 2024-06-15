import * as core from '@actions/core';
import { beforeEach, describe, expect, it, spyOn } from 'bun:test';
import * as main from '../main';
import { expectFail, setupInput } from './utils';

const getInputMock = spyOn(core, 'getInput');
const setFailedMock = spyOn(core, 'setFailed');
const debugMock = spyOn(core, 'debug');

describe('action', () => {
  beforeEach(() => {
    getInputMock.mockReset();
    setFailedMock.mockReset();
    debugMock.mockReset();
  });

  it('handles basic success', async () => {
    setupInput(getInputMock, '../data/custom/basic');

    await main.run();

    expect(setFailedMock).not.toHaveBeenCalled();
  });

  it('handles basic fail', async () => {
    setupInput(getInputMock, '../data/custom/basic-fail');

    await main.run();

    expectFail(setFailedMock).toEqual([
      {
        type: 'only-in-oas',
        requestConfig: {
          method: 'get',
          servers: [],
          pathSegs: [],
          queryParameters: [],
        },
      },
      {
        type: 'only-in-doc',
        requestConfig: {
          originalPath: '/hello',
          method: 'get',
          pathSegs: [{ type: 'literal', value: 'hello' }],
          queryParameters: [],
          line: 5,
        },
      },
    ]);
  });

  it('handles basic fail 2', async () => {
    setupInput(getInputMock, '../data/custom/basic-fail-2');

    await main.run();

    expectFail(setFailedMock).toEqual([
      {
        type: 'only-in-doc',
        requestConfig: {
          originalPath: '/hello',
          method: 'get',
          pathSegs: [{ type: 'literal', value: 'hello' }],
          queryParameters: [],
          line: 7,
        },
      },
    ]);
  });

  it('handles basic fail 3', async () => {
    setupInput(getInputMock, '../data/custom/basic-fail-3');

    await main.run();

    expectFail(setFailedMock).toEqual([
      {
        type: 'only-in-oas',
        requestConfig: {
          method: 'get',
          servers: [],
          pathSegs: [],
          queryParameters: [],
        },
      },
      {
        type: 'only-in-oas',
        requestConfig: {
          method: 'put',
          servers: [],
          pathSegs: [],
          queryParameters: [],
        },
      },
      {
        type: 'only-in-doc',
        requestConfig: {
          originalPath: '/',
          method: 'delete',
          pathSegs: [],
          queryParameters: [],
          line: 5,
        },
      },
      {
        type: 'only-in-doc',
        requestConfig: {
          originalPath: '/',
          method: 'post',
          pathSegs: [],
          queryParameters: [],
          line: 7,
        },
      },
    ]);
  });

  it('handles basic fail 4', async () => {
    setupInput(getInputMock, '../data/custom/basic-fail-4');

    await main.run();

    expectFail(setFailedMock).toEqual([
      {
        type: 'match-with-conflicts',
        oasRequestConfig: {
          method: 'delete',
          servers: [
            {
              scheme: 'https',
              basePath: [
                { type: 'literal', value: 'GRAPHSCOPE' },
                { type: 'literal', value: 'InteractiveAPI' },
                { type: 'literal', value: '1.0.0' },
              ],
              host: 'virtserver.swaggerhub.com',
            },
            {
              scheme: 'https',
              basePath: [
                { type: 'literal', value: 'GRAPHSCOPE' },
                { type: 'literal', value: 'interactive' },
                { type: 'literal', value: '1.0.0' },
              ],
              host: 'virtserver.swaggerhub.com',
            },
          ],
          pathSegs: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'graph' },
            { type: 'parameter', name: 'graph_id' },
          ],
          queryParameters: [],
        },
        docRequestConfig: {
          originalPath: '/v1/graph/{graph}',
          method: 'delete',
          pathSegs: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'graph' },
            { type: 'parameter', name: 'graph' },
          ],
          queryParameters: [],
          line: 20,
        },
        conflicts: [
          {
            type: 'path-parameter-name-mismatch',
            parameterIndex: 0,
            oasServerIndex: null,
          },
        ],
      },
    ]);
  });
});
