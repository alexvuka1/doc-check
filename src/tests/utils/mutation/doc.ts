import assert from 'assert';
import { appendFile, mkdir, rm, writeFile } from 'fs/promises';
import { atomizeChangeset, diff } from 'json-diff-ts';
import { isEqual, sortBy } from 'lodash-es';
import { Heading, Node, Nodes } from 'mdast';
import { join } from 'path';
import { remove } from 'unist-util-remove';
import { selectAll } from 'unist-util-select';
import { MutationTestEnv } from '.';
import { RepoInfo, getOrDownload } from '..';
import * as main from '../../../main';
import { FailOutput, Method, methods } from '../../../parsing';
import { docParse, docStringify } from '../../../parsing/markdown';
import { oasParse, oasPathSegsToPath } from '../../../parsing/openapi';
import { objectEntries, shuffle } from '../../../utils';

export type DocSplitMutationsOptions = {
  scenarios: number;
  splitNode: Nodes['type'];
  multiInstanceRequestConfigs?: {
    method: Method;
    path: string;
    instancesPos: number[];
  }[];
};

export const evaluateDocSplitMutations = async (
  repoInfo: RepoInfo,
  testEnv: MutationTestEnv,
  options: DocSplitMutationsOptions,
) => {
  const { repoName, sha, pathOas, pathDoc } = repoInfo;
  const { scenarios, splitNode, multiInstanceRequestConfigs = [] } = options;
  const { getInputMock, setFailedMock, rng } = testEnv;

  const githubBase = `https://github.com/${repoName}/blob/${sha}`;
  const pathOasGithub = `${githubBase}/${pathOas}`;
  const pathDocGithub = `${githubBase}/${pathDoc}`;

  const baseDirPath = join(
    import.meta.dir,
    `../../data/mutation/doc/${repoName.replace('/', '__')}/${sha}/${splitNode}`,
  );

  const [pathOasLocal, pathDocLocal] = await Promise.all([
    getOrDownload(pathOasGithub, baseDirPath),
    getOrDownload(pathDocGithub, baseDirPath),
  ]);

  getInputMock.mockReset();
  setFailedMock.mockReset();

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

  await main.run();

  const nonMutatedFailOutput: FailOutput =
    setFailedMock.mock.calls.length === 0
      ? []
      : JSON.parse(setFailedMock.mock.calls[0]?.[0] as string);
  const nonMutatedOnlyInDoc = new Map<string, number>();
  const nonMutatedOnlyInOas = new Map<string, number>();
  const nonMutatedFailsWithIncs: (FailOutput[number] & {
    type: 'match-with-conflicts';
  })[] = [];
  for (const fail of nonMutatedFailOutput) {
    switch (fail.type) {
      case 'only-in-doc':
        nonMutatedOnlyInDoc.set(
          `${fail.requestConfig.method} ${fail.requestConfig.originalPath}`,
          0,
        );
        break;
      case 'only-in-oas':
        nonMutatedOnlyInOas.set(
          `${fail.requestConfig.method} ${oasPathSegsToPath(fail.requestConfig.pathSegs)}`,
          0,
        );
        break;
      case 'match-with-conflicts':
        nonMutatedFailsWithIncs.push(fail);
    }
  }

  let correctCount = 0;

  for (let i = 1; i <= scenarios; i++) {
    nonMutatedOnlyInOas.forEach((_, k, map) => map.set(k, 0));
    nonMutatedOnlyInDoc.forEach((_, k, map) => map.set(k, 0));
    const nNonMutatedFailsWithIncs = Array<number>(
      nonMutatedFailsWithIncs.length,
    ).fill(0);

    const tree = await docParse(pathDocLocal);
    const nParts = 2 + Math.round(rng() * 3);
    const parts = shuffle(selectAll(splitNode, tree), rng).slice(0, nParts - 1);
    const partsSet = new Set(parts);
    const splits = [tree, ...parts];

    const partsPositions = sortBy(
      splits.map(part => {
        const { position } = part;
        assert(position);
        const { start, end } = position;
        return [start.line, end.line] as const;
      }),
      ([start]) => start,
    );

    const partsRanges: (readonly [number, number])[][] = [];
    for (const [i, [startI, endI]] of partsPositions.entries()) {
      const range: (readonly [number, number])[] = [[startI, endI]];
      for (const [j, [startJ, endJ]] of partsPositions.entries()) {
        if (i === j || startI > startJ || endJ > endI) continue;
        for (const [k, [startSubrange, endSubrange]] of range.entries()) {
          if (startSubrange > startJ || endJ > endSubrange) continue;
          range.splice(
            k,
            1,
            ...(startSubrange === startJ
              ? [[endJ + 1, endSubrange] as const]
              : endSubrange === endJ
                ? [[startSubrange, startJ - 1] as const]
                : [
                    [startSubrange, startJ - 1] as const,
                    [endJ + 1, endSubrange] as const,
                  ]),
          );
          break;
        }
      }
      partsRanges.push(range);
    }

    const requestConfigKeyToNSection = new Map(
      multiInstanceRequestConfigs.map(e => {
        const nSections = new Set(
          e.instancesPos.map(p =>
            partsRanges.findIndex(rs =>
              rs.some(([start, end]) => start <= p && p <= end),
            ),
          ),
        ).size;
        return [`${e.method} ${e.path}`, nSections];
      }),
    );

    const dirPath = join(baseDirPath, `iteration_${i}`);
    await mkdir(dirPath, { recursive: true });

    const accFailOutput: FailOutput = [];
    for (const [j, mutatedTree] of splits.entries()) {
      remove(mutatedTree, node => partsSet.has(node));

      const mutatedDocPath = join(dirPath, `doc_${j}.md`);
      await writeFile(
        mutatedDocPath,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        docStringify({ type: 'root', children: [mutatedTree as any] }),
      );

      getInputMock.mockReset();
      setFailedMock.mockReset();

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
        setFailedMock.mock.calls[0]?.[0] as string,
      );
      accFailOutput.push(...failOutput);
    }

    const requestConfigKeyToNFails = new Map<string, number>();

    const oas = await oasParse(pathOasLocal);
    const { paths } = oas;
    assert(paths);
    for (const [path, pathItem] of objectEntries(paths)) {
      if (!pathItem) continue;
      for (const method of methods) {
        const requestConfig = pathItem[method];
        if (!requestConfig) continue;
        const key = `${method} ${path}`;
        if (nonMutatedOnlyInOas.has(key)) continue;
        requestConfigKeyToNFails.set(key, 0);
      }
    }

    const unexpectedFails: FailOutput = [];
    for (const fail of accFailOutput) {
      switch (fail.type) {
        case 'only-in-oas':
          {
            const key = `${fail.requestConfig.method} ${oasPathSegsToPath(fail.requestConfig.pathSegs)}`;
            const nFails = requestConfigKeyToNFails.get(key);
            const nonMutatedNFails = nonMutatedOnlyInOas.get(key);
            if (nFails === void 0 && nonMutatedNFails === void 0) {
              unexpectedFails.push(fail);
            }
            if (nFails !== void 0) {
              requestConfigKeyToNFails.set(key, nFails + 1);
            }
            if (nonMutatedNFails !== void 0) {
              nonMutatedOnlyInOas.set(key, nonMutatedNFails + 1);
            }
          }
          break;
        case 'only-in-doc':
          {
            const key = `${fail.requestConfig.method} ${fail.requestConfig.originalPath}`;
            const nonMutatedNFails = nonMutatedOnlyInDoc.get(key);
            if (nonMutatedNFails === void 0) {
              unexpectedFails.push(fail);
            } else nonMutatedOnlyInDoc.set(key, nonMutatedNFails + 1);
          }
          break;
        case 'match-with-conflicts':
          {
            const failWithIncsIndex = nonMutatedFailsWithIncs.findIndex(
              f =>
                fail.oasRequestConfig.method === f.oasRequestConfig.method &&
                isEqual(
                  fail.oasRequestConfig.pathSegs,
                  f.oasRequestConfig.pathSegs,
                ) &&
                fail.docRequestConfig.method === f.docRequestConfig.method &&
                fail.docRequestConfig.originalPath ===
                  f.docRequestConfig.originalPath,
            );
            if (failWithIncsIndex === -1) {
              unexpectedFails.push(fail);
            }
            nNonMutatedFailsWithIncs[failWithIncsIndex]++;
          }
          break;
      }
    }

    if (
      unexpectedFails.length === 0 &&
      [...requestConfigKeyToNFails.entries()].every(
        ([k, n]) => n === nParts - (requestConfigKeyToNSection.get(k) ?? 1),
      ) &&
      [...nonMutatedOnlyInOas.values()].every(n => n === nParts) &&
      [...nonMutatedOnlyInDoc.values(), ...nNonMutatedFailsWithIncs].every(
        n => n === 1,
      )
    ) {
      correctCount++;
      await rm(dirPath, { recursive: true, force: true });
    } else {
      await writeFile(
        join(dirPath, 'result.json'),
        JSON.stringify({
          unexpectedFails,
          requestConfigKeyToNFails: [
            ...requestConfigKeyToNFails.entries(),
          ].filter(
            ([k, n]) => n !== nParts - (requestConfigKeyToNSection.get(k) ?? 1),
          ),
          nonMutatedOnlyInOas: [...nonMutatedOnlyInOas.entries()].filter(
            ([, n]) => n !== nParts,
          ),
          nonMutatedOnlyInDoc: [...nonMutatedOnlyInDoc.entries()].filter(
            ([, n]) => n !== 1,
          ),
          nonMutatedFailsWithIncs: nNonMutatedFailsWithIncs.filter(
            n => n !== 1,
          ),
        }),
      );
    }
  }
  console.info(
    `Got ${correctCount}/${scenarios} correct (${Math.floor((correctCount / scenarios) * 100)}%) on ${repoName}`,
  );
};

export type DocSubtleMutationsOptions = {
  scenarios: number;
  subtleNode: Nodes['type'];
  nToChange: number;
};

export const evaluateDocSubtleMutations = async (
  repoInfo: RepoInfo,
  testEnv: MutationTestEnv,
  options: DocSubtleMutationsOptions,
) => {
  const { repoName, sha, pathOas, pathDoc } = repoInfo;
  const { scenarios, subtleNode, nToChange } = options;
  const { getInputMock, setFailedMock, rng } = testEnv;

  const githubBase = `https://github.com/${repoName}/blob/${sha}`;
  const pathOasGithub = `${githubBase}/${pathOas}`;
  const pathDocGithub = `${githubBase}/${pathDoc}`;

  const baseDirPath = join(
    import.meta.dir,
    `../../data/mutation/doc/${repoName.replace('/', '__')}/${sha}/${subtleNode}`,
  );

  const [pathOasLocal, pathDocLocal] = await Promise.all([
    getOrDownload(pathOasGithub, baseDirPath),
    getOrDownload(pathDocGithub, baseDirPath),
  ]);

  getInputMock.mockReset();
  setFailedMock.mockReset();

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

  await main.run();

  const nonMutatedFailOutput: FailOutput =
    setFailedMock.mock.calls.length === 0
      ? []
      : JSON.parse(setFailedMock.mock.calls[0]?.[0] as string);

  let correctCount = 0;

  const tree = await docParse(pathDocLocal);
  const allHeadings = selectAll(subtleNode, tree);
  const nChanges = Math.min(nToChange, allHeadings.length);
  for (let i = 1; i <= (nChanges === 0 ? 1 : scenarios); i++) {
    const treeCopy = structuredClone(tree);
    const headingCopies = selectAll(subtleNode, treeCopy);
    const headingsToChange = shuffle(headingCopies, rng).slice(0, nChanges);
    type Change = {
      type: 'update';
      key: string;
      oldValue: number;
      value: number;
    };
    const changes: Change[] = [];
    const isHeading = (node: Node): node is Heading => node.type === 'heading';
    headingsToChange.forEach(node => {
      if (!isHeading(node)) return;
      const newDepth = node.depth + 1;
      changes.push({
        type: 'update',
        key: 'depth',
        oldValue: node.depth,
        value: newDepth,
      });
      node.depth = newDepth as Heading['depth'];
    });

    const dirPath = join(baseDirPath, `iteration_${i}`);
    await mkdir(dirPath, { recursive: true });

    const mutatedDocPath = join(dirPath, `doc.md`);
    await writeFile(mutatedDocPath, docStringify(treeCopy));

    getInputMock.mockReset();
    setFailedMock.mockReset();

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

    const failOutput: FailOutput =
      setFailedMock.mock.calls.length === 0
        ? []
        : JSON.parse(setFailedMock.mock.calls[0]?.[0] as string);

    const outputChanges = atomizeChangeset(
      diff(nonMutatedFailOutput, failOutput),
    ).filter(c => !(c.type === 'UPDATE' && c.key === 'line'));

    if (outputChanges.length === 0) {
      correctCount++;
      await rm(dirPath, { recursive: true, force: true });
    } else {
      await writeFile(
        join(dirPath, 'result.json'),
        JSON.stringify({ changes, outputChanges }, null, 2),
      );
    }
  }
  await appendFile(
    join(import.meta.dir, `../../data/headingMutOutput.csv`),
    `${repoName}, ${sha}, ${nToChange}, ${nToChange / allHeadings.length}, ${scenarios}, ${nToChange === 0 ? scenarios : correctCount}, ${nToChange === 0 ? 1 : correctCount / scenarios}\n`,
  );
  console.info(
    `Got ${correctCount}/${scenarios} correct (${((correctCount / scenarios) * 100).toFixed(2)}%) on ${repoName} (${nToChange} headings (${((nToChange / allHeadings.length) * 100).toFixed(2)}%))`,
  );
  return nToChange === allHeadings.length;
};
