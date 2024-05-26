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

  it('handles supabase/auth', async () => {
    await setupInputRepo(getInputMock, {
      repoName: 'supabase/auth',
      sha: 'b954a485096cddfd1eef4d582034a99eff95fa6f',
      pathOas: 'openapi.yaml',
      pathDoc: 'README.md',
    });

    await main.run();

    expectFail(setFailedMock).toEqual([
      {
        type: 'only-in-oas',
        endpoint: {
          method: 'post',
          servers: [
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathParts: [{ type: 'literal', value: 'resend' }],
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
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathParts: [{ type: 'literal', value: 'factors' }],
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
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'factors' },
            { type: 'parameter', name: 'factorId' },
            { type: 'literal', value: 'challenge' },
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
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'factors' },
            { type: 'parameter', name: 'factorId' },
            { type: 'literal', value: 'verify' },
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
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'factors' },
            { type: 'parameter', name: 'factorId' },
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
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathParts: [{ type: 'literal', value: 'callback' }],
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
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathParts: [{ type: 'literal', value: 'sso' }],
          queryParameters: [],
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
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'saml' },
            { type: 'literal', value: 'metadata' },
          ],
          queryParameters: [{ name: 'download', required: false }],
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
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'saml' },
            { type: 'literal', value: 'acs' },
          ],
          queryParameters: [
            { name: 'RelayState', required: false },
            { name: 'SAMLArt', required: false },
            { name: 'SAMLResponse', required: false },
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
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathParts: [{ type: 'literal', value: 'generate_link' }],
          queryParameters: [],
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
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'admin' },
            { type: 'literal', value: 'audit' },
          ],
          queryParameters: [
            { name: 'page', required: false },
            { name: 'per_page', required: false },
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
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'admin' },
            { type: 'literal', value: 'users' },
          ],
          queryParameters: [
            { name: 'page', required: false },
            { name: 'per_page', required: false },
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
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'admin' },
            { type: 'literal', value: 'users' },
            { type: 'parameter', name: 'userId' },
            { type: 'literal', value: 'factors' },
          ],
          queryParameters: [],
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
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'admin' },
            { type: 'literal', value: 'users' },
            { type: 'parameter', name: 'userId' },
            { type: 'literal', value: 'factors' },
            { type: 'parameter', name: 'factorId' },
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
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'admin' },
            { type: 'literal', value: 'users' },
            { type: 'parameter', name: 'userId' },
            { type: 'literal', value: 'factors' },
            { type: 'parameter', name: 'factorId' },
          ],
          queryParameters: [],
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
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'admin' },
            { type: 'literal', value: 'sso' },
            { type: 'literal', value: 'providers' },
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
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'admin' },
            { type: 'literal', value: 'sso' },
            { type: 'literal', value: 'providers' },
          ],
          queryParameters: [],
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
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'admin' },
            { type: 'literal', value: 'sso' },
            { type: 'literal', value: 'providers' },
            { type: 'parameter', name: 'ssoProviderId' },
          ],
          queryParameters: [],
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
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'admin' },
            { type: 'literal', value: 'sso' },
            { type: 'literal', value: 'providers' },
            { type: 'parameter', name: 'ssoProviderId' },
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
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'admin' },
            { type: 'literal', value: 'sso' },
            { type: 'literal', value: 'providers' },
            { type: 'parameter', name: 'ssoProviderId' },
          ],
          queryParameters: [],
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
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathParts: [{ type: 'literal', value: 'health' }],
          queryParameters: [],
        },
      },
      {
        type: 'only-in-doc',
        endpoint: {
          originalPath: '/admin/generate_link',
          method: 'post',
          pathParts: [
            { type: 'literal', value: 'admin' },
            { type: 'literal', value: 'generate_link' },
          ],
          queryParameters: [],
          line: 783,
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
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'admin' },
            { type: 'literal', value: 'users' },
            { type: 'parameter', name: 'userId' },
          ],
          queryParameters: [],
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
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'admin' },
            { type: 'literal', value: 'users' },
            { type: 'parameter', name: 'userId' },
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
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathParts: [
            { type: 'literal', value: 'admin' },
            { type: 'literal', value: 'users' },
            { type: 'parameter', name: 'userId' },
          ],
          queryParameters: [],
        },
      },
      {
        type: 'only-in-doc',
        endpoint: {
          originalPath: '/admin/users/<user_id>',
          method: 'post',
          pathParts: [
            { type: 'literal', value: 'admin' },
            { type: 'literal', value: 'users' },
            { type: 'parameter', name: 'user_id' },
          ],
          queryParameters: [],
          line: 759,
        },
      },
      {
        type: 'match-with-inconsistenties',
        oasEndpoint: {
          method: 'post',
          servers: [
            {
              schemes: ['https'],
              basePath: [
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathParts: [{ type: 'literal', value: 'reauthenticate' }],
          queryParameters: [],
        },
        docEndpoint: {
          originalPath: '/reauthenticate',
          method: 'get',
          pathParts: [{ type: 'literal', value: 'reauthenticate' }],
          queryParameters: [],
          line: 1163,
        },
        inconsistencies: [{ type: 'method-mismatch' }],
      },
    ]);
  });
});
