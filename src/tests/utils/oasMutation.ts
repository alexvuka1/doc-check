import assert from 'assert';
import { OpenAPIV3 } from 'openapi-types';
import { Method, OasDocument } from '../../parsing';
import { objectEntries } from '../../utils';

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
