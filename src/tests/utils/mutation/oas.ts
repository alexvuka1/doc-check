import assert from 'assert';
import { mkdir, rm, writeFile } from 'fs/promises';
import { isEqual, partition } from 'lodash-es';
import { OpenAPIV3 } from 'openapi-types';
import { join } from 'path';
import { MutationTestEnv } from '.';
import { RepoInfo, getOrDownload } from '..';
import * as main from '../../../main';
import { areEqualEndpoints, areEqualPaths } from '../../../matching';
import {
  FailOutput,
  Method,
  OasDocument,
  OasEndpoint,
  PathPart,
  methods,
} from '../../../parsing';
import {
  oasParse,
  oasParseEndpoints,
  oasParsePath,
  oasPathPartsToPath,
} from '../../../parsing/openapi';
import { objectEntries, shuffle } from '../../../utils';

export type OasMutations = {
  removePaths: string[];
  removeEndpoints: { path: string; methods: Method[] }[];
  changeMethods: {
    path: string;
    changes: { oldMethod: Method; newMethod: Method }[];
  }[];
  addEndpoints: { path: string; methods: Method[] }[];
};

export const oasMutate = (oas: OasDocument, oasMutations: OasMutations) => {
  const { paths } = oas;
  assert(paths !== void 0);

  const pathsToRemove = new Set<string>(oasMutations.removePaths);
  const pathToMethodsToRemove = new Map<string, Set<string>>(
    oasMutations.removeEndpoints.map(re => [re.path, new Set(re.methods)]),
  );
  const pathToMethodsToChange = new Map<string, Map<string, string>>(
    oasMutations.changeMethods.map(cm => [
      cm.path,
      new Map(cm.changes.map(c => [c.oldMethod, c.newMethod])),
    ]),
  );

  const mutatedOas = {
    ...oas,
    paths: Object.fromEntries([
      ...objectEntries(paths).flatMap(([path, pathItem]) => {
        if (!pathItem) return [];
        if (pathsToRemove.has(path)) return [];
        const methodsToRemove = pathToMethodsToRemove.get(path);
        const newPathItem = structuredClone(pathItem);
        for (const method of methodsToRemove ?? []) {
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete newPathItem[method];
        }
        const methodsToChange = pathToMethodsToChange.get(path);
        for (const [oldMethod, newMethod] of methodsToChange ?? []) {
          newPathItem[newMethod] = pathItem[oldMethod];
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete newPathItem[oldMethod];
        }
        return [[path, newPathItem]];
      }),
      ...oasMutations.addEndpoints.map(({ path, methods }) => [
        path,
        Object.fromEntries(
          methods.map(m => [
            m,
            {
              responses: { '200': { description: '' } },
            } satisfies OpenAPIV3.PathItemObject[Method],
          ]),
        ),
      ]),
    ]) as NonNullable<OasDocument['paths']>,
  };

  return mutatedOas;
};

type OasMutationsOptions = {
  scenarios: number;
  probRemovePath: number;
  probRemoveEndpoint: number;
  maxAddPath: number;
  probAddPath: number;
  probAddPathMethod: number;
  probChangeMethod: number;
};

export const evaluateOasMutations = async (
  repoInfo: RepoInfo,
  testEnv: MutationTestEnv,
  options: OasMutationsOptions,
) => {
  const { repoName, sha, pathOas, pathDoc } = repoInfo;
  const {
    scenarios,
    probRemovePath,
    probRemoveEndpoint,
    maxAddPath,
    probAddPath,
    probAddPathMethod,
    probChangeMethod,
  } = options;
  const { getInputMock, setFailedMock, rng } = testEnv;

  const githubBase = `https://github.com/${repoName}/blob/${sha}`;
  const pathOasGithub = `${githubBase}/${pathOas}`;
  const pathDocGithub = `${githubBase}/${pathDoc}`;

  const baseDirPath = join(
    import.meta.dir,
    `../../data/mutation/oas/${repoName.replace('/', '__')}`,
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

  const oas = await oasParse(pathOasLocal);
  const { paths } = oas;
  assert(paths !== void 0);

  const oasNoCircular = await oasParse(pathOasLocal, false);

  let correctCount = 0;

  for (let i = 1; i <= scenarios; i++) {
    const pathToRemovedMethods = new Map<string, Set<Method>>();
    const pathToAddedMethods = new Map<string, Set<Method>>();

    const mutations: OasMutations = {
      removePaths: [],
      removeEndpoints: [],
      addEndpoints: [],
      changeMethods: [],
    };

    for (const [path, pathItem] of objectEntries(paths)) {
      if (rng() < probRemovePath) {
        mutations.removePaths.push(path);
        pathToRemovedMethods.set(
          path,
          new Set(methods.filter(m => pathItem?.[m])),
        );
        continue;
      }

      const [existingMethods, nonExistingMethods] = partition(
        methods,
        m => pathItem?.[m],
      );

      const methodsToRemove: OasEndpoint['method'][] = [];
      const methodsToChange: OasEndpoint['method'][] = [];

      for (const method of existingMethods) {
        assert(pathItem?.[method]);
        const x = rng();
        if (x < probRemoveEndpoint) {
          methodsToRemove.push(method);
        } else if (
          nonExistingMethods.length > methodsToChange.length &&
          x < probRemoveEndpoint + probChangeMethod
        ) {
          methodsToChange.push(method);
        }
      }

      if (methodsToRemove.length > 0) {
        mutations.removeEndpoints.push({
          path,
          methods: methodsToRemove,
        });
        pathToRemovedMethods.set(path, new Set(methodsToRemove));
      }

      if (methodsToChange.length > 0) {
        const shuffledNonExistingMethods = shuffle(nonExistingMethods, rng);
        mutations.changeMethods.push({
          path,
          changes: methodsToChange.map((m, i) => ({
            oldMethod: m,
            newMethod: shuffledNonExistingMethods[i],
          })),
        });

        const removedMethods = pathToRemovedMethods.get(path) ?? new Set();
        const addedMethods = pathToAddedMethods.get(path) ?? new Set<Method>();

        for (const [i, method] of methodsToChange.entries()) {
          const newMethod = shuffledNonExistingMethods[i];

          removedMethods.add(method);
          addedMethods.add(newMethod);
        }

        pathToRemovedMethods.set(path, removedMethods);
        pathToAddedMethods.set(path, addedMethods);
      }
    }

    const handledFailIndices = new Set<number>();
    const oasIdToEndpoint = oasParseEndpoints(oas);

    const expectedOnlyInOas: { method: Method; pathParts: PathPart[] }[] = [];
    const expectedOnlyInDoc: (
      | {
          type: 'oas-equivalent';
          method: Method;
          pathParts: PathPart[];
        }
      | { type: 'doc-endpoint'; method: Method; originalPath: string }
    )[] = [];
    const expectedMatchWithMethodMismatch: {
      oasMethod: Method;
      docMethod: Method;
      pathParts: PathPart[];
    }[] = [];

    for (const [path, pathItem] of objectEntries(paths)) {
      const removedMethods = pathToRemovedMethods.get(path) ?? new Set();
      const addedMethods = pathToAddedMethods.get(path) ?? new Set();

      const onlyInOasMethods = new Set<Method>();
      const onlyInDocMethods = new Set<Method>();
      const docMethodToPath = new Map<Method, string>();

      for (const [i, fail] of nonMutatedFailOutput.entries()) {
        switch (fail.type) {
          case 'only-in-oas':
            if (oasPathPartsToPath(fail.endpoint.pathParts) !== path) continue;
            onlyInOasMethods.add(fail.endpoint.method);
            handledFailIndices.add(i);
            break;
          case 'only-in-doc':
            const method = methods.find(m => pathItem?.[m]);
            assert(method !== void 0);
            const oasEndpoint = oasIdToEndpoint.get(`${method} ${path}`);
            assert(oasEndpoint !== void 0);
            if (!areEqualEndpoints(oasEndpoint, { ...fail.endpoint, method })) {
              continue;
            }
            onlyInDocMethods.add(fail.endpoint.method);
            handledFailIndices.add(i);
            break;
          case 'match-with-inconsistenties':
            if (oasPathPartsToPath(fail.oasEndpoint.pathParts) !== path) {
              continue;
            }
            docMethodToPath.set(
              fail.docEndpoint.method,
              fail.docEndpoint.originalPath,
            );
            for (const inc of fail.inconsistencies) {
              switch (inc.type) {
                case 'method-mismatch':
                  onlyInOasMethods.add(fail.oasEndpoint.method);
                  onlyInDocMethods.add(fail.docEndpoint.method);
                  break;
              }
            }
            handledFailIndices.add(i);
            break;
          default:
            throw new Error(`Unknown fail type: ${fail}`);
        }
      }

      const pathParts = oasParsePath(path);

      const newOnlyInOasMethods = new Set([
        ...[...onlyInOasMethods].filter(m => !removedMethods.has(m)),
        ...[...addedMethods].filter(m => !onlyInDocMethods.has(m)),
      ]);

      const newOnlyInDocMethods = new Set([
        ...[...onlyInDocMethods].filter(m => !addedMethods.has(m)),
        ...[...removedMethods].filter(m => !onlyInOasMethods.has(m)),
      ]);

      if (newOnlyInOasMethods.size === 1 && newOnlyInDocMethods.size === 1) {
        const oasMethod = newOnlyInOasMethods[0];
        const docMethod = newOnlyInDocMethods[0];
        if (oasMethod === docMethod) continue;
        expectedMatchWithMethodMismatch.push({
          oasMethod: newOnlyInOasMethods[0],
          docMethod: newOnlyInDocMethods[0],
          pathParts,
        });
        continue;
      }

      for (const method of newOnlyInOasMethods) {
        expectedOnlyInOas.push({ method, pathParts });
      }

      for (const method of newOnlyInDocMethods) {
        const docPath = docMethodToPath.get(method);
        expectedOnlyInDoc.push(
          docPath
            ? { type: 'doc-endpoint', method, originalPath: docPath }
            : { type: 'oas-equivalent', method, pathParts },
        );
      }
    }

    const nonHandledFails = nonMutatedFailOutput.filter(
      (_, i) => !handledFailIndices.has(i),
    );

    for (let i = 0; i < maxAddPath; i++) {
      if (rng() < probAddPath) continue;
      const methodsToAdd = methods.filter(() => rng() < probAddPathMethod);
      if (methodsToAdd.length === 0) continue;
      const path = `/doc-check/mutation-test/${i}`;
      mutations.addEndpoints.push({ path, methods: methodsToAdd });
      const pathParts = oasParsePath(path);
      for (const method of methodsToAdd) {
        expectedOnlyInOas.push({ method, pathParts });
      }
    }

    const mutatedOas = oasMutate(oasNoCircular, mutations);

    const dirPath = join(baseDirPath, `iteration_${i}`);
    await mkdir(dirPath, { recursive: true });

    const mutatedOasPath = join(dirPath, 'oas.json');
    await writeFile(mutatedOasPath, JSON.stringify(mutatedOas, null, 2));

    getInputMock.mockReset();
    setFailedMock.mockReset();

    getInputMock.mockImplementation((name: string): string => {
      switch (name) {
        case 'openapi-path':
          return mutatedOasPath;
        case 'doc-path':
          return pathDocLocal;
        default:
          return '';
      }
    });

    await main.run();

    if (
      mutations.removeEndpoints.length === 0 &&
      mutations.removePaths.length === 0 &&
      mutations.addEndpoints.length === 0 &&
      setFailedMock.mock.calls.length === 0 &&
      nonMutatedFailOutput.length === 0
    ) {
      correctCount++;
      await rm(dirPath, { recursive: true, force: true });
    }
    if (setFailedMock.mock.calls.length === 1) {
      const failOutput: FailOutput = JSON.parse(
        setFailedMock.mock.calls[0][0] as string,
      );

      const matchedOnlyInOasIndices = new Set<number>();
      const matchedOnlyInDocIndices = new Set<number>();
      const matchedWithInconsistenciesIndices = new Set<number>();
      const matchedNonHandledIndices = new Set<number>();

      for (const fail of failOutput) {
        switch (fail.type) {
          case 'only-in-oas':
            {
              const i = expectedOnlyInOas.findIndex(
                expectedFail =>
                  expectedFail.method === fail.endpoint.method &&
                  isEqual(expectedFail.pathParts, fail.endpoint.pathParts),
              );
              if (i !== -1) {
                matchedOnlyInOasIndices.add(i);
                break;
              }
              const j = nonHandledFails.findIndex(
                expectedFail =>
                  expectedFail.type === 'only-in-oas' &&
                  expectedFail.endpoint.method === fail.endpoint.method &&
                  isEqual(
                    expectedFail.endpoint.pathParts,
                    fail.endpoint.pathParts,
                  ),
              );
              if (j !== -1) {
                matchedNonHandledIndices.add(j);
                break;
              }
            }
            break;
          case 'only-in-doc':
            {
              const index = expectedOnlyInDoc.findIndex(expectedFail =>
                expectedFail.type === 'oas-equivalent'
                  ? expectedFail.method === fail.endpoint.method &&
                    areEqualPaths(
                      expectedFail.pathParts,
                      fail.endpoint.pathParts.slice(
                        fail.endpoint.pathParts.length -
                          expectedFail.pathParts.length,
                      ),
                    )
                  : expectedFail.method === fail.endpoint.method &&
                    expectedFail.originalPath === fail.endpoint.originalPath,
              );
              if (index !== -1) {
                matchedOnlyInDocIndices.add(index);
                break;
              }

              const j = nonHandledFails.findIndex(
                expectedFail =>
                  expectedFail.type === 'only-in-doc' &&
                  expectedFail.endpoint.method === fail.endpoint.method &&
                  areEqualPaths(
                    expectedFail.endpoint.pathParts,
                    fail.endpoint.pathParts.slice(
                      fail.endpoint.pathParts.length -
                        expectedFail.endpoint.pathParts.length,
                    ),
                  ),
              );
              if (j !== -1) {
                matchedNonHandledIndices.add(j);
                break;
              }
            }
            break;
          case 'match-with-inconsistenties':
            const j = nonHandledFails.findIndex(expectedFail =>
              isEqual(expectedFail, fail),
            );

            if (j !== -1) {
              matchedNonHandledIndices.add(j);
              break;
            }

            const methodMismatch = fail.inconsistencies.find(
              i => i.type === 'method-mismatch',
            );
            if (methodMismatch === void 0) continue;
            const index = expectedMatchWithMethodMismatch.findIndex(
              expectedFail =>
                expectedFail.oasMethod === fail.oasEndpoint.method &&
                expectedFail.docMethod === fail.docEndpoint.method &&
                areEqualPaths(
                  expectedFail.pathParts,
                  fail.oasEndpoint.pathParts,
                ) &&
                areEqualPaths(
                  expectedFail.pathParts,
                  fail.oasEndpoint.pathParts.slice(
                    fail.oasEndpoint.pathParts.length -
                      expectedFail.pathParts.length,
                  ),
                ),
            );
            if (index !== -1) {
              matchedWithInconsistenciesIndices.add(index);
            }
            break;
          default:
            throw new Error(`Unknown type of fail: ${fail}`);
        }
      }

      if (
        expectedOnlyInOas.every((_, i) => matchedOnlyInOasIndices.has(i)) &&
        expectedOnlyInDoc.every((_, i) => matchedOnlyInDocIndices.has(i)) &&
        expectedMatchWithMethodMismatch.every((_, i) =>
          matchedWithInconsistenciesIndices.has(i),
        ) &&
        nonHandledFails.every((_, i) => matchedNonHandledIndices.has(i))
      ) {
        correctCount++;
        await rm(dirPath, { recursive: true, force: true });
      }
    }
  }
  console.info(
    `Got ${correctCount}/${scenarios} correct (${Math.floor((correctCount / scenarios) * 100)}%) on ${repoName}`,
  );
};
