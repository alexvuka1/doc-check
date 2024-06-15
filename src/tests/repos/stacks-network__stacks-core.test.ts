import * as core from '@actions/core';
import { beforeEach, describe, it, spyOn } from 'bun:test';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import * as main from '../../main';
import { expectFail, getOrDownload, setupInputRepo } from '../utils';
import assert from 'assert';

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
    const sha = 'b7f7295775ba8571ed322846367451fc6bf44126';
    await setupInputRepo(getInputMock, {
      repoName,
      sha,
      pathOas: 'docs/rpc/openapi.yaml',
      pathDoc: 'docs/rpc-endpoints.md',
    });

    const apiDirs = ['contract', 'core-node', 'trait', 'transaction'] as const;
    const [contractDir, coreNodeDir, traitDir, transactionDir] =
      await Promise.all(
        apiDirs.map(async apiDir => {
          const apiDirPath = join(
            import.meta.dir,
            '..',
            `data/repos/${repoName.replace('/', '__')}/${sha}/api/${apiDir}`,
          );
          await mkdir(apiDirPath, { recursive: true });
          return apiDirPath;
        }),
      );
    assert(
      contractDir !== void 0 &&
        coreNodeDir !== void 0 &&
        traitDir !== void 0 &&
        transactionDir !== void 0,
    );

    const entitiesContractsDir = join(
      import.meta.dir,
      '..',
      `data/repos/${repoName.replace('/', '__')}/${sha}/entities/contracts`,
    );
    await mkdir(entitiesContractsDir, { recursive: true });

    const dirToFile = [
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
    ] as const;

    await Promise.all([
      ...dirToFile.map(([dir, filePath]) =>
        getOrDownload(
          `https://github.com/${repoName}/blob/${sha}/docs/rpc/api/${filePath}`,
          dir,
        ),
      ),
      getOrDownload(
        `https://github.com/${repoName}/blob/${sha}/docs/rpc/entities/contracts/read-only-function-args.schema.json`,
        entitiesContractsDir,
      ),
    ]);

    await main.run();

    expectFail(setFailedMock).toEqual([
      {
        type: 'only-in-oas',
        requestConfig: {
          method: 'get',
          servers: [{ scheme: 'http', basePath: [], host: 'localhost:20443' }],
          pathSegs: [
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
        requestConfig: {
          method: 'post',
          servers: [{ scheme: 'http', basePath: [], host: 'localhost:20443' }],
          pathSegs: [
            { type: 'literal', value: 'v2' },
            { type: 'literal', value: 'fees' },
            { type: 'literal', value: 'transaction' },
          ],
          queryParameters: [],
        },
      },
      {
        type: 'only-in-oas',
        requestConfig: {
          method: 'get',
          servers: [{ scheme: 'http', basePath: [], host: 'localhost:20443' }],
          pathSegs: [
            { type: 'literal', value: 'v2' },
            { type: 'literal', value: 'info' },
          ],
          queryParameters: [],
        },
      },
      {
        type: 'only-in-oas',
        requestConfig: {
          method: 'get',
          servers: [{ scheme: 'http', basePath: [], host: 'localhost:20443' }],
          pathSegs: [
            { type: 'literal', value: 'v2' },
            { type: 'literal', value: 'stacker_set' },
            { type: 'parameter', name: 'cycle_number' },
          ],
          queryParameters: [],
        },
      },
      {
        type: 'only-in-doc',
        requestConfig: {
          originalPath: '/v2/headers/[Count]',
          method: 'get',
          pathSegs: [
            { type: 'literal', value: 'v2' },
            { type: 'literal', value: 'headers' },
            { type: 'parameter', name: 'Count' },
          ],
          queryParameters: [],
          line: 84,
        },
      },
      {
        type: 'only-in-doc',
        requestConfig: {
          originalPath:
            '/v2/data_var/[Stacks Address]/[Contract Name]/[Var Name]',
          method: 'get',
          pathSegs: [
            { type: 'literal', value: 'v2' },
            { type: 'literal', value: 'data_var' },
            { type: 'parameter', name: 'Stacks Address' },
            { type: 'parameter', name: 'Contract Name' },
            { type: 'parameter', name: 'Var Name' },
          ],
          queryParameters: [],
          line: 156,
        },
      },
      {
        type: 'match-with-conflicts',
        oasRequestConfig: {
          method: 'get',
          servers: [{ scheme: 'http', basePath: [], host: 'localhost:20443' }],
          pathSegs: [
            { type: 'literal', value: 'v2' },
            { type: 'literal', value: 'contracts' },
            { type: 'literal', value: 'interface' },
            { type: 'parameter', name: 'contract_address' },
            { type: 'parameter', name: 'contract_name' },
          ],
          queryParameters: [],
        },
        docRequestConfig: {
          originalPath:
            '/v2/contracts/interface/[Stacks Address]/[Contract Name]',
          method: 'get',
          pathSegs: [
            { type: 'literal', value: 'v2' },
            { type: 'literal', value: 'contracts' },
            { type: 'literal', value: 'interface' },
            { type: 'parameter', name: 'Stacks Address' },
            { type: 'parameter', name: 'Contract Name' },
          ],
          queryParameters: [],
          line: 217,
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
          servers: [{ scheme: 'http', basePath: [], host: 'localhost:20443' }],
          pathSegs: [
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
        docRequestConfig: {
          originalPath:
            '/v2/map_entry/[Stacks Address]/[Contract Name]/[Map Name]',
          method: 'post',
          pathSegs: [
            { type: 'literal', value: 'v2' },
            { type: 'literal', value: 'map_entry' },
            { type: 'parameter', name: 'Stacks Address' },
            { type: 'parameter', name: 'Contract Name' },
            { type: 'parameter', name: 'Map Name' },
          ],
          queryParameters: [],
          line: 189,
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
          servers: [{ scheme: 'http', basePath: [], host: 'localhost:20443' }],
          pathSegs: [
            { type: 'literal', value: 'v2' },
            { type: 'literal', value: 'contracts' },
            { type: 'literal', value: 'source' },
            { type: 'parameter', name: 'contract_address' },
            { type: 'parameter', name: 'contract_name' },
          ],
          queryParameters: [],
        },
        docRequestConfig: {
          originalPath: '/v2/contracts/source/[Stacks Address]/[Contract Name]',
          method: 'get',
          pathSegs: [
            { type: 'literal', value: 'v2' },
            { type: 'literal', value: 'contracts' },
            { type: 'literal', value: 'source' },
            { type: 'parameter', name: 'Stacks Address' },
            { type: 'parameter', name: 'Contract Name' },
          ],
          queryParameters: [],
          line: 368,
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
          servers: [{ scheme: 'http', basePath: [], host: 'localhost:20443' }],
          pathSegs: [
            { type: 'literal', value: 'v2' },
            { type: 'literal', value: 'contracts' },
            { type: 'literal', value: 'call-read' },
            { type: 'parameter', name: 'contract_address' },
            { type: 'parameter', name: 'contract_name' },
            { type: 'parameter', name: 'function_name' },
          ],
          queryParameters: [{ name: 'tip', required: false }],
        },
        docRequestConfig: {
          originalPath:
            '/v2/contracts/call-read/[Stacks Address]/[Contract Name]/[Function Name]',
          method: 'post',
          pathSegs: [
            { type: 'literal', value: 'v2' },
            { type: 'literal', value: 'contracts' },
            { type: 'literal', value: 'call-read' },
            { type: 'parameter', name: 'Stacks Address' },
            { type: 'parameter', name: 'Contract Name' },
            { type: 'parameter', name: 'Function Name' },
          ],
          queryParameters: [],
          line: 385,
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
          servers: [{ scheme: 'http', basePath: [], host: 'localhost:20443' }],
          pathSegs: [
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
        docRequestConfig: {
          originalPath:
            '/v2/traits/[Stacks Address]/[Contract Name]/[Trait Stacks Address]/[Trait Contract Name]/[Trait Name]',
          method: 'get',
          pathSegs: [
            { type: 'literal', value: 'v2' },
            { type: 'literal', value: 'traits' },
            { type: 'parameter', name: 'Stacks Address' },
            { type: 'parameter', name: 'Contract Name' },
            { type: 'parameter', name: 'Trait Stacks Address' },
            { type: 'parameter', name: 'Trait Contract Name' },
            { type: 'parameter', name: 'Trait Name' },
          ],
          queryParameters: [],
          line: 424,
        },
        conflicts: [
          {
            type: 'path-parameter-name-mismatch',
            parameterIndex: 0,
            oasServerIndex: null,
          },
          {
            type: 'path-parameter-name-mismatch',
            parameterIndex: 2,
            oasServerIndex: null,
          },
        ],
      },
      {
        type: 'match-with-conflicts',
        oasRequestConfig: {
          method: 'post',
          servers: [{ scheme: 'http', basePath: [], host: 'localhost:20443' }],
          pathSegs: [
            { type: 'literal', value: 'v2' },
            { type: 'literal', value: 'constant_val' },
            { type: 'parameter', name: 'contract_address' },
            { type: 'parameter', name: 'contract_name' },
            { type: 'parameter', name: 'constant_name' },
          ],
          queryParameters: [{ name: 'tip', required: false }],
        },
        docRequestConfig: {
          originalPath:
            '/v2/constant_val/[Stacks Address]/[Contract Name]/[Constant Name]',
          method: 'get',
          pathSegs: [
            { type: 'literal', value: 'v2' },
            { type: 'literal', value: 'constant_val' },
            { type: 'parameter', name: 'Stacks Address' },
            { type: 'parameter', name: 'Contract Name' },
            { type: 'parameter', name: 'Constant Name' },
          ],
          queryParameters: [],
          line: 175,
        },
        conflicts: [
          { type: 'method-mismatch' },
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
