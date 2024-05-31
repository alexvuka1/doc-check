import * as core from '@actions/core';
import SwaggerParser from '@apidevtools/swagger-parser';
import { beforeEach, describe, expect, it, spyOn } from 'bun:test';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import seedrandom from 'seedrandom';
import { oasParse } from '../../parsing/openapi';
import { repoInfos } from '../data/repoInfos';
import { getOrDownload } from '../utils';
import { evaluateOasMutations } from '../utils/mutation/oas';

const getInputMock = spyOn(core, 'getInput');
const setFailedMock = spyOn(core, 'setFailed');
const debugMock = spyOn(core, 'debug');

describe('action', () => {
  const seed = 'doc-check';
  let rng = seedrandom(seed);

  beforeEach(() => {
    getInputMock.mockReset();
    setFailedMock.mockReset();
    debugMock.mockReset();
    rng = seedrandom(seed);
  });

  it('handles identity oas mutation', async () => {
    const { repoName, sha, pathOas } = repoInfos['gothinkster/realworld'];

    const githubBase = `https://github.com/${repoName}/blob/${sha}`;
    const pathOasGithub = `${githubBase}/${pathOas}`;

    const baseDirPath = join(
      import.meta.dir,
      `../data/mutation/oas/${repoName.replace('/', '__')}`,
    );

    const pathOasLocal = await getOrDownload(pathOasGithub, baseDirPath);
    const dirPath = join(baseDirPath, 'oas');
    await mkdir(dirPath, { recursive: true });

    const oas = await oasParse(pathOasLocal);
    const mutatedOas = oas;
    const mutatedOasPath = join(dirPath, 'oas.json');
    await writeFile(mutatedOasPath, JSON.stringify(mutatedOas, null, 2));

    const mutatedOasParsed = await SwaggerParser.dereference(mutatedOasPath);
    expect(mutatedOasParsed).toEqual(oas);
  });

  it(
    'handles oas mutations',
    async () => {
      for (const repoInfo of Object.values(repoInfos)) {
        await evaluateOasMutations(
          repoInfo,
          {
            getInputMock,
            setFailedMock,
            rng: () => rng.quick(),
          },
          {
            scenarios: 100,
            probRemovePath: 0.1,
            probRemoveEndpoint: 0.2,
            maxAddPath: 3,
            probAddPath: 0.3,
            probAddPathMethod: 0.1,
            probChangeMethod: 0.1,
          },
        );
      }
    },
    { timeout: 2 * 60 * 1000 },
  );
});
