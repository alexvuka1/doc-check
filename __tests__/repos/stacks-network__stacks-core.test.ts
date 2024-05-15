import * as core from '@actions/core';
import { beforeEach, describe, it, spyOn } from 'bun:test';
import { mkdirSync } from 'fs';
import { join } from 'path';
import * as main from '../../src/main';
import { expectFail, getOrDownload, setupInputRepo } from '../utils';

const getInputMock = spyOn(core, 'getInput');
const setFailedMock = spyOn(core, 'setFailed');
const debugMock = spyOn(core, 'debug');

describe('action', () => {
  beforeEach(() => {
    getInputMock.mockReset();
    setFailedMock.mockReset();
    debugMock.mockReset();
  });

  it('handles stacks-network/stacks-core', async () => {
    const repoName = 'stacks-network/stacks-core';
    await setupInputRepo(getInputMock, {
      repoName,
      urlOpenApi:
        'https://github.com/stacks-network/stacks-core/blob/b7f7295775ba8571ed322846367451fc6bf44126/docs/rpc/openapi.yaml',
      urlDoc:
        'https://github.com/stacks-network/stacks-core/blob/b7f7295775ba8571ed322846367451fc6bf44126/docs/rpc-endpoints.md',
    });

    const apiDirs = ['contract', 'core-node', 'trait', 'transaction'];
    const [contractDir, coreNodeDir, traitDir, transactionDir] = apiDirs.map(
      apiDir => {
        const apiDirPath = join(
          import.meta.dir,
          '..',
          'data',
          'repos',
          repoName.replace('/', '__'),
          'api',
          apiDir,
        );
        mkdirSync(apiDirPath, { recursive: true });
        return apiDirPath;
      },
    );

    const entitiesContractsDir = join(
      import.meta.dir,
      '..',
      'data',
      'repos',
      repoName.replace('/', '__'),
      'entities',
      'contracts',
    );
    mkdirSync(entitiesContractsDir, { recursive: true });

    const a = [
      [contractDir, 'contract/post-call-read-only-fn-fail.example.json'],
      [contractDir, 'contract/post-call-read-only-fn-success.example.json'],
      [contractDir, 'contract/post-call-read-only-fn.schema.json'],
      [coreNodeDir, 'core-node/get-account-data.example.json'],
      [coreNodeDir, 'core-node/get-account-data.schema.json'],
      [coreNodeDir, 'core-node/get-burn-ops-peg-in.example.json'],
      [coreNodeDir, 'core-node/get-burn-ops-peg-out-fulfill.example.json'],
      [coreNodeDir, 'core-node/get-burn-ops-peg-out-request.example.json'],
      [coreNodeDir, 'core-node/get-constant-val.example.json'],
      [coreNodeDir, 'core-node/get-constant-val.schema.json'],
      [coreNodeDir, 'core-node/get-contract-data-map-entry.example.json'],
      [coreNodeDir, 'core-node/get-contract-data-map-entry.schema.json'],
      [coreNodeDir, 'core-node/get-contract-interface.example.json'],
      [coreNodeDir, 'core-node/get-contract-interface.schema.json'],
      [coreNodeDir, 'core-node/get-contract-source.example.json'],
      [coreNodeDir, 'core-node/get-contract-source.schema.json'],
      [coreNodeDir, 'core-node/get-fee-transfer.example.json'],
      [coreNodeDir, 'core-node/get-fee-transfer.schema.json'],
      [coreNodeDir, 'core-node/get-info.example.json'],
      [coreNodeDir, 'core-node/get-info.schema.json'],
      [coreNodeDir, 'core-node/get-pox.example.json'],
      [coreNodeDir, 'core-node/get-pox.schema.json'],
      [coreNodeDir, 'core-node/get_stacker_set.400.example.json'],
      [coreNodeDir, 'core-node/get_stacker_set.example.json'],
      [coreNodeDir, 'core-node/get_tenure_info.json'],
      [coreNodeDir, 'core-node/post-block-proposal-req.example.json'],
      [coreNodeDir, 'core-node/post-block-proposal-response.429.json'],
      [coreNodeDir, 'core-node/post-block-proposal-response.example.json'],
      [coreNodeDir, 'core-node/post-fee-transaction-response.example.json'],
      [coreNodeDir, 'core-node/post-fee-transaction-response.schema.json'],
      [coreNodeDir, 'core-node/post-fee-transaction.example.json'],
      [coreNodeDir, 'core-node/post-fee-transaction.schema.json'],
      [traitDir, 'trait/get-is-trait-implemented.example.json'],
      [traitDir, 'trait/get-is-trait-implemented.schema.json'],
      [
        transactionDir,
        'transaction/post-core-node-transactions-error.example.json',
      ],
      [
        transactionDir,
        'transaction/post-core-node-transactions-error.schema.json',
      ],
    ];

    await Promise.all([
      ...a.map(([dir, filePath]) =>
        getOrDownload(
          repoName,
          `https://github.com/stacks-network/stacks-core/blob/b7f7295775ba8571ed322846367451fc6bf44126/docs/rpc/api/${filePath}`,
          dir,
        ),
      ),
      getOrDownload(
        repoName,
        `https://github.com/stacks-network/stacks-core/blob/b7f7295775ba8571ed322846367451fc6bf44126/docs/rpc/entities/contracts/read-only-function-args.schema.json`,
        entitiesContractsDir,
      ),
    ]);

    await main.run();

    expectFail(setFailedMock).toEqual([
      {
        type: 'only-in-oas',
        endpoint: {
          method: 'get',
          servers: [
            { schemes: ['http'], basePath: [], host: 'localhost:20443' },
          ],
          pathParts: [
            { type: 'literal', value: 'v2' },
            { type: 'literal', value: 'burn_ops' },
            { type: 'parameter', name: 'burn_height' },
            { type: 'parameter', name: 'op_type' },
          ],
          queryParameters: [],
        },
      },
      {
        type: 'only-in-oas',
        endpoint: {
          method: 'post',
          servers: [
            { schemes: ['http'], basePath: [], host: 'localhost:20443' },
          ],
          pathParts: [
            { type: 'literal', value: 'v2' },
            { type: 'literal', value: 'fees' },
            { type: 'literal', value: 'transaction' },
          ],
          queryParameters: [],
        },
      },
      {
        type: 'only-in-oas',
        endpoint: {
          method: 'get',
          servers: [
            { schemes: ['http'], basePath: [], host: 'localhost:20443' },
          ],
          pathParts: [
            { type: 'literal', value: 'v2' },
            { type: 'literal', value: 'info' },
          ],
          queryParameters: [],
        },
      },
      {
        type: 'only-in-oas',
        endpoint: {
          method: 'get',
          servers: [
            { schemes: ['http'], basePath: [], host: 'localhost:20443' },
          ],
          pathParts: [
            { type: 'literal', value: 'v2' },
            { type: 'literal', value: 'stacker_set' },
            { type: 'parameter', name: 'cycle_number' },
          ],
          queryParameters: [],
        },
      },
      {
        type: 'only-in-doc',
        endpoint: {
          method: 'get',
          pathParts: [
            { type: 'literal', value: 'v2' },
            { type: 'literal', value: 'headers' },
            { type: 'parameter', name: 'Count' },
          ],
          queryParameters: [],
        },
      },
      {
        type: 'only-in-doc',
        endpoint: {
          method: 'get',
          pathParts: [
            { type: 'literal', value: 'v2' },
            { type: 'literal', value: 'data_var' },
            { type: 'parameter', name: 'Stacks Address' },
            { type: 'parameter', name: 'Contract Name' },
            { type: 'parameter', name: 'Var Name' },
          ],
          queryParameters: [],
        },
      },
      {
        type: 'match-with-inconsistenties',
        oasEndpoint: {
          method: 'get',
          servers: [
            { schemes: ['http'], basePath: [], host: 'localhost:20443' },
          ],
          pathParts: [
            { type: 'literal', value: 'v2' },
            { type: 'literal', value: 'contracts' },
            { type: 'literal', value: 'interface' },
            { type: 'parameter', name: 'contract_address' },
            { type: 'parameter', name: 'contract_name' },
          ],
          queryParameters: [],
        },
        docEndpoint: {
          method: 'get',
          pathParts: [
            { type: 'literal', value: 'v2' },
            { type: 'literal', value: 'contracts' },
            { type: 'literal', value: 'interface' },
            { type: 'parameter', name: 'Stacks Address' },
            { type: 'parameter', name: 'Contract Name' },
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
            { schemes: ['http'], basePath: [], host: 'localhost:20443' },
          ],
          pathParts: [
            { type: 'literal', value: 'v2' },
            { type: 'literal', value: 'map_entry' },
            { type: 'parameter', name: 'contract_address' },
            { type: 'parameter', name: 'contract_name' },
            { type: 'parameter', name: 'map_name' },
          ],
          queryParameters: [
            { name: 'proof', required: false },
            { name: 'tip', required: false },
          ],
        },
        docEndpoint: {
          method: 'post',
          pathParts: [
            { type: 'literal', value: 'v2' },
            { type: 'literal', value: 'map_entry' },
            { type: 'parameter', name: 'Stacks Address' },
            { type: 'parameter', name: 'Contract Name' },
            { type: 'parameter', name: 'Map Name' },
          ],
          queryParameters: [],
        },
        inconsistencies: [
          { type: 'parameter-name-mismatch', parameterIndex: 0 },
          { type: 'parameter-name-mismatch', parameterIndex: 1 },
          { type: 'parameter-name-mismatch', parameterIndex: 2 },
        ],
      },
      {
        type: 'match-with-inconsistenties',
        oasEndpoint: {
          method: 'get',
          servers: [
            { schemes: ['http'], basePath: [], host: 'localhost:20443' },
          ],
          pathParts: [
            { type: 'literal', value: 'v2' },
            { type: 'literal', value: 'contracts' },
            { type: 'literal', value: 'source' },
            { type: 'parameter', name: 'contract_address' },
            { type: 'parameter', name: 'contract_name' },
          ],
          queryParameters: [],
        },
        docEndpoint: {
          method: 'get',
          pathParts: [
            { type: 'literal', value: 'v2' },
            { type: 'literal', value: 'contracts' },
            { type: 'literal', value: 'source' },
            { type: 'parameter', name: 'Stacks Address' },
            { type: 'parameter', name: 'Contract Name' },
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
            { schemes: ['http'], basePath: [], host: 'localhost:20443' },
          ],
          pathParts: [
            { type: 'literal', value: 'v2' },
            { type: 'literal', value: 'contracts' },
            { type: 'literal', value: 'call-read' },
            { type: 'parameter', name: 'contract_address' },
            { type: 'parameter', name: 'contract_name' },
            { type: 'parameter', name: 'function_name' },
          ],
          queryParameters: [{ name: 'tip', required: false }],
        },
        docEndpoint: {
          method: 'post',
          pathParts: [
            { type: 'literal', value: 'v2' },
            { type: 'literal', value: 'contracts' },
            { type: 'literal', value: 'call-read' },
            { type: 'parameter', name: 'Stacks Address' },
            { type: 'parameter', name: 'Contract Name' },
            { type: 'parameter', name: 'Function Name' },
          ],
          queryParameters: [],
        },
        inconsistencies: [
          { type: 'parameter-name-mismatch', parameterIndex: 0 },
          { type: 'parameter-name-mismatch', parameterIndex: 1 },
          { type: 'parameter-name-mismatch', parameterIndex: 2 },
        ],
      },
      {
        type: 'match-with-inconsistenties',
        oasEndpoint: {
          method: 'get',
          servers: [
            { schemes: ['http'], basePath: [], host: 'localhost:20443' },
          ],
          pathParts: [
            { type: 'literal', value: 'v2' },
            { type: 'literal', value: 'accounts' },
            { type: 'parameter', name: 'principal' },
          ],
          queryParameters: [
            { name: 'proof', required: false },
            { name: 'tip', required: false },
          ],
        },
        docEndpoint: {
          method: 'get',
          pathParts: [
            { type: 'literal', value: 'v2' },
            { type: 'literal', value: 'accounts' },
            { type: 'parameter', name: 'Principal' },
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
            { schemes: ['http'], basePath: [], host: 'localhost:20443' },
          ],
          pathParts: [
            { type: 'literal', value: 'v2' },
            { type: 'literal', value: 'traits' },
            { type: 'parameter', name: 'contract_address' },
            { type: 'parameter', name: 'contract_name' },
            { type: 'parameter', name: 'trait_contract_address' },
            { type: 'parameter', name: 'trait_contract_name' },
            { type: 'parameter', name: 'trait_name' },
          ],
          queryParameters: [],
        },
        docEndpoint: {
          method: 'get',
          pathParts: [
            { type: 'literal', value: 'v2' },
            { type: 'literal', value: 'traits' },
            { type: 'parameter', name: 'Stacks Address' },
            { type: 'parameter', name: 'Contract Name' },
            { type: 'parameter', name: 'Trait Stacks Address' },
            { type: 'parameter', name: 'Trait Contract Name' },
            { type: 'parameter', name: 'Trait Name' },
          ],
          queryParameters: [],
        },
        inconsistencies: [
          { type: 'parameter-name-mismatch', parameterIndex: 0 },
          { type: 'parameter-name-mismatch', parameterIndex: 1 },
          { type: 'parameter-name-mismatch', parameterIndex: 2 },
          { type: 'parameter-name-mismatch', parameterIndex: 3 },
          { type: 'parameter-name-mismatch', parameterIndex: 4 },
        ],
      },
      {
        type: 'match-with-inconsistenties',
        oasEndpoint: {
          method: 'post',
          servers: [
            { schemes: ['http'], basePath: [], host: 'localhost:20443' },
          ],
          pathParts: [
            { type: 'literal', value: 'v2' },
            { type: 'literal', value: 'constant_val' },
            { type: 'parameter', name: 'contract_address' },
            { type: 'parameter', name: 'contract_name' },
            { type: 'parameter', name: 'constant_name' },
          ],
          queryParameters: [{ name: 'tip', required: false }],
        },
        docEndpoint: {
          method: 'get',
          pathParts: [
            { type: 'literal', value: 'v2' },
            { type: 'literal', value: 'constant_val' },
            { type: 'parameter', name: 'Stacks Address' },
            { type: 'parameter', name: 'Contract Name' },
            { type: 'parameter', name: 'Constant Name' },
          ],
          queryParameters: [],
        },
        inconsistencies: [
          { type: 'method-mismatch' },
          { type: 'parameter-name-mismatch', parameterIndex: 0 },
          { type: 'parameter-name-mismatch', parameterIndex: 1 },
          { type: 'parameter-name-mismatch', parameterIndex: 2 },
        ],
      },
      {
        type: 'match-with-inconsistenties',
        oasEndpoint: {
          method: 'get',
          servers: [
            { schemes: ['http'], basePath: [], host: 'localhost:20443' },
          ],
          pathParts: [
            { type: 'literal', value: 'v3' },
            { type: 'literal', value: 'blocks' },
            { type: 'parameter', name: 'block_id' },
          ],
          queryParameters: [],
        },
        docEndpoint: {
          method: 'get',
          pathParts: [
            { type: 'literal', value: 'v3' },
            { type: 'literal', value: 'blocks' },
            { type: 'parameter', name: 'Block ID' },
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
            { schemes: ['http'], basePath: [], host: 'localhost:20443' },
          ],
          pathParts: [
            { type: 'literal', value: 'v3' },
            { type: 'literal', value: 'tenures' },
            { type: 'parameter', name: 'block_id' },
          ],
          queryParameters: [],
        },
        docEndpoint: {
          method: 'get',
          pathParts: [
            { type: 'literal', value: 'v3' },
            { type: 'literal', value: 'tenures' },
            { type: 'parameter', name: 'Block ID' },
          ],
          queryParameters: [],
        },
        inconsistencies: [
          { type: 'parameter-name-mismatch', parameterIndex: 0 },
        ],
      },
    ]);
  });
});
