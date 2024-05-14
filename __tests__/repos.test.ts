/**
 * Unit tests for the action's main functionality, src/main.ts
 */

import * as core from '@actions/core';
import { beforeEach, describe, expect, it, spyOn } from 'bun:test';
import * as main from '../src/main';
import { expectFail, setupInputRepo } from './utils';

// Mock the GitHub Actions core library
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
      urlOpenApi:
        'https://github.com/gothinkster/realworld/blob/11c81f64f04fff8cfcd60ddf4eb0064c01fa1730/api/openapi.yml',
      urlDoc:
        'https://github.com/gothinkster/realworld/blob/11c81f64f04fff8cfcd60ddf4eb0064c01fa1730/apps/documentation/docs/specs/backend-specs/endpoints.md',
    });

    await main.run();

    expect(setFailedMock).not.toHaveBeenCalled();
  });

  it('handles openstf/stf', async () => {
    await setupInputRepo(getInputMock, {
      repoName: 'openstf/stf',
      urlOpenApi:
        'https://github.com/openstf/stf/blob/2b9649009722794dee9efd32b71bccbcbfe9d794/lib/units/api/swagger/api_v1_generated.json',
      urlDoc:
        'https://github.com/openstf/stf/blob/2b9649009722794dee9efd32b71bccbcbfe9d794/doc/API.md',
    });

    await main.run();

    expectFail(setFailedMock).toEqual([
      {
        type: 'only-in-oas',
        endpoint: {
          method: 'get',
          servers: [
            {
              basePath: [
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
            },
          ],
          pathParts: [
            { type: 'literal', value: 'user' },
            { type: 'literal', value: 'devices' },
            { type: 'parameter', name: 'serial' },
          ],
          queryParameters: [{ name: 'fields', required: false }],
        },
      },
      {
        type: 'only-in-oas',
        endpoint: {
          method: 'get',
          servers: [
            {
              basePath: [
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
            },
          ],
          pathParts: [
            { type: 'literal', value: 'user' },
            { type: 'literal', value: 'accessTokens' },
          ],
          queryParameters: [],
        },
      },
    ]);
  });

  it('handles backstage/backstage', async () => {
    await setupInputRepo(getInputMock, {
      repoName: 'backstage/backstage',
      urlOpenApi:
        'https://github.com/backstage/backstage/blob/2f6e3e6b47d7c710ef8f137625699080cda8cb79/plugins/catalog-backend/src/schema/openapi.yaml',
      urlDoc:
        'https://github.com/backstage/backstage/blob/2f6e3e6b47d7c710ef8f137625699080cda8cb79/docs/features/software-catalog/api.md',
    });

    await main.run();

    expectFail(setFailedMock).toEqual([
      {
        type: 'only-in-oas',
        endpoint: {
          method: 'post',
          servers: [{ basePath: [] }],
          pathParts: [{ type: 'literal', value: 'refresh' }],
          queryParameters: [],
        },
      },
      {
        type: 'only-in-oas',
        endpoint: {
          method: 'get',
          servers: [{ basePath: [] }],
          pathParts: [
            { type: 'literal', value: 'entities' },
            { type: 'literal', value: 'by-name' },
            { type: 'parameter', name: 'kind' },
            { type: 'parameter', name: 'namespace' },
            { type: 'parameter', name: 'name' },
            { type: 'literal', value: 'ancestry' },
          ],
          queryParameters: [],
        },
      },
      {
        type: 'only-in-oas',
        endpoint: {
          method: 'get',
          servers: [{ basePath: [] }],
          pathParts: [{ type: 'literal', value: 'entity-facets' }],
          queryParameters: [
            { name: 'facet', required: true },
            { name: 'filter', required: false },
          ],
        },
      },
      {
        type: 'only-in-oas',
        endpoint: {
          method: 'post',
          servers: [{ basePath: [] }],
          pathParts: [{ type: 'literal', value: 'analyze-location' }],
          queryParameters: [],
        },
      },
      {
        type: 'only-in-oas',
        endpoint: {
          method: 'post',
          servers: [{ basePath: [] }],
          pathParts: [{ type: 'literal', value: 'validate-entity' }],
          queryParameters: [],
        },
      },
      {
        type: 'parameter-name-mismatch',
        parameterIndex: 0,
        oasEndpoint: {
          method: 'delete',
          servers: [{ basePath: [] }],
          pathParts: [
            { type: 'literal', value: 'locations' },
            { type: 'parameter', name: 'id' },
          ],
          queryParameters: [],
        },
        docEndpoint: {
          method: 'delete',
          pathParts: [
            { type: 'literal', value: 'locations' },
            { type: 'parameter', name: 'uid' },
          ],
          queryParameters: [],
        },
      },
    ]);
  });

  it('handles sunflower-land/sunflower-land', async () => {
    await setupInputRepo(getInputMock, {
      repoName: 'sunflower-land/sunflower-land',
      urlOpenApi:
        'https://github.com/sunflower-land/sunflower-land/blob/877234bda1c498505a9be75b83affb487285af5c/docs/openapi.json',
      urlDoc:
        'https://github.com/sunflower-land/sunflower-land/blob/877234bda1c498505a9be75b83affb487285af5c/docs/OFFCHAIN_API.md',
    });

    await main.run();

    expect(setFailedMock).not.toHaveBeenCalled();
  });
});
