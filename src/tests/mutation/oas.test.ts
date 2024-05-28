import * as core from '@actions/core';
import SwaggerParser from '@apidevtools/swagger-parser';
import { beforeEach, describe, expect, it, spyOn } from 'bun:test';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import seedrandom from 'seedrandom';
import { oasParse } from '../../parsing/openapi';
import { RepoInfo, getOrDownload } from '../utils';
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
    const repoName = 'gothinkster/realworld';
    const sha = '11c81f64f04fff8cfcd60ddf4eb0064c01fa1730';
    const pathOas = 'api/openapi.yml';

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
      const repoInfos: RepoInfo[] = [
        {
          repoName: 'gothinkster/realworld',
          sha: '11c81f64f04fff8cfcd60ddf4eb0064c01fa1730',
          pathOas: 'api/openapi.yml',
          pathDoc: 'apps/documentation/docs/specs/backend-specs/endpoints.md',
        },
        {
          repoName: 'fleetdm/fleet',
          sha: '2dd7b6e5644fc8fea045b0ea37f51225b801f105',
          pathOas: 'server/mdm/nanodep/docs/openapi.yaml',
          pathDoc: 'server/mdm/nanodep/docs/operations-guide.md',
        },
        {
          repoName: 'omarciovsena/abibliadigital',
          sha: 'fc31798a790c1c36d072d2e422dba82fa1a74bcd',
          pathOas: 'docs/openapi.yaml',
          pathDoc: 'DOCUMENTATION.md',
        },
        {
          repoName: 'alextselegidis/easyappointments',
          sha: '06fddd49f4f6a98a4a90307c1812dd06caa6551b',
          pathOas: 'swagger.yml',
          pathDoc: 'docs/rest-api.md',
        },
        {
          repoName: 'sunflower-land/sunflower-land',
          sha: '877234bda1c498505a9be75b83affb487285af5c',
          pathOas: 'docs/openapi.json',
          pathDoc: 'docs/OFFCHAIN_API.md',
        },
      ];

      for (const repoInfo of repoInfos) {
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
    { timeout: 120_000 },
  );
});
