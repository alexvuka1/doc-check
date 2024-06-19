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

  it('handles alibaba/GraphScope', async () => {
    await setupInputRepo(getInputMock, repoInfos['alibaba/GraphScope']);

    await main.run();

    expectFail(setFailedMock).toEqual([
      {
        type: 'only-in-oas',
        requestConfig: {
          method: 'get',
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
        requestConfig: {
          method: 'put',
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
            { type: 'literal', value: 'vertex' },
          ],
          queryParameters: [],
        },
      },
      {
        type: 'only-in-oas',
        requestConfig: {
          method: 'post',
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
            { type: 'literal', value: 'vertex' },
          ],
          queryParameters: [],
        },
      },
      {
        type: 'only-in-oas',
        requestConfig: {
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
        requestConfig: {
          method: 'get',
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
        requestConfig: {
          method: 'put',
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
            { type: 'literal', value: 'edge' },
          ],
          queryParameters: [],
        },
      },
      {
        type: 'only-in-oas',
        requestConfig: {
          method: 'post',
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
            { type: 'literal', value: 'edge' },
          ],
          queryParameters: [],
        },
      },
      {
        type: 'only-in-oas',
        requestConfig: {
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
        requestConfig: {
          method: 'post',
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
            { type: 'literal', value: 'query' },
          ],
          queryParameters: [],
        },
      },
      {
        type: 'only-in-doc',
        requestConfig: {
          originalPath: '/v1/service/stop',
          method: 'get',
          pathSegs: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'service' },
            { type: 'literal', value: 'stop' },
          ],
          queryParameters: [],
          line: 26,
        },
      },
      {
        type: 'only-in-doc',
        requestConfig: {
          originalPath: '/v1/node/status',
          method: 'get',
          pathSegs: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'node' },
            { type: 'literal', value: 'status' },
          ],
          queryParameters: [],
          line: 28,
        },
      },
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
          line: 17,
        },
        conflicts: [
          {
            type: 'path-parameter-name-mismatch',
            parameterIndex: 0,
            oasServerIndex: null,
          },
        ],
      },
      {
        type: 'match-with-conflicts',
        oasRequestConfig: {
          method: 'get',
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
            { type: 'literal', value: 'schema' },
          ],
          queryParameters: [],
        },
        docRequestConfig: {
          originalPath: '/v1/graph/{graph}/schema',
          method: 'get',
          pathSegs: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'graph' },
            { type: 'parameter', name: 'graph' },
            { type: 'literal', value: 'schema' },
          ],
          queryParameters: [],
          line: 15,
        },
        conflicts: [
          {
            type: 'path-parameter-name-mismatch',
            parameterIndex: 0,
            oasServerIndex: null,
          },
        ],
      },
      {
        type: 'match-with-conflicts',
        oasRequestConfig: {
          method: 'post',
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
            { type: 'literal', value: 'dataloading' },
          ],
          queryParameters: [],
        },
        docRequestConfig: {
          originalPath: '/v1/graph/{graph}/dataloading',
          method: 'post',
          pathSegs: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'graph' },
            { type: 'parameter', name: 'graph' },
            { type: 'literal', value: 'dataloading' },
          ],
          queryParameters: [],
          line: 18,
        },
        conflicts: [
          {
            type: 'path-parameter-name-mismatch',
            parameterIndex: 0,
            oasServerIndex: null,
          },
        ],
      },
      {
        type: 'match-with-conflicts',
        oasRequestConfig: {
          method: 'get',
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
            { type: 'literal', value: 'procedure' },
          ],
          queryParameters: [],
        },
        docRequestConfig: {
          originalPath: '/v1/graph/{graph}/procedure',
          method: 'get',
          pathSegs: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'graph' },
            { type: 'parameter', name: 'graph' },
            { type: 'literal', value: 'procedure' },
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
      {
        type: 'match-with-conflicts',
        oasRequestConfig: {
          method: 'post',
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
            { type: 'literal', value: 'procedure' },
          ],
          queryParameters: [],
        },
        docRequestConfig: {
          originalPath: '/v1/graph/{graph}/procedure',
          method: 'post',
          pathSegs: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'graph' },
            { type: 'parameter', name: 'graph' },
            { type: 'literal', value: 'procedure' },
          ],
          queryParameters: [],
          line: 19,
        },
        conflicts: [
          {
            type: 'path-parameter-name-mismatch',
            parameterIndex: 0,
            oasServerIndex: null,
          },
        ],
      },
      {
        type: 'match-with-conflicts',
        oasRequestConfig: {
          method: 'get',
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
            { type: 'literal', value: 'procedure' },
            { type: 'parameter', name: 'procedure_id' },
          ],
          queryParameters: [],
        },
        docRequestConfig: {
          originalPath: '/v1/graph/{graph}/procedure/{proc_name}',
          method: 'get',
          pathSegs: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'graph' },
            { type: 'parameter', name: 'graph' },
            { type: 'literal', value: 'procedure' },
            { type: 'parameter', name: 'proc_name' },
          ],
          queryParameters: [],
          line: 21,
        },
        conflicts: [
          {
            type: 'path-parameter-name-mismatch',
            parameterIndex: 0,
            oasServerIndex: null,
          },
          {
            type: 'path-parameter-name-mismatch',
            parameterIndex: 1,
            oasServerIndex: null,
          },
        ],
      },
      {
        type: 'match-with-conflicts',
        oasRequestConfig: {
          method: 'put',
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
            { type: 'literal', value: 'procedure' },
            { type: 'parameter', name: 'procedure_id' },
          ],
          queryParameters: [],
        },
        docRequestConfig: {
          originalPath: '/v1/graph/{graph}/procedure/{proc_name}',
          method: 'put',
          pathSegs: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'graph' },
            { type: 'parameter', name: 'graph' },
            { type: 'literal', value: 'procedure' },
            { type: 'parameter', name: 'proc_name' },
          ],
          queryParameters: [],
          line: 23,
        },
        conflicts: [
          {
            type: 'path-parameter-name-mismatch',
            parameterIndex: 0,
            oasServerIndex: null,
          },
          {
            type: 'path-parameter-name-mismatch',
            parameterIndex: 1,
            oasServerIndex: null,
          },
        ],
      },
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
            { type: 'literal', value: 'procedure' },
            { type: 'parameter', name: 'procedure_id' },
          ],
          queryParameters: [],
        },
        docRequestConfig: {
          originalPath: '/v1/graph/{graph}/procedure/{proc_name}',
          method: 'delete',
          pathSegs: [
            { type: 'literal', value: 'v1' },
            { type: 'literal', value: 'graph' },
            { type: 'parameter', name: 'graph' },
            { type: 'literal', value: 'procedure' },
            { type: 'parameter', name: 'proc_name' },
          ],
          queryParameters: [],
          line: 22,
        },
        conflicts: [
          {
            type: 'path-parameter-name-mismatch',
            parameterIndex: 0,
            oasServerIndex: null,
          },
          {
            type: 'path-parameter-name-mismatch',
            parameterIndex: 1,
            oasServerIndex: null,
          },
        ],
      },
    ]);
  });
});
