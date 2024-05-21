import * as core from '@actions/core';
import SwaggerParser from '@apidevtools/swagger-parser';
import { beforeEach, describe, expect, it, spyOn } from 'bun:test';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import * as main from '../main';
import { docParse, docStringify } from '../parsing/markdown';
import { oasParse } from '../parsing/openapi';
import { getOrDownload } from './utils';

const getInputMock = spyOn(core, 'getInput');
const setFailedMock = spyOn(core, 'setFailed');
const debugMock = spyOn(core, 'debug');

describe('action', () => {
  beforeEach(() => {
    getInputMock.mockReset();
    setFailedMock.mockReset();
    debugMock.mockReset();
  });

  const repoName = 'gothinkster/realworld';
  const sha = '11c81f64f04fff8cfcd60ddf4eb0064c01fa1730';
  const pathOas = 'api/openapi.yml';
  const pathDoc = 'apps/documentation/docs/specs/backend-specs/endpoints.md';

  const githubBase = `https://github.com/${repoName}/blob/${sha}`;
  const pathOasGithub = `${githubBase}/${pathOas}`;
  const pathDocGithub = `${githubBase}/${pathDoc}`;

  const baseDirPath = join(
    import.meta.dir,
    'data',
    'mutation',
    repoName.replace('/', '__'),
  );

  it('handles identity oas mutation', async () => {
    const pathOasLocal = await getOrDownload(pathOasGithub, baseDirPath);
    const dirPath = join(baseDirPath, 'identityOas');
    await mkdir(dirPath, { recursive: true });

    const oas = await oasParse(pathOasLocal);
    const mutatedOas = oas;
    const mutatedOasPath = join(dirPath, 'oas.json');
    await writeFile(mutatedOasPath, JSON.stringify(mutatedOas, null, 2));

    const mutatedOasParsed = await SwaggerParser.dereference(mutatedOasPath);
    expect(mutatedOasParsed).toEqual(oas);
  });

  it('handles identity doc mutation', async () => {
    const pathDocLocal = await getOrDownload(pathDocGithub, baseDirPath);
    const dirPath = join(baseDirPath, 'identityDoc');
    await mkdir(dirPath, { recursive: true });

    const tree = await docParse(pathDocLocal);
    const mutatedTree = tree;
    const mutatedDocPath = join(dirPath, 'doc.md');
    await writeFile(mutatedDocPath, docStringify(mutatedTree));

    const mutatedTreeParsed = await docParse(mutatedDocPath);
    expect(mutatedTreeParsed).toEqual(tree);
  });

  it('handles mutated gothinkster/realworld', async () => {
    const [pathOasLocal, pathDocLocal] = await Promise.all([
      getOrDownload(pathOasGithub, baseDirPath),
      getOrDownload(pathDocGithub, baseDirPath),
    ]);
    const dirPath = join(baseDirPath, 'test1');
    await mkdir(dirPath, { recursive: true });

    const oas = await oasParse(pathOasLocal);
    const mutatedOas = oas;
    const mutatedOasPath = join(dirPath, 'oas.json');
    await writeFile(mutatedOasPath, JSON.stringify(mutatedOas, null, 2));

    const tree = await docParse(pathDocLocal);
    const mutatedTree = tree;
    const mutatedDocPath = join(dirPath, 'doc.md');
    await writeFile(mutatedDocPath, docStringify(mutatedTree));

    getInputMock.mockImplementation((name: string): string => {
      switch (name) {
        case 'openapi-path':
          return mutatedOasPath;
        case 'doc-path':
          return mutatedDocPath;
        default:
          return '';
      }
    });

    await main.run();

    expect(setFailedMock).not.toHaveBeenCalled();
  });
});
