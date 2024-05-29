import * as core from '@actions/core';
import { beforeEach, describe, expect, it, spyOn } from 'bun:test';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import seedrandom from 'seedrandom';
import { docParse, docStringify } from '../../parsing/markdown';
import { RepoInfo, getOrDownload } from '../utils';
import {
  DocMutationsOptions,
  evaluateDocMutations,
} from '../utils/mutation/doc';

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

  it('handles identity doc mutation', async () => {
    const repoName = 'gothinkster/realworld';
    const sha = '11c81f64f04fff8cfcd60ddf4eb0064c01fa1730';
    const pathDoc = 'apps/documentation/docs/specs/backend-specs/endpoints.md';

    const githubBase = `https://github.com/${repoName}/blob/${sha}`;
    const pathDocGithub = `${githubBase}/${pathDoc}`;

    const baseDirPath = join(
      import.meta.dir,
      `../data/mutation/doc/${repoName.replace('/', '__')}`,
    );

    const pathDocLocal = await getOrDownload(pathDocGithub, baseDirPath);
    const dirPath = join(baseDirPath, 'doc');
    await mkdir(dirPath, { recursive: true });

    const tree = await docParse(pathDocLocal);
    const mutatedTree = tree;
    const mutatedDocPath = join(dirPath, 'doc.md');
    await writeFile(mutatedDocPath, docStringify(mutatedTree));

    const mutatedTreeParsed = await docParse(mutatedDocPath);
    expect(mutatedTreeParsed).toEqual(tree);
  });

  it(
    'handles doc mutations',
    async () => {
      const mutationInfos: (
        | [RepoInfo]
        | [RepoInfo, Partial<DocMutationsOptions>]
      )[] = [
        [
          {
            repoName: 'gothinkster/realworld',
            sha: '11c81f64f04fff8cfcd60ddf4eb0064c01fa1730',
            pathOas: 'api/openapi.yml',
            pathDoc: 'apps/documentation/docs/specs/backend-specs/endpoints.md',
          },
        ],
        [
          {
            repoName: 'fleetdm/fleet',
            sha: '2dd7b6e5644fc8fea045b0ea37f51225b801f105',
            pathOas: 'server/mdm/nanodep/docs/openapi.yaml',
            pathDoc: 'server/mdm/nanodep/docs/operations-guide.md',
          },
        ],
        [
          {
            repoName: 'omarciovsena/abibliadigital',
            sha: 'fc31798a790c1c36d072d2e422dba82fa1a74bcd',
            pathOas: 'docs/openapi.yaml',
            pathDoc: 'DOCUMENTATION.md',
          },
        ],
        [
          {
            repoName: 'alextselegidis/easyappointments',
            sha: '06fddd49f4f6a98a4a90307c1812dd06caa6551b',
            pathOas: 'swagger.yml',
            pathDoc: 'docs/rest-api.md',
          },
        ],
        [
          {
            repoName: 'sunflower-land/sunflower-land',
            sha: '877234bda1c498505a9be75b83affb487285af5c',
            pathOas: 'docs/openapi.json',
            pathDoc: 'docs/OFFCHAIN_API.md',
          },
          {
            multiInstanceEndpoints: [
              {
                method: 'get',
                path: '/community/farms',
                instancesPos: [22, 56],
              },
            ],
          },
        ],
      ] as const;

      for (const [repoInfo, overrideOptions] of mutationInfos) {
        await evaluateDocMutations(
          repoInfo,
          {
            getInputMock,
            setFailedMock,
            rng: () => rng.quick(),
          },
          {
            ...{
              scenarios: 100,
            },
            ...overrideOptions,
          },
        );
      }
    },
    { timeout: 120_000 },
  );
});
