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

  it('handles supabase/auth', async () => {
    await setupInputRepo(getInputMock, repoInfos['supabase/auth']);

    await main.run();

    expectFail(setFailedMock).toEqual([
      {
        type: 'only-in-oas',
        requestConfig: {
          method: 'post',
          servers: [
            {
              scheme: 'https',
              basePath: [
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathSegs: [{ type: 'literal', value: 'resend' }],
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
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathSegs: [{ type: 'literal', value: 'factors' }],
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
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathSegs: [
            { type: 'literal', value: 'factors' },
            { type: 'parameter', name: 'factorId' },
            { type: 'literal', value: 'challenge' },
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
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathSegs: [
            { type: 'literal', value: 'factors' },
            { type: 'parameter', name: 'factorId' },
            { type: 'literal', value: 'verify' },
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
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathSegs: [
            { type: 'literal', value: 'factors' },
            { type: 'parameter', name: 'factorId' },
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
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathSegs: [{ type: 'literal', value: 'callback' }],
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
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathSegs: [{ type: 'literal', value: 'sso' }],
          queryParameters: [],
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
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathSegs: [
            { type: 'literal', value: 'saml' },
            { type: 'literal', value: 'metadata' },
          ],
          queryParameters: [{ name: 'download', required: false }],
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
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathSegs: [
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
        requestConfig: {
          method: 'post',
          servers: [
            {
              scheme: 'https',
              basePath: [
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathSegs: [{ type: 'literal', value: 'generate_link' }],
          queryParameters: [],
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
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathSegs: [
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
        requestConfig: {
          method: 'get',
          servers: [
            {
              scheme: 'https',
              basePath: [
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathSegs: [
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
        requestConfig: {
          method: 'get',
          servers: [
            {
              scheme: 'https',
              basePath: [
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathSegs: [
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
        requestConfig: {
          method: 'put',
          servers: [
            {
              scheme: 'https',
              basePath: [
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathSegs: [
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
        requestConfig: {
          method: 'delete',
          servers: [
            {
              scheme: 'https',
              basePath: [
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathSegs: [
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
        requestConfig: {
          method: 'get',
          servers: [
            {
              scheme: 'https',
              basePath: [
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathSegs: [
            { type: 'literal', value: 'admin' },
            { type: 'literal', value: 'sso' },
            { type: 'literal', value: 'providers' },
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
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathSegs: [
            { type: 'literal', value: 'admin' },
            { type: 'literal', value: 'sso' },
            { type: 'literal', value: 'providers' },
          ],
          queryParameters: [],
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
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathSegs: [
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
        requestConfig: {
          method: 'put',
          servers: [
            {
              scheme: 'https',
              basePath: [
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathSegs: [
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
        requestConfig: {
          method: 'delete',
          servers: [
            {
              scheme: 'https',
              basePath: [
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathSegs: [
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
        requestConfig: {
          method: 'get',
          servers: [
            {
              scheme: 'https',
              basePath: [
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathSegs: [{ type: 'literal', value: 'health' }],
          queryParameters: [],
        },
      },
      {
        type: 'only-in-doc',
        requestConfig: {
          originalPath: '/admin/generate_link',
          method: 'post',
          pathSegs: [
            { type: 'literal', value: 'admin' },
            { type: 'literal', value: 'generate_link' },
          ],
          queryParameters: [],
          line: 783,
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
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathSegs: [
            { type: 'literal', value: 'admin' },
            { type: 'literal', value: 'users' },
            { type: 'parameter', name: 'userId' },
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
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathSegs: [
            { type: 'literal', value: 'admin' },
            { type: 'literal', value: 'users' },
            { type: 'parameter', name: 'userId' },
          ],
          queryParameters: [],
        },
      },
      {
        type: 'only-in-doc',
        requestConfig: {
          originalPath: '/admin/users/<user_id>',
          method: 'post',
          pathSegs: [
            { type: 'literal', value: 'admin' },
            { type: 'literal', value: 'users' },
            { type: 'parameter', name: 'user_id' },
          ],
          queryParameters: [],
          line: 759,
        },
      },
      {
        type: 'match-with-conflicts',
        oasRequestConfig: {
          method: 'post',
          servers: [
            {
              scheme: 'https',
              basePath: [
                { type: 'literal', value: 'auth' },
                { type: 'literal', value: 'v1' },
              ],
              host: '{project}.supabase.co',
            },
          ],
          pathSegs: [{ type: 'literal', value: 'reauthenticate' }],
          queryParameters: [],
        },
        docRequestConfig: {
          originalPath: '/reauthenticate',
          method: 'get',
          pathSegs: [{ type: 'literal', value: 'reauthenticate' }],
          queryParameters: [],
          line: 1163,
        },
        conflicts: [{ type: 'method-mismatch' }],
      },
    ]);
  });
});
