import assert from 'assert';
import { zip } from 'lodash-es';
import { Inconsistency, PathPart } from './parsing';
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
  inconsistencyMap: Map<string, Inconsistency[]>,
) => {
  let totalInconsistencies = 0;
  let everyHasMethodMismatch = true;

  for (const [i1, i2] of config) {
    if (i1 === void 0 || i2 === void 0) continue;
    const key = makeKey(isOasIndexFirst ? [i1, i2] : [i2, i1]);
    const inconsistencies = inconsistencyMap.get(key) || [];
    if (
      everyHasMethodMismatch &&
      !inconsistencies.find(i => i.type === 'method-mismatch')
    ) {
      everyHasMethodMismatch = false;
    }
    totalInconsistencies += inconsistencies.length;
  }
  return config.length > 1 && everyHasMethodMismatch
    ? Infinity
    : totalInconsistencies;
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
  inconsistencyMap: Map<string, Inconsistency[]>,
) => {
  const areMoreInOas = oasGroup.length > docGroup.length;
  const perms = permute(areMoreInOas ? oasGroup : docGroup);

  let minTotalInconsistencies = Infinity;
  let bestConfiguration: [number | undefined, number | undefined][] | null =
    null;

  for (const perm of perms) {
    const currentConfig = zip(perm, areMoreInOas ? docGroup : oasGroup);
    const totalInconsistencies = evaluateConfiguration(
      currentConfig,
      areMoreInOas,
      inconsistencyMap,
    );
    if (
      !Number.isFinite(totalInconsistencies) ||
      totalInconsistencies >= minTotalInconsistencies
    ) {
      continue;
    }
    minTotalInconsistencies = totalInconsistencies;
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

const matchEndpoints = (
  groups: [number[], number[]][],
  inconsistencyMap: Map<string, Inconsistency[]>,
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
        `Oas endpoint with index ${oas} should be defined and unmatched`,
      );
      assert(
        doc !== void 0 && unmatchedDoc.has(doc),
        `Doc endpoint with index ${doc} should be defined and unmatched`,
      );
      res.bestMatchesOasToDoc.push([oas, doc]);
      unmatchedOas.delete(oas);
      unmatchedDoc.delete(doc);
      continue;
    }

    // if (oasGroup.length === 1 || docGroup.length === 1) {
    //   const isOasSingle = oasGroup.length === 1;
    //   const [[i], multiGroup] = isOasSingle
    //     ? [oasGroup, docGroup]
    //     : [docGroup, oasGroup];
    //   assert(
    //     i !== void 0,
    //     `${isOasSingle ? 'Oas' : 'Doc'} endpoint with index ${i} should be defined`,
    //   );
    //   const noMethodMatches = multiGroup.every(j => {
    //     const key = makeKey(isOasSingle ? [i, j] : [j, i]);
    //     const inconsistencies = inconsistencyMap.get(key) || [];
    //     return inconsistencies.some(i => i.type === 'method-mismatch');
    //   });
    //   if (noMethodMatches) {
    //     res.unmatchedOas.push(...oasGroup);
    //     res.unmatchedDoc.push(...docGroup);
    //     continue;
    //   }
    // }

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
        `Oas endpoint with index ${i1} should be unmatched`,
      );
      assert(
        unmatchedDoc.has(i2),
        `Doc endpoint with index ${i2} should be unmatched`,
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
  inconsistenciesMap: Map<string, Inconsistency[]>,
) => {
  const groups = getGroups(oasIndexToDocIndices, docIndexToOasIndices);
  return matchEndpoints(groups, inconsistenciesMap);
};

const normalizeParam = (param: string) =>
  param
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();

export const areEqualParams = (param1: string, param2: string) =>
  normalizeParam(param1) === normalizeParam(param2);

export const areEqualPaths = (path1: PathPart[], path2: PathPart[]) => {
  if (path1.length !== path2.length) return false;
  return path1.every((p1, i) => {
    const p2 = path2[i];
    assert(p2 !== void 0);
    return (
      (p1.type === 'literal' &&
        p2.type === 'literal' &&
        p1.value === p2.value) ||
      (p1.type === 'parameter' &&
        p2.type === 'parameter' &&
        areEqualParams(p1.name, p2.name))
    );
  });
};
