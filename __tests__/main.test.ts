/**
 * Unit tests for the action's main functionality, src/main.ts
 */

import * as core from '@actions/core';
import { write } from 'bun';
import { describe, expect, it, spyOn } from 'bun:test';
import { existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import * as main from '../src/main';
import type { DocCheckErrors } from '../src/parsing';

// Mock the GitHub Actions core library
const getInputMock = spyOn(core, 'getInput');
const setFailedMock = spyOn(core, 'setFailed');

describe('action', () => {
  it('handles basic success', async () => {
    setupInput('./data/custom/basic');

    await main.run();

    expect(setFailedMock).not.toHaveBeenCalled();
  });

  it('handles basic fail', async () => {
    setupInput('./data/custom/basic-fail');

    await main.run();

    const fail: DocCheckErrors = {
      notDocumented: [{ method: 'get', pathParts: [], servers: [] }],
      outdated: [],
    };
    expect(setFailedMock).toHaveBeenCalledWith(JSON.stringify(fail));
  });

  it('handles random fail', async () => {
    setupInput('./data/repos/fail');

    await main.run();

    expect(setFailedMock).toHaveBeenCalled();
  });

  it('handles gothinkster/realworld', async () => {
    await setupInputRepo({
      repoName: 'gothinkster/realworld',
      urlOpenApi:
        'https://raw.githubusercontent.com/gothinkster/realworld/11c81f64f04fff8cfcd60ddf4eb0064c01fa1730/api/openapi.yml',
      urlDoc:
        'https://raw.githubusercontent.com/gothinkster/realworld/11c81f64f04fff8cfcd60ddf4eb0064c01fa1730/apps/documentation/docs/specs/backend-specs/endpoints.md',
    });

    await main.run();

    expect(setFailedMock).not.toHaveBeenCalled();
  });
});

const setupInput = (testDataDirPath: string) => {
  getInputMock.mockImplementation((name: string): string => {
    switch (name) {
      case 'openapi-path':
        return resolve(import.meta.dir, `${testDataDirPath}/openapi.json`);
      case 'doc-path':
        return resolve(import.meta.dir, `${testDataDirPath}/api.md`);
      default:
        return '';
    }
  });
};

type RepoInfo = {
  repoName: string;
  urlDoc: string;
  urlOpenApi: string;
};

const setupInputRepo = async (repoInfo: RepoInfo) => {
  const { repoName, urlDoc, urlOpenApi } = repoInfo;
  const [pathOpenApi, docPath] = await Promise.all([
    getOrDownload(repoName, urlOpenApi),
    getOrDownload(repoName, urlDoc),
  ]);
  getInputMock.mockImplementation((name: string): string => {
    switch (name) {
      case 'openapi-path':
        return pathOpenApi;
      case 'doc-path':
        return docPath;
      default:
        return '';
    }
  });
};

const getOrDownload = async (repoName: string, downloadUrl: string) => {
  const fileName = downloadUrl.substring(downloadUrl.lastIndexOf('/') + 1);

  const dirPath = resolve(
    import.meta.dir,
    `./data/repos/${repoName.replace('/', '__')}`,
  );
  if (!existsSync(dirPath)) mkdirSync(dirPath);

  const filePath = resolve(dirPath, fileName);
  if (existsSync(filePath)) return filePath;

  const res = await fetch(downloadUrl);
  if (!res.ok) throw new Error('Bad request');
  await write(filePath, res);
  return filePath;
};
