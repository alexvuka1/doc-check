import assert from 'assert';
import { mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { remove } from 'unist-util-remove';
import { selectAll } from 'unist-util-select';
import { MutationTestEnv } from '.';
import { RepoInfo, getOrDownload } from '..';
import * as main from '../../../main';
import { FailOutput, Method, methods } from '../../../parsing';
import { docParse, docStringify } from '../../../parsing/markdown';
import { oasParse, oasPathPartsToPath } from '../../../parsing/openapi';
import { objectEntries, shuffle } from '../../../utils';
import { isEqual } from 'lodash-es';

export type DocMutationsOptions = {
  scenarios: number;
  multiInstanceEndpoints?: {
    method: Method;
    path: string;
    instancesPos: number[];
  }[];
};

export const evaluateDocMutations = async (
  repoInfo: RepoInfo,
  testEnv: MutationTestEnv,
  options: DocMutationsOptions,
) => {
  const { repoName, sha, pathOas, pathDoc } = repoInfo;
  const { scenarios, multiInstanceEndpoints = [] } = options;
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
      : JSON.parse(setFailedMock.mock.calls[0][0] as string);
  const nonMutatedOnlyInDoc = new Map<string, number>();
  const nonMutatedOnlyInOas = new Map<string, number>();
  const nonMutatedFailsWithIncs: (FailOutput[number] & {
    type: 'match-with-inconsistenties';
  })[] = [];
  for (const fail of nonMutatedFailOutput) {
    switch (fail.type) {
      case 'only-in-doc':
        nonMutatedOnlyInDoc.set(
          `${fail.endpoint.method} ${fail.endpoint.originalPath}`,
          0,
        );
        break;
      case 'only-in-oas':
        nonMutatedOnlyInOas.set(
          `${fail.endpoint.method} ${oasPathPartsToPath(fail.endpoint.pathParts)}`,
          0,
        );
        break;
      case 'match-with-inconsistenties':
        nonMutatedFailsWithIncs.push(fail);
    }
  }

  let correctCount = 0;

  for (let i = 1; i <= scenarios; i++) {
    nonMutatedOnlyInOas.forEach((_, k, map) => map.set(k, 0));
    nonMutatedOnlyInDoc.forEach((_, k, map) => map.set(k, 0));
    const nNonMutatedFailsWithIncs = Array(nonMutatedFailsWithIncs.length).fill(
      0,
    );

    const tree = await docParse(pathDocLocal);
    const nParts = 2 + Math.round(rng() * 3);
    const sections = selectAll('section', tree);
    const parts = shuffle(sections, rng).slice(0, nParts - 1);
    const partsSet = new Set(parts);
    const splits = [tree, ...parts];

    const partsPositions = splits.map(part => {
      const { position } = part;
      assert(position);
      const { start, end } = position;
      return [start.line, end.line];
    });

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

    const endpointKeyToNSection = new Map(
      multiInstanceEndpoints.map(e => {
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
        setFailedMock.mock.calls[0][0] as string,
      );
      accFailOutput.push(...failOutput);
    }

    const endpointKeyToNFails = new Map<string, number>();

    const oas = await oasParse(pathOasLocal);
    const { paths } = oas;
    assert(paths);
    for (const [path, pathItem] of objectEntries(paths)) {
      if (!pathItem) continue;
      for (const method of methods) {
        const operation = pathItem[method];
        if (!operation) continue;
        const key = `${method} ${path}`;
        if (nonMutatedOnlyInOas.has(key)) continue;
        endpointKeyToNFails.set(key, 0);
      }
    }

    let hasUnexpectedFail = false;
    for (const fail of accFailOutput) {
      if (hasUnexpectedFail) break;
      switch (fail.type) {
        case 'only-in-oas':
          {
            const key = `${fail.endpoint.method} ${oasPathPartsToPath(fail.endpoint.pathParts)}`;
            const nFails = endpointKeyToNFails.get(key);
            const nonMutatedNFails = nonMutatedOnlyInOas.get(key);
            if (nFails === void 0 && nonMutatedNFails === void 0) {
              hasUnexpectedFail = true;
            }
            if (nFails !== void 0) endpointKeyToNFails.set(key, nFails + 1);
            if (nonMutatedNFails !== void 0) {
              nonMutatedOnlyInOas.set(key, nonMutatedNFails + 1);
            }
          }
          break;
        case 'only-in-doc':
          {
            const key = `${fail.endpoint.method} ${fail.endpoint.originalPath}`;
            const nonMutatedNFails = nonMutatedOnlyInDoc.get(key);
            if (nonMutatedNFails === void 0) hasUnexpectedFail = true;
            else nonMutatedOnlyInDoc.set(key, nonMutatedNFails + 1);
          }
          break;
        case 'match-with-inconsistenties':
          {
            const failWithIncsIndex = nonMutatedFailsWithIncs.findIndex(
              f =>
                fail.oasEndpoint.method === f.oasEndpoint.method &&
                isEqual(fail.oasEndpoint.pathParts, f.oasEndpoint.pathParts) &&
                fail.docEndpoint.method === f.docEndpoint.method &&
                fail.docEndpoint.originalPath === f.docEndpoint.originalPath,
            );
            if (failWithIncsIndex === -1) {
              hasUnexpectedFail = true;
              break;
            }
            nNonMutatedFailsWithIncs[failWithIncsIndex]++;
          }
          break;
      }
    }

    if (
      (!hasUnexpectedFail &&
        [...endpointKeyToNFails.entries()].every(
          ([k, n]) => n === nParts - (endpointKeyToNSection.get(k) ?? 1),
        ) &&
        [...nonMutatedOnlyInOas.values()].every(n => n === nParts),
      [...nonMutatedOnlyInDoc.values(), ...nNonMutatedFailsWithIncs].every(
        n => n === 1,
      ))
    ) {
      correctCount++;
      await rm(dirPath, { recursive: true, force: true });
    }
  }
  console.info(
    `Got ${correctCount}/${scenarios} correct (${Math.floor((correctCount / scenarios) * 100)}%) on ${repoName}`,
  );
};
