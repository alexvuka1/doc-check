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
      urlOpenApi:
        'https://github.com/alibaba/GraphScope/blob/f15605b083ac92c6a8bf33ed6bb44616eae30a03/flex/openapi/openapi_interactive.yaml',
      urlDoc:
        'https://github.com/alibaba/GraphScope/blob/f15605b083ac92c6a8bf33ed6bb44616eae30a03/docs/flex/interactive/development/restful_api.md',
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
          method: 'get',
          pathParts: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'node' },
            { type: 'literal', value: 'status' },
          ],
          queryParameters: [],
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
          method: 'delete',
          pathParts: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'graph' },
            { type: 'parameter', name: 'graph' },
          ],
          queryParameters: [],
        },
        inconsistencies: [
          { type: 'parameter-name-mismatch', parameterIndex: 0 },
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
          method: 'get',
          pathParts: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'graph' },
            { type: 'parameter', name: 'graph' },
            { type: 'literal', value: 'schema' },
          ],
          queryParameters: [],
        },
        inconsistencies: [
          { type: 'parameter-name-mismatch', parameterIndex: 0 },
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
          method: 'post',
          pathParts: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'graph' },
            { type: 'parameter', name: 'graph' },
            { type: 'literal', value: 'dataloading' },
          ],
          queryParameters: [],
        },
        inconsistencies: [
          { type: 'parameter-name-mismatch', parameterIndex: 0 },
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
          method: 'get',
          pathParts: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'graph' },
            { type: 'parameter', name: 'graph' },
            { type: 'literal', value: 'procedure' },
          ],
          queryParameters: [],
        },
        inconsistencies: [
          { type: 'parameter-name-mismatch', parameterIndex: 0 },
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
          method: 'post',
          pathParts: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'graph' },
            { type: 'parameter', name: 'graph' },
            { type: 'literal', value: 'procedure' },
          ],
          queryParameters: [],
        },
        inconsistencies: [
          { type: 'parameter-name-mismatch', parameterIndex: 0 },
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
          method: 'get',
          pathParts: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'graph' },
            { type: 'parameter', name: 'graph' },
            { type: 'literal', value: 'procedure' },
            { type: 'parameter', name: 'proc_name' },
          ],
          queryParameters: [],
        },
        inconsistencies: [
          { type: 'parameter-name-mismatch', parameterIndex: 0 },
          { type: 'parameter-name-mismatch', parameterIndex: 1 },
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
          method: 'put',
          pathParts: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'graph' },
            { type: 'parameter', name: 'graph' },
            { type: 'literal', value: 'procedure' },
            { type: 'parameter', name: 'proc_name' },
          ],
          queryParameters: [],
        },
        inconsistencies: [
          { type: 'parameter-name-mismatch', parameterIndex: 0 },
          { type: 'parameter-name-mismatch', parameterIndex: 1 },
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
          method: 'delete',
          pathParts: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'graph' },
            { type: 'parameter', name: 'graph' },
            { type: 'literal', value: 'procedure' },
            { type: 'parameter', name: 'proc_name' },
          ],
          queryParameters: [],
        },
        inconsistencies: [
          { type: 'parameter-name-mismatch', parameterIndex: 0 },
          { type: 'parameter-name-mismatch', parameterIndex: 1 },
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
          method: 'get',
          pathParts: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'service' },
            { type: 'literal', value: 'stop' },
          ],
          queryParameters: [],
        },
        inconsistencies: [{ type: 'method-mismatch' }],
      },
    ]);
  });
});
