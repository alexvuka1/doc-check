import * as core from '@actions/core';
import { beforeEach, describe, expect, it, spyOn } from 'bun:test';
import { mkdir, writeFile } from 'fs/promises';
import { atomizeChangeset, diff } from 'json-diff-ts';
import { join } from 'path';
import seedrandom from 'seedrandom';
import { visit } from 'unist-util-visit';
import { docParse, docStringify } from '../../parsing/markdown';
import { objectEntries } from '../../utils';
import { repoInfos } from '../data/repoInfos';
import { getOrDownload } from '../utils';
import {
  DocSplitMutationsOptions,
  evaluateDocSplitMutations,
  evaluateDocSubtleMutations,
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
          } satisfies Partial<DocSplitMutationsOptions>,
        ] as const;
      case 'backstage/backstage_2':
        return [
          repoInfo,
          {
            multiInstanceRequestConfigs: [
              {
                method: 'get',
                path: '/entities',
                instancesPos: [213, 448],
              },
              {
                method: 'get',
                path: '/entities/by-query',
                instancesPos: [40, 217],
              },
            ],
          } satisfies Partial<DocSplitMutationsOptions>,
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
          } satisfies Partial<DocSplitMutationsOptions>,
        ] as const;
      default:
        return [repoInfo] as const;
    }
  });

  it('handles identity doc mutation', async () => {
    for (const [repoInfo] of mutationInfos) {
      const { repoName, sha, pathDoc } = repoInfo;

      const githubBase = `https://github.com/${repoName}/blob/${sha}`;
      const pathDocGithub = `${githubBase}/${pathDoc}`;

      const baseDirPath = join(
        import.meta.dir,
        `../data/mutation/doc/${repoName.replace('/', '__')}/${sha}/identity`,
      );

      const pathDocLocal = await getOrDownload(pathDocGithub, baseDirPath);
      const dirPath = join(baseDirPath, 'doc');
      await mkdir(dirPath, { recursive: true });

      const tree = await docParse(pathDocLocal);
      const mutatedTree = tree;
      const mutatedDocPath = join(dirPath, 'doc.md');
      await writeFile(mutatedDocPath, docStringify(mutatedTree));

      const mutatedTreeParsed = await docParse(mutatedDocPath);
      visit(mutatedTreeParsed, node => {
        delete node.position;
      });
      visit(tree, node => {
        delete node.position;
      });

      const changes = atomizeChangeset(diff(tree, mutatedTreeParsed)).filter(
        c => c.type === 'UPDATE' && c.oldValue === '\\n' && c.value === ' ',
      );
      expect(changes).toBeEmpty();
    }
  });

  it(
    'handles doc section split mutations',
    async () => {
      for (const [repoInfo, overrideOptions] of mutationInfos) {
        if (repoInfo.repoName === 'alibaba/GraphScope') continue;
        rng = seedrandom(seed);
        await evaluateDocSplitMutations(
          repoInfo,
          {
            getInputMock,
            setFailedMock,
            rng: () => rng.quick(),
          },
          {
            ...{
              splitNode: 'section',
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
    'handles doc heading split mutations',
    async () => {
      for (const [repoInfo, overrideOptions] of mutationInfos) {
        if (repoInfo.repoName === 'alibaba/GraphScope') continue;
        rng = seedrandom(seed);
        await evaluateDocSplitMutations(
          repoInfo,
          {
            getInputMock,
            setFailedMock,
            rng: () => rng.quick(),
          },
          {
            ...{
              splitNode: 'heading',
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
    'handles doc heading subtle mutations',
    async () => {
      for (const [repoInfo, overrideOptions] of mutationInfos) {
        rng = seedrandom(seed);
        for (let i = 0; i < 11; i++) {
          const isMax = await evaluateDocSubtleMutations(
            repoInfo,
            {
              getInputMock,
              setFailedMock,
              rng: () => rng.quick(),
            },
            {
              ...{
                nToChange: i,
                subtleNode: 'heading',
                scenarios: 100,
              },
              ...overrideOptions,
            },
          );
          if (isMax) break;
        }
      }
    },
    { timeout: 10000 * 60 * 1000 },
  );
});
