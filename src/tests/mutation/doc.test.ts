import * as core from '@actions/core';
import { beforeEach, describe, expect, it, spyOn } from 'bun:test';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import seedrandom from 'seedrandom';
import { docParse, docStringify } from '../../parsing/markdown';
import { objectEntries } from '../../utils';
import { repoInfos } from '../data/repoInfos';
import { getOrDownload } from '../utils';
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
    const { repoName, sha, pathDoc } = repoInfos['gothinkster/realworld'];

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

  const mutationInfos = objectEntries(repoInfos).map(([repoName, repoInfo]) => {
    switch (repoName) {
      case 'backstage/backstage':
        return [
          repoInfo,
          {
            multiInstanceRequestConfigs: [
              {
                method: 'get',
                path: '/entities',
                instancesPos: [213, 444],
              },
              {
                method: 'get',
                path: '/entities/by-query',
                instancesPos: [40, 217],
              },
            ],
          } satisfies Partial<DocMutationsOptions>,
        ] as const;
      case 'sunflower-land/sunflower-land':
        return [
          repoInfo,
          {
            multiInstanceRequestConfigs: [
              {
                method: 'get',
                path: '/community/farms',
                instancesPos: [22, 56],
              },
            ],
          } satisfies Partial<DocMutationsOptions>,
        ] as const;
      default:
        return [repoInfo] as const;
    }
  });

  it(
    'handles doc section mutations',
    async () => {
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
              splitType: 'section',
              scenarios: 100,
            },
            ...overrideOptions,
          },
        );
      }
    },
    { timeout: 10 * 60 * 1000 },
  );

  it(
    'handles doc heading mutations',
    async () => {
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
              splitType: 'heading',
              scenarios: 100,
            },
            ...overrideOptions,
          },
        );
      }
    },
    { timeout: 10 * 60 * 1000 },
  );
});
