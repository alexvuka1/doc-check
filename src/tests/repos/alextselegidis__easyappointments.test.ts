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

  it('handles alextselegidis/easyappointments', async () => {
    await setupInputRepo(getInputMock, {
      repoName: 'alextselegidis/easyappointments',
      sha: '06fddd49f4f6a98a4a90307c1812dd06caa6551b',
      pathOas: 'swagger.yml',
      pathDoc: 'docs/rest-api.md',
    });

    await main.run();

    expectFail(setFailedMock).toEqual([
      {
        type: 'only-in-oas',
        endpoint: {
          method: 'get',
          servers: [
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
            {
              schemes: ['http'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
          ],
          pathParts: [{ type: 'literal', value: 'availabilities' }],
          queryParameters: [
            { name: 'providerId', required: false },
            { name: 'serviceId', required: false },
            { name: 'date', required: false },
          ],
        },
      },
      {
        type: 'only-in-oas',
        endpoint: {
          method: 'get',
          servers: [
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
            {
              schemes: ['http'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
          ],
          pathParts: [{ type: 'literal', value: 'appointments' }],
          queryParameters: [
            { name: 'page', required: false },
            { name: 'length', required: false },
            { name: 'sort', required: false },
            { name: 'q', required: false },
            { name: 'aggregates', required: false },
          ],
        },
      },
      {
        type: 'only-in-oas',
        endpoint: {
          method: 'get',
          servers: [
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
            {
              schemes: ['http'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
          ],
          pathParts: [{ type: 'literal', value: 'unavailabilities' }],
          queryParameters: [
            { name: 'page', required: false },
            { name: 'length', required: false },
            { name: 'sort', required: false },
            { name: 'q', required: false },
          ],
        },
      },
      {
        type: 'only-in-oas',
        endpoint: {
          method: 'get',
          servers: [
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
            {
              schemes: ['http'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
          ],
          pathParts: [{ type: 'literal', value: 'customers' }],
          queryParameters: [
            { name: 'page', required: false },
            { name: 'length', required: false },
            { name: 'sort', required: false },
            { name: 'q', required: false },
          ],
        },
      },
      {
        type: 'only-in-oas',
        endpoint: {
          method: 'get',
          servers: [
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
            {
              schemes: ['http'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
          ],
          pathParts: [{ type: 'literal', value: 'services' }],
          queryParameters: [
            { name: 'page', required: false },
            { name: 'length', required: false },
            { name: 'sort', required: false },
            { name: 'q', required: false },
          ],
        },
      },
      {
        type: 'only-in-oas',
        endpoint: {
          method: 'get',
          servers: [
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
            {
              schemes: ['http'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
          ],
          pathParts: [{ type: 'literal', value: 'categories' }],
          queryParameters: [
            { name: 'page', required: false },
            { name: 'length', required: false },
            { name: 'sort', required: false },
            { name: 'q', required: false },
          ],
        },
      },
      {
        type: 'only-in-oas',
        endpoint: {
          method: 'get',
          servers: [
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
            {
              schemes: ['http'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
          ],
          pathParts: [{ type: 'literal', value: 'admins' }],
          queryParameters: [
            { name: 'page', required: false },
            { name: 'length', required: false },
            { name: 'sort', required: false },
            { name: 'q', required: false },
          ],
        },
      },
      {
        type: 'only-in-oas',
        endpoint: {
          method: 'get',
          servers: [
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
            {
              schemes: ['http'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
          ],
          pathParts: [{ type: 'literal', value: 'providers' }],
          queryParameters: [
            { name: 'page', required: false },
            { name: 'length', required: false },
            { name: 'sort', required: false },
            { name: 'q', required: false },
          ],
        },
      },
      {
        type: 'only-in-oas',
        endpoint: {
          method: 'get',
          servers: [
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
            {
              schemes: ['http'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
          ],
          pathParts: [{ type: 'literal', value: 'secretaries' }],
          queryParameters: [
            { name: 'page', required: false },
            { name: 'length', required: false },
            { name: 'sort', required: false },
            { name: 'q', required: false },
          ],
        },
      },
      {
        type: 'only-in-oas',
        endpoint: {
          method: 'get',
          servers: [
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
            {
              schemes: ['http'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
          ],
          pathParts: [{ type: 'literal', value: 'settings' }],
          queryParameters: [
            { name: 'page', required: false },
            { name: 'length', required: false },
            { name: 'sort', required: false },
            { name: 'q', required: false },
          ],
        },
      },
      {
        type: 'match-with-inconsistenties',
        oasEndpoint: {
          method: 'put',
          servers: [
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
            {
              schemes: ['http'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'appointments' },
            { type: 'parameter', name: 'appointmentId' },
          ],
          queryParameters: [],
        },
        docEndpoint: {
          originalPath: '/api/v1/appointments/:id',
          method: 'put',
          pathParts: [
            { type: 'literal', value: 'api' },
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'appointments' },
            { type: 'parameter', name: 'id' },
          ],
          queryParameters: [],
          line: 148,
        },
        inconsistencies: [
          {
            type: 'path-path-parameter-name-mismatch',
            parameterIndex: 0,
            oasServerIndex: 1,
          },
        ],
      },
      {
        type: 'match-with-inconsistenties',
        oasEndpoint: {
          method: 'delete',
          servers: [
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
            {
              schemes: ['http'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'appointments' },
            { type: 'parameter', name: 'appointmentId' },
          ],
          queryParameters: [],
        },
        docEndpoint: {
          originalPath: '/api/v1/appointments/:id',
          method: 'delete',
          pathParts: [
            { type: 'literal', value: 'api' },
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'appointments' },
            { type: 'parameter', name: 'id' },
          ],
          queryParameters: [],
          line: 149,
        },
        inconsistencies: [
          {
            type: 'path-path-parameter-name-mismatch',
            parameterIndex: 0,
            oasServerIndex: 1,
          },
        ],
      },
      {
        type: 'match-with-inconsistenties',
        oasEndpoint: {
          method: 'put',
          servers: [
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
            {
              schemes: ['http'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'unavailabilities' },
            { type: 'parameter', name: 'unavailabilityId' },
          ],
          queryParameters: [],
        },
        docEndpoint: {
          originalPath: '/api/v1/unavailabilities/:id',
          method: 'put',
          pathParts: [
            { type: 'literal', value: 'api' },
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'unavailabilities' },
            { type: 'parameter', name: 'id' },
          ],
          queryParameters: [],
          line: 169,
        },
        inconsistencies: [
          {
            type: 'path-path-parameter-name-mismatch',
            parameterIndex: 0,
            oasServerIndex: 1,
          },
        ],
      },
      {
        type: 'match-with-inconsistenties',
        oasEndpoint: {
          method: 'delete',
          servers: [
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
            {
              schemes: ['http'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'unavailabilities' },
            { type: 'parameter', name: 'unavailabilityId' },
          ],
          queryParameters: [],
        },
        docEndpoint: {
          originalPath: '/api/v1/unavailabilities/:id',
          method: 'delete',
          pathParts: [
            { type: 'literal', value: 'api' },
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'unavailabilities' },
            { type: 'parameter', name: 'id' },
          ],
          queryParameters: [],
          line: 170,
        },
        inconsistencies: [
          {
            type: 'path-path-parameter-name-mismatch',
            parameterIndex: 0,
            oasServerIndex: 1,
          },
        ],
      },
      {
        type: 'match-with-inconsistenties',
        oasEndpoint: {
          method: 'put',
          servers: [
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
            {
              schemes: ['http'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'customers' },
            { type: 'parameter', name: 'customerId' },
          ],
          queryParameters: [],
        },
        docEndpoint: {
          originalPath: '/api/v1/customers/:id',
          method: 'put',
          pathParts: [
            { type: 'literal', value: 'api' },
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'customers' },
            { type: 'parameter', name: 'id' },
          ],
          queryParameters: [],
          line: 192,
        },
        inconsistencies: [
          {
            type: 'path-path-parameter-name-mismatch',
            parameterIndex: 0,
            oasServerIndex: 1,
          },
        ],
      },
      {
        type: 'match-with-inconsistenties',
        oasEndpoint: {
          method: 'delete',
          servers: [
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
            {
              schemes: ['http'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'customers' },
            { type: 'parameter', name: 'customerId' },
          ],
          queryParameters: [],
        },
        docEndpoint: {
          originalPath: '/api/v1/customers/:id',
          method: 'delete',
          pathParts: [
            { type: 'literal', value: 'api' },
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'customers' },
            { type: 'parameter', name: 'id' },
          ],
          queryParameters: [],
          line: 193,
        },
        inconsistencies: [
          {
            type: 'path-path-parameter-name-mismatch',
            parameterIndex: 0,
            oasServerIndex: 1,
          },
        ],
      },
      {
        type: 'match-with-inconsistenties',
        oasEndpoint: {
          method: 'put',
          servers: [
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
            {
              schemes: ['http'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'services' },
            { type: 'parameter', name: 'serviceId' },
          ],
          queryParameters: [],
        },
        docEndpoint: {
          originalPath: '/api/v1/services/:id',
          method: 'put',
          pathParts: [
            { type: 'literal', value: 'api' },
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'services' },
            { type: 'parameter', name: 'id' },
          ],
          queryParameters: [],
          line: 215,
        },
        inconsistencies: [
          {
            type: 'path-path-parameter-name-mismatch',
            parameterIndex: 0,
            oasServerIndex: 1,
          },
        ],
      },
      {
        type: 'match-with-inconsistenties',
        oasEndpoint: {
          method: 'delete',
          servers: [
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
            {
              schemes: ['http'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'services' },
            { type: 'parameter', name: 'serviceId' },
          ],
          queryParameters: [],
        },
        docEndpoint: {
          originalPath: '/api/v1/services/:id',
          method: 'delete',
          pathParts: [
            { type: 'literal', value: 'api' },
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'services' },
            { type: 'parameter', name: 'id' },
          ],
          queryParameters: [],
          line: 216,
        },
        inconsistencies: [
          {
            type: 'path-path-parameter-name-mismatch',
            parameterIndex: 0,
            oasServerIndex: 1,
          },
        ],
      },
      {
        type: 'match-with-inconsistenties',
        oasEndpoint: {
          method: 'put',
          servers: [
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
            {
              schemes: ['http'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'categories' },
            { type: 'parameter', name: 'categoryId' },
          ],
          queryParameters: [],
        },
        docEndpoint: {
          originalPath: '/api/v1/categories/:id',
          method: 'put',
          pathParts: [
            { type: 'literal', value: 'api' },
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'categories' },
            { type: 'parameter', name: 'id' },
          ],
          queryParameters: [],
          line: 234,
        },
        inconsistencies: [
          {
            type: 'path-path-parameter-name-mismatch',
            parameterIndex: 0,
            oasServerIndex: 1,
          },
        ],
      },
      {
        type: 'match-with-inconsistenties',
        oasEndpoint: {
          method: 'delete',
          servers: [
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
            {
              schemes: ['http'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'categories' },
            { type: 'parameter', name: 'categoryId' },
          ],
          queryParameters: [],
        },
        docEndpoint: {
          originalPath: '/api/v1/categories/:id',
          method: 'delete',
          pathParts: [
            { type: 'literal', value: 'api' },
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'categories' },
            { type: 'parameter', name: 'id' },
          ],
          queryParameters: [],
          line: 235,
        },
        inconsistencies: [
          {
            type: 'path-path-parameter-name-mismatch',
            parameterIndex: 0,
            oasServerIndex: 1,
          },
        ],
      },
      {
        type: 'match-with-inconsistenties',
        oasEndpoint: {
          method: 'put',
          servers: [
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
            {
              schemes: ['http'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'admins' },
            { type: 'parameter', name: 'adminId' },
          ],
          queryParameters: [],
        },
        docEndpoint: {
          originalPath: '/api/v1/admins/:id',
          method: 'put',
          pathParts: [
            { type: 'literal', value: 'api' },
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'admins' },
            { type: 'parameter', name: 'id' },
          ],
          queryParameters: [],
          line: 265,
        },
        inconsistencies: [
          {
            type: 'path-path-parameter-name-mismatch',
            parameterIndex: 0,
            oasServerIndex: 1,
          },
        ],
      },
      {
        type: 'match-with-inconsistenties',
        oasEndpoint: {
          method: 'delete',
          servers: [
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
            {
              schemes: ['http'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'admins' },
            { type: 'parameter', name: 'adminId' },
          ],
          queryParameters: [],
        },
        docEndpoint: {
          originalPath: '/api/v1/admins/:id',
          method: 'delete',
          pathParts: [
            { type: 'literal', value: 'api' },
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'admins' },
            { type: 'parameter', name: 'id' },
          ],
          queryParameters: [],
          line: 266,
        },
        inconsistencies: [
          {
            type: 'path-path-parameter-name-mismatch',
            parameterIndex: 0,
            oasServerIndex: 1,
          },
        ],
      },
      {
        type: 'match-with-inconsistenties',
        oasEndpoint: {
          method: 'put',
          servers: [
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
            {
              schemes: ['http'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'providers' },
            { type: 'parameter', name: 'providerId' },
          ],
          queryParameters: [],
        },
        docEndpoint: {
          originalPath: '/api/v1/providers/:id',
          method: 'put',
          pathParts: [
            { type: 'literal', value: 'api' },
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'providers' },
            { type: 'parameter', name: 'id' },
          ],
          queryParameters: [],
          line: 365,
        },
        inconsistencies: [
          {
            type: 'path-path-parameter-name-mismatch',
            parameterIndex: 0,
            oasServerIndex: 1,
          },
        ],
      },
      {
        type: 'match-with-inconsistenties',
        oasEndpoint: {
          method: 'delete',
          servers: [
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
            {
              schemes: ['http'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'providers' },
            { type: 'parameter', name: 'providerId' },
          ],
          queryParameters: [],
        },
        docEndpoint: {
          originalPath: '/api/v1/providers/:id',
          method: 'delete',
          pathParts: [
            { type: 'literal', value: 'api' },
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'providers' },
            { type: 'parameter', name: 'id' },
          ],
          queryParameters: [],
          line: 366,
        },
        inconsistencies: [
          {
            type: 'path-path-parameter-name-mismatch',
            parameterIndex: 0,
            oasServerIndex: 1,
          },
        ],
      },
      {
        type: 'match-with-inconsistenties',
        oasEndpoint: {
          method: 'put',
          servers: [
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
            {
              schemes: ['http'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'secretaries' },
            { type: 'parameter', name: 'secretaryId' },
          ],
          queryParameters: [],
        },
        docEndpoint: {
          originalPath: '/api/v1/secretaries/:id',
          method: 'put',
          pathParts: [
            { type: 'literal', value: 'api' },
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'secretaries' },
            { type: 'parameter', name: 'id' },
          ],
          queryParameters: [],
          line: 401,
        },
        inconsistencies: [
          {
            type: 'path-path-parameter-name-mismatch',
            parameterIndex: 0,
            oasServerIndex: 1,
          },
        ],
      },
      {
        type: 'match-with-inconsistenties',
        oasEndpoint: {
          method: 'delete',
          servers: [
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
            {
              schemes: ['http'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'secretaries' },
            { type: 'parameter', name: 'secretaryId' },
          ],
          queryParameters: [],
        },
        docEndpoint: {
          originalPath: '/api/v1/secretaries/:id',
          method: 'delete',
          pathParts: [
            { type: 'literal', value: 'api' },
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'secretaries' },
            { type: 'parameter', name: 'id' },
          ],
          queryParameters: [],
          line: 402,
        },
        inconsistencies: [
          {
            type: 'path-path-parameter-name-mismatch',
            parameterIndex: 0,
            oasServerIndex: 1,
          },
        ],
      },
      {
        type: 'match-with-inconsistenties',
        oasEndpoint: {
          method: 'put',
          servers: [
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
            {
              schemes: ['http'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'settings' },
            { type: 'parameter', name: 'settingName' },
          ],
          queryParameters: [],
        },
        docEndpoint: {
          originalPath: '/api/v1/settings/:name',
          method: 'put',
          pathParts: [
            { type: 'literal', value: 'api' },
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'settings' },
            { type: 'parameter', name: 'name' },
          ],
          queryParameters: [],
          line: 420,
        },
        inconsistencies: [
          {
            type: 'path-path-parameter-name-mismatch',
            parameterIndex: 0,
            oasServerIndex: 1,
          },
        ],
      },
      {
        type: 'match-with-inconsistenties',
        oasEndpoint: {
          method: 'delete',
          servers: [
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
            {
              schemes: ['http'],
              basePath: [
                { type: 'literal', value: 'index.php' },
                { type: 'literal', value: 'api' },
                { type: 'literal', value: 'v1' },
              ],
              host: 'demo.easyappointments.org',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'settings' },
            { type: 'parameter', name: 'settingName' },
          ],
          queryParameters: [],
        },
        docEndpoint: {
          originalPath: '/api/v1/settings/:name',
          method: 'delete',
          pathParts: [
            { type: 'literal', value: 'api' },
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'settings' },
            { type: 'parameter', name: 'name' },
          ],
          queryParameters: [],
          line: 421,
        },
        inconsistencies: [
          {
            type: 'path-path-parameter-name-mismatch',
            parameterIndex: 0,
            oasServerIndex: 1,
          },
        ],
      },
    ]);
  });
});
