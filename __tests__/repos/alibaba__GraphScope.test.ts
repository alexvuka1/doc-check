import * as core from '@actions/core';
import { beforeEach, describe, it, spyOn } from 'bun:test';
import * as main from '../../src/main';
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

  it('handles alibaba/GraphScope', async () => {
    await setupInputRepo(getInputMock, {
      repoName: 'alibaba/GraphScope',
      sha: 'bf4bd712041a04ce3adba56939a5bccaad13e137',
      pathOas: 'flex/openapi/openapi_interactive.yaml',
      pathDoc: 'docs/flex/interactive/development/restful_api.md',
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
                { type: 'literal', value: 'GRAPHSCOPE' },
                { type: 'literal', value: 'InteractiveAPI' },
                { type: 'literal', value: '1.0.0' },
              ],
              host: 'virtserver.swaggerhub.com',
            },
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'GRAPHSCOPE' },
                { type: 'literal', value: 'interactive' },
                { type: 'literal', value: '1.0.0' },
              ],
              host: 'virtserver.swaggerhub.com',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'graph' },
            { type: 'parameter', name: 'graph_id' },
            { type: 'literal', value: 'vertex' },
          ],
          queryParameters: [
            { name: 'label', required: true },
            { name: 'primary_key_value', required: true },
          ],
        },
      },
      {
        type: 'only-in-oas',
        endpoint: {
          method: 'put',
          servers: [
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'GRAPHSCOPE' },
                { type: 'literal', value: 'InteractiveAPI' },
                { type: 'literal', value: '1.0.0' },
              ],
              host: 'virtserver.swaggerhub.com',
            },
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'GRAPHSCOPE' },
                { type: 'literal', value: 'interactive' },
                { type: 'literal', value: '1.0.0' },
              ],
              host: 'virtserver.swaggerhub.com',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'graph' },
            { type: 'parameter', name: 'graph_id' },
            { type: 'literal', value: 'vertex' },
          ],
          queryParameters: [],
        },
      },
      {
        type: 'only-in-oas',
        endpoint: {
          method: 'post',
          servers: [
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'GRAPHSCOPE' },
                { type: 'literal', value: 'InteractiveAPI' },
                { type: 'literal', value: '1.0.0' },
              ],
              host: 'virtserver.swaggerhub.com',
            },
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'GRAPHSCOPE' },
                { type: 'literal', value: 'interactive' },
                { type: 'literal', value: '1.0.0' },
              ],
              host: 'virtserver.swaggerhub.com',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'graph' },
            { type: 'parameter', name: 'graph_id' },
            { type: 'literal', value: 'vertex' },
          ],
          queryParameters: [],
        },
      },
      {
        type: 'only-in-oas',
        endpoint: {
          method: 'delete',
          servers: [
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'GRAPHSCOPE' },
                { type: 'literal', value: 'InteractiveAPI' },
                { type: 'literal', value: '1.0.0' },
              ],
              host: 'virtserver.swaggerhub.com',
            },
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'GRAPHSCOPE' },
                { type: 'literal', value: 'interactive' },
                { type: 'literal', value: '1.0.0' },
              ],
              host: 'virtserver.swaggerhub.com',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'graph' },
            { type: 'parameter', name: 'graph_id' },
            { type: 'literal', value: 'vertex' },
          ],
          queryParameters: [
            { name: 'label', required: true },
            { name: 'primary_key_value', required: true },
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
                { type: 'literal', value: 'GRAPHSCOPE' },
                { type: 'literal', value: 'InteractiveAPI' },
                { type: 'literal', value: '1.0.0' },
              ],
              host: 'virtserver.swaggerhub.com',
            },
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'GRAPHSCOPE' },
                { type: 'literal', value: 'interactive' },
                { type: 'literal', value: '1.0.0' },
              ],
              host: 'virtserver.swaggerhub.com',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'graph' },
            { type: 'parameter', name: 'graph_id' },
            { type: 'literal', value: 'edge' },
          ],
          queryParameters: [
            { name: 'edge_label', required: true },
            { name: 'src_label', required: true },
            { name: 'src_primary_key_value', required: true },
            { name: 'dst_label', required: true },
            { name: 'dst_primary_key_value', required: true },
          ],
        },
      },
      {
        type: 'only-in-oas',
        endpoint: {
          method: 'put',
          servers: [
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'GRAPHSCOPE' },
                { type: 'literal', value: 'InteractiveAPI' },
                { type: 'literal', value: '1.0.0' },
              ],
              host: 'virtserver.swaggerhub.com',
            },
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'GRAPHSCOPE' },
                { type: 'literal', value: 'interactive' },
                { type: 'literal', value: '1.0.0' },
              ],
              host: 'virtserver.swaggerhub.com',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'graph' },
            { type: 'parameter', name: 'graph_id' },
            { type: 'literal', value: 'edge' },
          ],
          queryParameters: [],
        },
      },
      {
        type: 'only-in-oas',
        endpoint: {
          method: 'post',
          servers: [
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'GRAPHSCOPE' },
                { type: 'literal', value: 'InteractiveAPI' },
                { type: 'literal', value: '1.0.0' },
              ],
              host: 'virtserver.swaggerhub.com',
            },
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'GRAPHSCOPE' },
                { type: 'literal', value: 'interactive' },
                { type: 'literal', value: '1.0.0' },
              ],
              host: 'virtserver.swaggerhub.com',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'graph' },
            { type: 'parameter', name: 'graph_id' },
            { type: 'literal', value: 'edge' },
          ],
          queryParameters: [],
        },
      },
      {
        type: 'only-in-oas',
        endpoint: {
          method: 'delete',
          servers: [
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'GRAPHSCOPE' },
                { type: 'literal', value: 'InteractiveAPI' },
                { type: 'literal', value: '1.0.0' },
              ],
              host: 'virtserver.swaggerhub.com',
            },
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'GRAPHSCOPE' },
                { type: 'literal', value: 'interactive' },
                { type: 'literal', value: '1.0.0' },
              ],
              host: 'virtserver.swaggerhub.com',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'graph' },
            { type: 'parameter', name: 'graph_id' },
            { type: 'literal', value: 'edge' },
          ],
          queryParameters: [
            { name: 'src_label', required: true },
            { name: 'src_primary_key_value', required: true },
            { name: 'dst_label', required: true },
            { name: 'dst_primary_key_value', required: true },
          ],
        },
      },
      {
        type: 'only-in-oas',
        endpoint: {
          method: 'post',
          servers: [
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'GRAPHSCOPE' },
                { type: 'literal', value: 'InteractiveAPI' },
                { type: 'literal', value: '1.0.0' },
              ],
              host: 'virtserver.swaggerhub.com',
            },
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'GRAPHSCOPE' },
                { type: 'literal', value: 'interactive' },
                { type: 'literal', value: '1.0.0' },
              ],
              host: 'virtserver.swaggerhub.com',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'graph' },
            { type: 'parameter', name: 'graph_id' },
            { type: 'literal', value: 'query' },
          ],
          queryParameters: [],
        },
      },
      {
        type: 'only-in-doc',
        endpoint: {
          originalPath: '/v1/node/status',
          method: 'get',
          pathParts: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'node' },
            { type: 'literal', value: 'status' },
          ],
          queryParameters: [],
          line: 28,
        },
      },
      {
        type: 'match-with-inconsistenties',
        oasEndpoint: {
          method: 'delete',
          servers: [
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'GRAPHSCOPE' },
                { type: 'literal', value: 'InteractiveAPI' },
                { type: 'literal', value: '1.0.0' },
              ],
              host: 'virtserver.swaggerhub.com',
            },
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'GRAPHSCOPE' },
                { type: 'literal', value: 'interactive' },
                { type: 'literal', value: '1.0.0' },
              ],
              host: 'virtserver.swaggerhub.com',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'graph' },
            { type: 'parameter', name: 'graph_id' },
          ],
          queryParameters: [],
        },
        docEndpoint: {
          originalPath: '/v1/graph/{graph}',
          method: 'delete',
          pathParts: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'graph' },
            { type: 'parameter', name: 'graph' },
          ],
          queryParameters: [],
          line: 17,
        },
        inconsistencies: [
          {
            type: 'path-path-parameter-name-mismatch',
            parameterIndex: 0,
            oasServerIndex: null,
          },
        ],
      },
      {
        type: 'match-with-inconsistenties',
        oasEndpoint: {
          method: 'get',
          servers: [
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'GRAPHSCOPE' },
                { type: 'literal', value: 'InteractiveAPI' },
                { type: 'literal', value: '1.0.0' },
              ],
              host: 'virtserver.swaggerhub.com',
            },
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'GRAPHSCOPE' },
                { type: 'literal', value: 'interactive' },
                { type: 'literal', value: '1.0.0' },
              ],
              host: 'virtserver.swaggerhub.com',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'graph' },
            { type: 'parameter', name: 'graph_id' },
            { type: 'literal', value: 'schema' },
          ],
          queryParameters: [],
        },
        docEndpoint: {
          originalPath: '/v1/graph/{graph}/schema',
          method: 'get',
          pathParts: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'graph' },
            { type: 'parameter', name: 'graph' },
            { type: 'literal', value: 'schema' },
          ],
          queryParameters: [],
          line: 15,
        },
        inconsistencies: [
          {
            type: 'path-path-parameter-name-mismatch',
            parameterIndex: 0,
            oasServerIndex: null,
          },
        ],
      },
      {
        type: 'match-with-inconsistenties',
        oasEndpoint: {
          method: 'post',
          servers: [
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'GRAPHSCOPE' },
                { type: 'literal', value: 'InteractiveAPI' },
                { type: 'literal', value: '1.0.0' },
              ],
              host: 'virtserver.swaggerhub.com',
            },
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'GRAPHSCOPE' },
                { type: 'literal', value: 'interactive' },
                { type: 'literal', value: '1.0.0' },
              ],
              host: 'virtserver.swaggerhub.com',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'graph' },
            { type: 'parameter', name: 'graph_id' },
            { type: 'literal', value: 'dataloading' },
          ],
          queryParameters: [],
        },
        docEndpoint: {
          originalPath: '/v1/graph/{graph}/dataloading',
          method: 'post',
          pathParts: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'graph' },
            { type: 'parameter', name: 'graph' },
            { type: 'literal', value: 'dataloading' },
          ],
          queryParameters: [],
          line: 18,
        },
        inconsistencies: [
          {
            type: 'path-path-parameter-name-mismatch',
            parameterIndex: 0,
            oasServerIndex: null,
          },
        ],
      },
      {
        type: 'match-with-inconsistenties',
        oasEndpoint: {
          method: 'get',
          servers: [
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'GRAPHSCOPE' },
                { type: 'literal', value: 'InteractiveAPI' },
                { type: 'literal', value: '1.0.0' },
              ],
              host: 'virtserver.swaggerhub.com',
            },
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'GRAPHSCOPE' },
                { type: 'literal', value: 'interactive' },
                { type: 'literal', value: '1.0.0' },
              ],
              host: 'virtserver.swaggerhub.com',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'graph' },
            { type: 'parameter', name: 'graph_id' },
            { type: 'literal', value: 'procedure' },
          ],
          queryParameters: [],
        },
        docEndpoint: {
          originalPath: '/v1/graph/{graph}/procedure',
          method: 'get',
          pathParts: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'graph' },
            { type: 'parameter', name: 'graph' },
            { type: 'literal', value: 'procedure' },
          ],
          queryParameters: [],
          line: 20,
        },
        inconsistencies: [
          {
            type: 'path-path-parameter-name-mismatch',
            parameterIndex: 0,
            oasServerIndex: null,
          },
        ],
      },
      {
        type: 'match-with-inconsistenties',
        oasEndpoint: {
          method: 'post',
          servers: [
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'GRAPHSCOPE' },
                { type: 'literal', value: 'InteractiveAPI' },
                { type: 'literal', value: '1.0.0' },
              ],
              host: 'virtserver.swaggerhub.com',
            },
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'GRAPHSCOPE' },
                { type: 'literal', value: 'interactive' },
                { type: 'literal', value: '1.0.0' },
              ],
              host: 'virtserver.swaggerhub.com',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'graph' },
            { type: 'parameter', name: 'graph_id' },
            { type: 'literal', value: 'procedure' },
          ],
          queryParameters: [],
        },
        docEndpoint: {
          originalPath: '/v1/graph/{graph}/procedure',
          method: 'post',
          pathParts: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'graph' },
            { type: 'parameter', name: 'graph' },
            { type: 'literal', value: 'procedure' },
          ],
          queryParameters: [],
          line: 19,
        },
        inconsistencies: [
          {
            type: 'path-path-parameter-name-mismatch',
            parameterIndex: 0,
            oasServerIndex: null,
          },
        ],
      },
      {
        type: 'match-with-inconsistenties',
        oasEndpoint: {
          method: 'get',
          servers: [
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'GRAPHSCOPE' },
                { type: 'literal', value: 'InteractiveAPI' },
                { type: 'literal', value: '1.0.0' },
              ],
              host: 'virtserver.swaggerhub.com',
            },
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'GRAPHSCOPE' },
                { type: 'literal', value: 'interactive' },
                { type: 'literal', value: '1.0.0' },
              ],
              host: 'virtserver.swaggerhub.com',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'graph' },
            { type: 'parameter', name: 'graph_id' },
            { type: 'literal', value: 'procedure' },
            { type: 'parameter', name: 'procedure_id' },
          ],
          queryParameters: [],
        },
        docEndpoint: {
          originalPath: '/v1/graph/{graph}/procedure/{proc_name}',
          method: 'get',
          pathParts: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'graph' },
            { type: 'parameter', name: 'graph' },
            { type: 'literal', value: 'procedure' },
            { type: 'parameter', name: 'proc_name' },
          ],
          queryParameters: [],
          line: 21,
        },
        inconsistencies: [
          {
            type: 'path-path-parameter-name-mismatch',
            parameterIndex: 0,
            oasServerIndex: null,
          },
          {
            type: 'path-path-parameter-name-mismatch',
            parameterIndex: 1,
            oasServerIndex: null,
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
                { type: 'literal', value: 'GRAPHSCOPE' },
                { type: 'literal', value: 'InteractiveAPI' },
                { type: 'literal', value: '1.0.0' },
              ],
              host: 'virtserver.swaggerhub.com',
            },
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'GRAPHSCOPE' },
                { type: 'literal', value: 'interactive' },
                { type: 'literal', value: '1.0.0' },
              ],
              host: 'virtserver.swaggerhub.com',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'graph' },
            { type: 'parameter', name: 'graph_id' },
            { type: 'literal', value: 'procedure' },
            { type: 'parameter', name: 'procedure_id' },
          ],
          queryParameters: [],
        },
        docEndpoint: {
          originalPath: '/v1/graph/{graph}/procedure/{proc_name}',
          method: 'put',
          pathParts: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'graph' },
            { type: 'parameter', name: 'graph' },
            { type: 'literal', value: 'procedure' },
            { type: 'parameter', name: 'proc_name' },
          ],
          queryParameters: [],
          line: 23,
        },
        inconsistencies: [
          {
            type: 'path-path-parameter-name-mismatch',
            parameterIndex: 0,
            oasServerIndex: null,
          },
          {
            type: 'path-path-parameter-name-mismatch',
            parameterIndex: 1,
            oasServerIndex: null,
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
                { type: 'literal', value: 'GRAPHSCOPE' },
                { type: 'literal', value: 'InteractiveAPI' },
                { type: 'literal', value: '1.0.0' },
              ],
              host: 'virtserver.swaggerhub.com',
            },
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'GRAPHSCOPE' },
                { type: 'literal', value: 'interactive' },
                { type: 'literal', value: '1.0.0' },
              ],
              host: 'virtserver.swaggerhub.com',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'graph' },
            { type: 'parameter', name: 'graph_id' },
            { type: 'literal', value: 'procedure' },
            { type: 'parameter', name: 'procedure_id' },
          ],
          queryParameters: [],
        },
        docEndpoint: {
          originalPath: '/v1/graph/{graph}/procedure/{proc_name}',
          method: 'delete',
          pathParts: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'graph' },
            { type: 'parameter', name: 'graph' },
            { type: 'literal', value: 'procedure' },
            { type: 'parameter', name: 'proc_name' },
          ],
          queryParameters: [],
          line: 22,
        },
        inconsistencies: [
          {
            type: 'path-path-parameter-name-mismatch',
            parameterIndex: 0,
            oasServerIndex: null,
          },
          {
            type: 'path-path-parameter-name-mismatch',
            parameterIndex: 1,
            oasServerIndex: null,
          },
        ],
      },
      {
        type: 'match-with-inconsistenties',
        oasEndpoint: {
          method: 'post',
          servers: [
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'GRAPHSCOPE' },
                { type: 'literal', value: 'InteractiveAPI' },
                { type: 'literal', value: '1.0.0' },
              ],
              host: 'virtserver.swaggerhub.com',
            },
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'GRAPHSCOPE' },
                { type: 'literal', value: 'interactive' },
                { type: 'literal', value: '1.0.0' },
              ],
              host: 'virtserver.swaggerhub.com',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'service' },
            { type: 'literal', value: 'stop' },
          ],
          queryParameters: [],
        },
        docEndpoint: {
          originalPath: '/v1/service/stop',
          method: 'get',
          pathParts: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'service' },
            { type: 'literal', value: 'stop' },
          ],
          queryParameters: [],
          line: 26,
        },
        inconsistencies: [{ type: 'method-mismatch' }],
      },
    ]);
  });
});
