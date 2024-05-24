import * as core from '@actions/core';
import SwaggerParser from '@apidevtools/swagger-parser';
import assert from 'assert';
import { beforeEach, describe, expect, it, spyOn } from 'bun:test';
import { mkdir, rm, writeFile } from 'fs/promises';
import { isEqual, partition, shuffle } from 'lodash-es';
import { join } from 'path';
import seedrandom from 'seedrandom';
import * as main from '../main';
import { FailOutput, OasEndpoint, methods } from '../parsing';
import { docParse, docStringify } from '../parsing/markdown';
import { oasParse, oasParsePath } from '../parsing/openapi';
import { objectEntries } from '../utils';
import { getOrDownload } from './utils';
import { OasMutations, oasMutate } from './utils/oasMutation';

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
    `data/mutation/${repoName.replace('/', '__')}`,
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

  it(
    'handles mutations gothinkster/realworld',
    async () => {
      const [pathOasLocal, pathDocLocal] = await Promise.all([
        getOrDownload(pathOasGithub, baseDirPath),
        getOrDownload(pathDocGithub, baseDirPath),
      ]);

      const oas = await oasParse(pathOasLocal);
      const { paths } = oas;
      expect(paths).toBeDefined();
      assert(paths !== void 0);

      let correctCount = 0;
      const scenarios = 100;
      const probRemovePath = 0.1;
      const probRemoveEndpoint = 0.2;
      const maxAddPath = 15;
      const probAddPath = 0.3;
      const probAddPathMethod = 0.1;

      for (let i = 1; i <= scenarios; i++) {
        const removedEndpoints: [
          OasEndpoint['method'],
          OasEndpoint['pathParts'],
        ][] = [];
        const addedEndpoints: [
          OasEndpoint['method'],
          OasEndpoint['pathParts'],
        ][] = [];
        const mutations: OasMutations = {
          removePaths: [],
          removeEndpoints: [],
          addEndpoints: [],
          changeMethods: [],
        };
        for (const [path, pathItem] of objectEntries(paths)) {
          const pathParts = oasParsePath(path);
          if (rng.quick() < probRemovePath) {
            mutations.removePaths.push(path);
            for (const method of methods) {
              if (!pathItem?.[method]) continue;
              removedEndpoints.push([method, pathParts]);
            }
            continue;
          }

          const methodsToRemove: OasEndpoint['method'][] = [];
          const methodsToChange: OasEndpoint['method'][] = [];

          const [existingMethods, nonExistingMethods] = partition(
            methods,
            m => pathItem?.[m],
          );

          for (const method of existingMethods) {
            assert(pathItem?.[method]);
            const x = rng.quick();
            if (x < probRemoveEndpoint) {
              methodsToRemove.push(method);
            } else if (
              nonExistingMethods.length > methodsToChange.length &&
              x < probRemoveEndpoint + probAddPathMethod
            ) {
              methodsToChange.push(method);
            }
          }
          if (methodsToRemove.length > 0) {
            mutations.removeEndpoints.push({
              path,
              methods: methodsToRemove,
            });
            for (const method of methodsToRemove) {
              removedEndpoints.push([method, pathParts]);
            }
          }
          if (methodsToChange.length > 0) {
            const shuffledNonExistingMethods = shuffle(nonExistingMethods);
            mutations.changeMethods.push({
              path,
              changes: methodsToChange.map((m, i) => ({
                oldMethod: m,
                newMethod: shuffledNonExistingMethods[i],
              })),
            });
            for (const [i, method] of methodsToChange.entries()) {
              removedEndpoints.push([method, pathParts]);
              addedEndpoints.push([shuffledNonExistingMethods[i], pathParts]);
            }
          }
        }
        for (let i = 0; i < maxAddPath; i++) {
          if (rng.quick() < probAddPath) continue;
          const methodsToAdd = methods.filter(
            () => rng.quick() < probAddPathMethod,
          );
          if (methodsToAdd.length === 0) continue;
          const path = `/doc-check/mutation-test/${i}`;
          mutations.addEndpoints.push({ path, methods: methodsToAdd });
          const pathParts = oasParsePath(path);
          for (const method of methodsToAdd) {
            addedEndpoints.push([method, pathParts]);
          }
        }
        const mutatedOas = oasMutate(oas, mutations);

        const dirPath = join(baseDirPath, `iteration_${i}`);
        await mkdir(dirPath, { recursive: true });

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

        if (
          mutations.removeEndpoints.length === 0 &&
          mutations.removePaths.length === 0 &&
          mutations.addEndpoints.length === 0 &&
          setFailedMock.mock.calls.length === 0
        ) {
          correctCount++;
          await rm(dirPath, { recursive: true, force: true });
        }
        if (setFailedMock.mock.calls.length === 1) {
          const failOutput: FailOutput = JSON.parse(
            setFailedMock.mock.calls[0][0] as string,
          );

          const matchedRemovedIndices = new Set<number>();
          const matchedAddedIndices = new Set<number>();

          for (const i of failOutput) {
            switch (i.type) {
              case 'only-in-doc':
                const removedEndpointIndex = removedEndpoints.findIndex(
                  ([m, pp], idx) =>
                    !matchedRemovedIndices.has(idx) &&
                    i.endpoint.method === m &&
                    isEqual(
                      i.endpoint.pathParts.slice(
                        i.endpoint.pathParts.length - pp.length,
                      ),
                      pp,
                    ),
                );
                if (removedEndpointIndex === -1) continue;
                matchedRemovedIndices.add(removedEndpointIndex);
                break;
              case 'only-in-oas':
                const addedEndpointIndex = addedEndpoints.findIndex(
                  ([method, pathParts], idx) =>
                    !matchedAddedIndices.has(idx) &&
                    i.endpoint.method === method &&
                    isEqual(i.endpoint.pathParts, pathParts),
                );
                if (addedEndpointIndex === -1) continue;
                matchedAddedIndices.add(addedEndpointIndex);
                break;
              default:
                throw new Error('Unknown fail output type: ' + i.type);
            }
          }

          if (
            failOutput.length ===
              removedEndpoints.length + addedEndpoints.length &&
            removedEndpoints.length === matchedRemovedIndices.size &&
            addedEndpoints.length === matchedAddedIndices.size
          ) {
            correctCount++;
            await rm(dirPath, { recursive: true, force: true });
          }
        }

        getInputMock.mockReset();
        setFailedMock.mockReset();
      }
      console.info(
        `Got ${correctCount}/${scenarios} correct (${Math.floor((correctCount / scenarios) * 100)}%)`,
      );
    },
    { timeout: 120_000 },
  );
});
