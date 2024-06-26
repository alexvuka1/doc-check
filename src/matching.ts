import assert from 'assert';
import { isEqual, zip } from 'lodash-es';
import { singular } from 'pluralize';
import {
  DocRequestConfig,
  Conflict,
  OasRequestConfig,
  PathSeg,
} from './parsing';
import { makeKey, mapGetOrSetDefault } from './utils';

const addEdges = (
  graph: Map<number, number[]>,
  key: number,
  values: number[],
  negate: boolean,
) => {
  const neighbors = mapGetOrSetDefault(graph, key, []);
  for (const val of values) {
    neighbors.push(negate ? -(val + 1) : val);
  }
};

const bfs = (
  graph: Map<number, number[]>,
  startNode: number,
  visited: Set<number>,
) => {
  const queue: number[] = [];
  const component: Set<number> = new Set();

  for (
    let current: number | undefined = startNode;
    current !== void 0;
    current = queue.shift()
  ) {
    if (visited.has(current)) continue;
    visited.add(current);
    component.add(current);
    const neighbors = graph.get(current) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        queue.push(neighbor);
      }
    }
  }

  return component;
};

const getGroups = (
  oasIndexToDocIndices: Map<number, number[]>,
  docIndexToOasIndices: Map<number, number[]>,
) => {
  const graph = new Map<number, number[]>();

  for (const [k, v] of oasIndexToDocIndices.entries()) {
    addEdges(graph, k, v, true);
  }

  for (const [k, v] of docIndexToOasIndices.entries()) {
    addEdges(graph, -(k + 1), v, false);
  }

  const visited = new Set<number>();
  const components: Set<number>[] = [];

  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      const component = bfs(graph, node, visited);
      components.push(component);
    }
  }

  // Format output as required
  const result: [number[], number[]][] = [];
  for (const component of components) {
    const oasGroup: number[] = [];
    const docGroup: number[] = [];
    for (const node of component) {
      if (node >= 0) oasGroup.push(node);
      else docGroup.push(-node - 1);
    }
    result.push([oasGroup, docGroup]);
  }

  return result;
};

const evaluateConfiguration = (
  config: [number | undefined, number | undefined][],
  isOasIndexFirst: boolean,
  conflictsMap: Map<string, Conflict[]>,
) => {
  let totalConflicts = 0;
  let nMethodMismatch = 0;

  for (const [i1, i2] of config) {
    if (i1 === void 0 || i2 === void 0) {
      nMethodMismatch++;
      continue;
    }
    const key = makeKey(isOasIndexFirst ? [i1, i2] : [i2, i1]);
    const conflicts = conflictsMap.get(key) || [];
    if (conflicts.find(i => i.type === 'method-mismatch')) {
      nMethodMismatch++;
    }
    totalConflicts += conflicts.length;
  }
  return nMethodMismatch > 1 ? Infinity : totalConflicts;
};

const permute = (arr: number[]): number[][] => {
  if (arr.length <= 1) return [arr];
  const result: number[][] = [];
  for (const [i, elem] of arr.entries()) {
    const restPerms = permute([...arr.slice(0, i), ...arr.slice(i + 1)]);
    for (const perm of restPerms) {
      result.push([elem, ...perm]);
    }
  }
  return result;
};

const getBestMatches = (
  oasGroup: number[],
  docGroup: number[],
  inconsistencyMap: Map<string, Conflict[]>,
) => {
  const areMoreInOas = oasGroup.length > docGroup.length;
  const perms = permute(areMoreInOas ? oasGroup : docGroup);

  let minTotalConflicts = Infinity;
  let bestConfiguration: [number | undefined, number | undefined][] | null =
    null;

  for (const perm of perms) {
    const currentConfig = zip(perm, areMoreInOas ? docGroup : oasGroup);
    const totalConflicts = evaluateConfiguration(
      currentConfig,
      areMoreInOas,
      inconsistencyMap,
    );
    if (
      !Number.isFinite(totalConflicts) ||
      totalConflicts >= minTotalConflicts
    ) {
      continue;
    }
    minTotalConflicts = totalConflicts;
    bestConfiguration = areMoreInOas
      ? currentConfig
      : currentConfig.map(([i2, i1]) => [i1, i2]);
  }

  return bestConfiguration;
};

type MatchResult = {
  bestMatchesOasToDoc: [number, number][];
  unmatchedOas: number[];
  unmatchedDoc: number[];
};

const matchRequestConfigs = (
  groups: [number[], number[]][],
  inconsistencyMap: Map<string, Conflict[]>,
) => {
  const res: MatchResult = {
    bestMatchesOasToDoc: [],
    unmatchedOas: [],
    unmatchedDoc: [],
  };

  const unmatchedOas = new Set(groups.flatMap(([oas]) => oas));
  const unmatchedDoc = new Set(groups.flatMap(([, doc]) => doc));

  for (const [oasGroup, docGroup] of groups) {
    if (oasGroup.length === 1 && docGroup.length === 1) {
      const oas = oasGroup[0];
      const doc = docGroup[0];
      assert(
        oas !== void 0 && unmatchedOas.has(oas),
        `Oas requestConfig with index ${oas} should be defined and unmatched`,
      );
      assert(
        doc !== void 0 && unmatchedDoc.has(doc),
        `Doc requestConfig with index ${doc} should be defined and unmatched`,
      );
      res.bestMatchesOasToDoc.push([oas, doc]);
      unmatchedOas.delete(oas);
      unmatchedDoc.delete(doc);
      continue;
    }

    const bestMatches = getBestMatches(oasGroup, docGroup, inconsistencyMap);
    if (!bestMatches) {
      res.unmatchedOas.push(...oasGroup);
      res.unmatchedDoc.push(...docGroup);
      continue;
    }
    for (const [i1, i2] of bestMatches) {
      if (i1 === void 0 || i2 === void 0) continue;
      assert(
        unmatchedOas.has(i1),
        `Oas requestConfig with index ${i1} should be unmatched`,
      );
      assert(
        unmatchedDoc.has(i2),
        `Doc requestConfig with index ${i2} should be unmatched`,
      );
      res.bestMatchesOasToDoc.push([i1, i2]);
      unmatchedOas.delete(i1);
      unmatchedDoc.delete(i2);
    }
  }

  res.unmatchedOas = [...unmatchedOas];
  res.unmatchedDoc = [...unmatchedDoc];

  assert(
    groups.reduce((acc, g) => acc + g[0].length + g[1].length, 0) ===
      res.bestMatchesOasToDoc.length * 2 +
        res.unmatchedOas.length +
        res.unmatchedDoc.length,
    'Number of indices stay the same',
  );
  return res;
};

export const findBestMatches = (
  oasIndexToDocIndices: Map<number, number[]>,
  docIndexToOasIndices: Map<number, number[]>,
  conflictsMap: Map<string, Conflict[]>,
) => {
  const groups = getGroups(oasIndexToDocIndices, docIndexToOasIndices);
  return matchRequestConfigs(groups, conflictsMap);
};

const normalizeParam = (param: string) =>
  param
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();

export const areEqualParams = (
  path1: PathSeg[],
  index1: number,
  path2: PathSeg[],
  index2: number,
) => {
  const param1 = path1[index1];
  const param2 = path2[index2];
  assert(param1 !== void 0 && param2 !== void 0);
  if (param1.type !== 'parameter' || param2.type !== 'parameter') {
    return false;
  }
  const param1Normalized = normalizeParam(param1.name);
  const param2Normalized = normalizeParam(param2.name);
  const areEqualNormalized = param1Normalized === param2Normalized;
  if (areEqualNormalized) return true;
  if (index1 === 0 || index2 === 0) return false;
  const prevPart1 = path1[index1 - 1];
  const prevPart2 = path2[index2 - 1];
  if (
    prevPart1?.type !== 'literal' ||
    prevPart2?.type !== 'literal' ||
    prevPart1.value !== prevPart2.value
  ) {
    return false;
  }
  const prefix = singular(prevPart1.value);
  return (
    `${prefix} ${param1Normalized}` === param2Normalized ||
    `${prefix} ${param2Normalized}` === param1Normalized
  );
};

export const areEqualPaths = (path1: PathSeg[], path2: PathSeg[]) => {
  if (path1.length !== path2.length) return false;
  return path1.every((p1, i) => {
    const p2 = path2[i];
    assert(p2 !== void 0);
    return (
      (p1.type === 'literal' &&
        p2.type === 'literal' &&
        p1.value === p2.value) ||
      areEqualParams(path1, i, path2, i)
    );
  });
};

export const areEqualRequestConfig = (
  oasRequestConfig: OasRequestConfig,
  docRequestConfig: DocRequestConfig,
) => {
  if (oasRequestConfig.method !== docRequestConfig.method) return false;
  const { scheme, host } = docRequestConfig;
  const docHasServer =
    scheme ||
    host ||
    oasRequestConfig.pathSegs.length < docRequestConfig.pathSegs.length;
  const basePathStart =
    oasRequestConfig.pathSegs.length - docRequestConfig.pathSegs.length;
  const server = docHasServer
    ? oasRequestConfig.servers.find(
        s =>
          (!scheme || s.scheme === scheme) &&
          (!host || s.host?.includes(host)) &&
          (oasRequestConfig.pathSegs.length ===
            docRequestConfig.pathSegs.length ||
            (s.basePath &&
              basePathStart < 0 &&
              areEqualPaths(
                s.basePath.slice(basePathStart),
                docRequestConfig.pathSegs.slice(
                  0,
                  -oasRequestConfig.pathSegs.length,
                ),
              ))),
      )
    : null;

  if (docHasServer && !server) return false;
  return areEqualPaths(
    [
      ...(server?.basePath?.slice(basePathStart) ?? []),
      ...oasRequestConfig.pathSegs,
    ],
    docRequestConfig.pathSegs,
  );
};

export const areDifferentPaths = (
  oasRequestConfig: OasRequestConfig,
  docRequestConfig: DocRequestConfig,
) =>
  ![
    ...oasRequestConfig.servers,
    { basePath: [] } satisfies (typeof oasRequestConfig.servers)[number],
  ].some(s => {
    const { basePath } = s;
    if (oasRequestConfig.pathSegs.length > docRequestConfig.pathSegs.length) {
      return false;
    }
    const lengthDiff =
      basePath.length +
      oasRequestConfig.pathSegs.length -
      docRequestConfig.pathSegs.length;
    if (lengthDiff < 0) return false;
    const partialBasePath = basePath.slice(lengthDiff);
    const oasPath = [...partialBasePath, ...oasRequestConfig.pathSegs];
    return (
      oasPath.length === docRequestConfig.pathSegs.length &&
      oasPath.every((oasP, i) => {
        const docP = docRequestConfig.pathSegs[i];
        return (
          (docP && oasP.type === 'parameter' && docP.type === 'parameter') ||
          isEqual(oasP, docP)
        );
      })
    );
  });
