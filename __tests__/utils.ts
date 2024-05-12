import type { getInput, setFailed } from '@actions/core';
import { write } from 'bun';
import type { Mock } from 'bun:test';
import { expect } from 'bun:test';
import { existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import type { DocCheckErrors } from '../src/parsing';

type GetInputMock = Mock<typeof getInput>;
type SetFailedMock = Mock<typeof setFailed>;

export const setupInput = (
  getInputMock: GetInputMock,
  testDataDirPath: string,
) => {
  getInputMock.mockImplementation((name: string): string => {
    switch (name) {
      case 'openapi-path':
        return resolve(import.meta.dir, testDataDirPath, 'openapi.json');
      case 'doc-path':
        return resolve(import.meta.dir, testDataDirPath, 'api.md');
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

export const setupInputRepo = async (
  getInputMock: GetInputMock,
  repoInfo: RepoInfo,
) => {
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
    'data',
    'repos',
    repoName.replace('/', '__'),
  );
  if (!existsSync(dirPath)) mkdirSync(dirPath);

  const filePath = resolve(dirPath, fileName);
  if (existsSync(filePath)) return filePath;

  const res = await fetch(`${downloadUrl}?raw=true`);
  if (!res.ok) throw new Error('Bad request');
  await write(filePath, res);
  return filePath;
};

export const expectFail = (setFailedMock: SetFailedMock) => ({
  toEqual: (expectedFail: DocCheckErrors) => {
    const fail = setFailedMock.mock.calls[0][0];
    expect(fail).toBeString();
    expect(JSON.parse(fail as string)).toEqual(expectedFail);
  },
});
