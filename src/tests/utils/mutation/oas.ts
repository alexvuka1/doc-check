import assert from 'assert';
import { mkdir, rm, writeFile } from 'fs/promises';
import { partition } from 'lodash-es';
import { OpenAPIV3 } from 'openapi-types';
import { join } from 'path';
import { MutationTestEnv } from '.';
import { RepoInfo, getOrDownload } from '..';
import * as main from '../../../main';
import { areEqualPaths } from '../../../matching';
import {
  FailOutput,
  Inconsistency,
  Method,
  OasDocument,
  OasEndpoint,
  methods,
} from '../../../parsing';
import { oasParse, oasParsePath } from '../../../parsing/openapi';
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
    ]),
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

  const oas = await oasParse(pathOasLocal);
  const { paths } = oas;
  assert(paths !== void 0);

  let correctCount = 0;

  for (let i = 1; i <= scenarios; i++) {
    const removedEndpoints: [
      OasEndpoint['method'],
      OasEndpoint['pathParts'],
    ][] = [];
    const addedEndpoints: [OasEndpoint['method'], OasEndpoint['pathParts']][] =
      [];
    const methodMismatched: {
      oldMethod: OasEndpoint['method'];
      newMethod: OasEndpoint['method'];
      pathParts: OasEndpoint['pathParts'];
    }[] = [];
    const mutations: OasMutations = {
      removePaths: [],
      removeEndpoints: [],
      addEndpoints: [],
      changeMethods: [],
    };
    for (const [path, pathItem] of objectEntries(paths)) {
      const pathParts = oasParsePath(path);
      if (rng() < probRemovePath) {
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
        for (const method of methodsToRemove) {
          removedEndpoints.push([method, pathParts]);
        }
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
        if (methodsToRemove.length === 0 && methodsToChange.length === 1) {
          methodMismatched.push({
            oldMethod: methodsToChange[0],
            newMethod: shuffledNonExistingMethods[0],
            pathParts,
          });
        } else {
          for (const [i, method] of methodsToChange.entries()) {
            removedEndpoints.push([method, pathParts]);
            addedEndpoints.push([shuffledNonExistingMethods[i], pathParts]);
          }
        }
      }
    }

    for (let i = 0; i < maxAddPath; i++) {
      if (rng() < probAddPath) continue;
      const methodsToAdd = methods.filter(() => rng() < probAddPathMethod);
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
      const matchedMethodMismatchedIndices = new Set<number>();

      const unhandledInconsistencies: Inconsistency[] = [];

      for (const fail of failOutput) {
        switch (fail.type) {
          case 'only-in-doc':
            const removedEndpointIndex = removedEndpoints.findIndex(
              ([m, pp], idx) =>
                !matchedRemovedIndices.has(idx) &&
                fail.endpoint.method === m &&
                areEqualPaths(
                  fail.endpoint.pathParts.slice(
                    fail.endpoint.pathParts.length - pp.length,
                  ),
                  pp,
                ),
            );
            if (removedEndpointIndex === -1) {
              console.log(fail);
              continue;
            }
            matchedRemovedIndices.add(removedEndpointIndex);
            break;
          case 'only-in-oas':
            const addedEndpointIndex = addedEndpoints.findIndex(
              ([method, pathParts], idx) =>
                !matchedAddedIndices.has(idx) &&
                fail.endpoint.method === method &&
                areEqualPaths(fail.endpoint.pathParts, pathParts),
            );
            if (addedEndpointIndex === -1) continue;
            matchedAddedIndices.add(addedEndpointIndex);
            break;
          case 'match-with-inconsistenties':
            for (const i of fail.inconsistencies) {
              switch (i.type) {
                case 'method-mismatch':
                  const methodMismatchedIndex = methodMismatched.findIndex(
                    ({ newMethod, oldMethod, pathParts }, idx) =>
                      !matchedMethodMismatchedIndices.has(idx) &&
                      fail.oasEndpoint.method === newMethod &&
                      fail.docEndpoint.method === oldMethod &&
                      areEqualPaths(fail.oasEndpoint.pathParts, pathParts) &&
                      areEqualPaths(
                        fail.docEndpoint.pathParts.slice(
                          fail.docEndpoint.pathParts.length - pathParts.length,
                        ),
                        pathParts,
                      ),
                  );
                  if (methodMismatchedIndex === -1) continue;
                  matchedMethodMismatchedIndices.add(methodMismatchedIndex);
                  break;
                default:
                  unhandledInconsistencies.push(i);
              }
            }
            break;
          default:
            throw new Error(`Unknown type of fail: ${fail}`);
        }
      }

      if (
        failOutput.length ===
          removedEndpoints.length +
            addedEndpoints.length +
            methodMismatched.length &&
        removedEndpoints.length === matchedRemovedIndices.size &&
        addedEndpoints.length === matchedAddedIndices.size &&
        methodMismatched.length === matchedMethodMismatchedIndices.size &&
        unhandledInconsistencies.length === 0
      ) {
        correctCount++;
        await rm(dirPath, { recursive: true, force: true });
      }
    }

    getInputMock.mockReset();
    setFailedMock.mockReset();
  }
  console.info(
    `Got ${correctCount}/${scenarios} correct (${Math.floor((correctCount / scenarios) * 100)}%) on ${repoName}`,
  );
};
