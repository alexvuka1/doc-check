import assert from 'assert';
import { mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { remove } from 'unist-util-remove';
import { selectAll } from 'unist-util-select';
import { MutationTestEnv } from '.';
import { RepoInfo, getOrDownload } from '..';
import * as main from '../../../main';
import { FailOutput, methods } from '../../../parsing';
import { docParse, docStringify } from '../../../parsing/markdown';
import { oasParse, oasPathPartsToPath } from '../../../parsing/openapi';
import { objectEntries, shuffle } from '../../../utils';

type DocMutationsOptions = {
  scenarios: number;
};

export const evaluateDocMutations = async (
  repoInfo: RepoInfo,
  testEnv: MutationTestEnv,
  options: DocMutationsOptions,
) => {
  const { repoName, sha, pathOas, pathDoc } = repoInfo;
  const { scenarios } = options;
  const { getInputMock, setFailedMock, rng } = testEnv;

  const githubBase = `https://github.com/${repoName}/blob/${sha}`;
  const pathOasGithub = `${githubBase}/${pathOas}`;
  const pathDocGithub = `${githubBase}/${pathDoc}`;

  const baseDirPath = join(
    import.meta.dir,
    `../../data/mutation/doc/${repoName.replace('/', '__')}`,
  );

  const [pathOasLocal, pathDocLocal] = await Promise.all([
    getOrDownload(pathOasGithub, baseDirPath),
    getOrDownload(pathDocGithub, baseDirPath),
  ]);

  let correctCount = 0;

  for (let i = 1; i <= scenarios; i++) {
    const tree = await docParse(pathDocLocal);
    const nParts = 2 + Math.round(rng() * 3);
    const sections = selectAll('section', tree);
    const parts = shuffle(sections, rng).slice(0, nParts - 1);
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
    `Got ${correctCount}/${scenarios} correct (${Math.floor((correctCount / scenarios) * 100)}%) on ${repoName}`,
  );
};
