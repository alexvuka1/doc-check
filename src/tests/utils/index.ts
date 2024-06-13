import type { getInput, setFailed } from '@actions/core';
import { write } from 'bun';
import type { Mock } from 'bun:test';
import { expect } from 'bun:test';
import { existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { FailOutput } from '../../parsing';

export type GetInputMock = Mock<typeof getInput>;
export type SetFailedMock = Mock<typeof setFailed>;

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

export type RepoInfo = {
  repoName: string;
  sha: string;
  pathDoc: string;
  pathOas: string;
};

export const setupInputRepo = async (
  getInputMock: GetInputMock,
  repoInfo: RepoInfo,
) => {
  const { repoName, pathDoc, pathOas, sha } = repoInfo;
  const githubBase = `https://github.com/${repoName}/blob/${sha}`;
  const pathOasGithub = `${githubBase}/${pathOas}`;
  const pathDocGithub = `${githubBase}/${pathDoc}`;

  const dirPath = join(
    import.meta.dir,
    '..',
    `data/repos/${repoName.replace('/', '__')}/${sha}`,
  );

  const [pathOasLocal, pathDocLocal] = await Promise.all([
    getOrDownload(pathOasGithub, dirPath),
    getOrDownload(pathDocGithub, dirPath),
  ]);

  getInputMock.mockImplementation((name: string): string => {
    switch (name) {
      case 'openapi-path':
        return pathOasLocal;
      case 'doc-path':
        return pathDocLocal;
      default:
        return '';
    }
  });
};

export const getOrDownload = async (
  downloadUrl: string,
  saveDirPath: string,
) => {
  const fileName = downloadUrl.substring(downloadUrl.lastIndexOf('/') + 1);

  mkdirSync(saveDirPath, { recursive: true });

  const filePath = join(saveDirPath, fileName);
  if (existsSync(filePath)) return filePath;

  const res = await fetch(`${downloadUrl}?raw=true`);
  if (!res.ok) throw new Error('Bad request');
  await write(filePath, res);
  return filePath;
};

export const expectFail = (setFailedMock: SetFailedMock) => ({
  toEqual: (expectedFail: FailOutput) => {
    const fail = setFailedMock.mock.calls[0]?.[0];
    expect(fail).toBeString();
    let failOutput: FailOutput;
    try {
      failOutput = JSON.parse(fail as string);
    } catch (e) {
      throw fail;
    }
    expect(failOutput).toEqual(expectedFail);
  },
});
