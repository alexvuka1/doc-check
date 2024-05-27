import * as core from '@actions/core';
import assert from 'assert';
import { beforeEach, describe, expect, it, spyOn } from 'bun:test';
import { mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import seedrandom from 'seedrandom';
import { remove } from 'unist-util-remove';
import { selectAll } from 'unist-util-select';
import * as main from '../../main';
import { FailOutput, methods } from '../../parsing';
import { docParse, docStringify } from '../../parsing/markdown';
import { oasParse, oasPathPartsToPath } from '../../parsing/openapi';
import { objectEntries, shuffle } from '../../utils';
import { getOrDownload } from '../utils';

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

  const repoName = 'gothinkster/realworld';
  const sha = '11c81f64f04fff8cfcd60ddf4eb0064c01fa1730';
  const pathOas = 'api/openapi.yml';
  const pathDoc = 'apps/documentation/docs/specs/backend-specs/endpoints.md';

  const githubBase = `https://github.com/${repoName}/blob/${sha}`;
  const pathOasGithub = `${githubBase}/${pathOas}`;
  const pathDocGithub = `${githubBase}/${pathDoc}`;

  const baseDirPath = join(
    import.meta.dir,
    `../data/mutation/doc/${repoName.replace('/', '__')}`,
  );

  it('handles identity doc mutation', async () => {
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
      const [pathOasLocal, pathDocLocal] = await Promise.all([
        getOrDownload(pathOasGithub, baseDirPath),
        getOrDownload(pathDocGithub, baseDirPath),
      ]);

      let correctCount = 0;
      const scenarios = 100;

      for (let i = 1; i <= scenarios; i++) {
        const tree = await docParse(pathDocLocal);
        const nParts = 2 + Math.round(rng.quick() * 3);
        const sections = selectAll('section', tree);
        const parts = shuffle(sections, rng.quick).slice(0, nParts - 1);
        const partsSet = new Set(parts);

        const dirPath = join(baseDirPath, `iteration_${i}`);
        await mkdir(dirPath, { recursive: true });

        const accFailOutput: FailOutput = [];
        for (const [j, mutatedTree] of [tree, ...parts].entries()) {
          remove(mutatedTree, node => partsSet.has(node));

          const mutatedDocPath = join(dirPath, `doc_${j}.md`);
          await writeFile(
            mutatedDocPath,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            docStringify({ type: 'root', children: [mutatedTree as any] }),
          );

          getInputMock.mockImplementation((name: string): string => {
            switch (name) {
              case 'openapi-path':
                return pathOasLocal;
              case 'doc-path':
                return mutatedDocPath;
              default:
                return '';
            }
          });

          await main.run();

          if (setFailedMock.mock.calls.length === 0) continue;
          const failOutput: FailOutput = JSON.parse(
            setFailedMock.mock.calls[0][0] as string,
          );
          accFailOutput.push(...failOutput);

          getInputMock.mockReset();
          setFailedMock.mockReset();
        }

        const oasPathToNFails = new Map<string, number>();

        const oas = await oasParse(pathOasLocal);
        const { paths } = oas;
        assert(paths);
        for (const [path, pathItem] of objectEntries(paths)) {
          if (!pathItem) continue;
          for (const method of methods) {
            const operation = pathItem[method];
            if (!operation) continue;
            oasPathToNFails.set(`${method} ${path}`, 0);
          }
        }

        let hasUnexpectedFail = false;
        for (const fail of accFailOutput) {
          if (fail.type !== 'only-in-oas') {
            hasUnexpectedFail = true;
            break;
          }
          const key = `${fail.endpoint.method} ${oasPathPartsToPath(fail.endpoint.pathParts)}`;
          const nFails = oasPathToNFails.get(key);
          if (nFails === void 0) {
            hasUnexpectedFail = true;
            break;
          }
          oasPathToNFails.set(key, nFails + 1);
        }

        if (
          !hasUnexpectedFail &&
          [...oasPathToNFails.values()].every(n => n === nParts - 1)
        ) {
          correctCount++;
          await rm(dirPath, { recursive: true, force: true });
        }
      }
      console.info(
        `Got ${correctCount}/${scenarios} correct (${Math.floor((correctCount / scenarios) * 100)}%)`,
      );
    },
    { timeout: 120_000 },
  );
});
