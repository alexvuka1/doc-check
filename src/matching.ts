import assert from 'assert';
import { zip } from 'lodash-es';
import { Inconsistency } from './parsing';
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
  for (const [i1, i2] of config) {
    if (i1 === void 0 || i2 === void 0) continue;
    const key = makeKey(isOasIndexFirst ? [i1, i2] : [i2, i1]);
    const inconsistencies = inconsistencyMap.get(key) || [];
    totalInconsistencies += inconsistencies.length;
  }
  return totalInconsistencies;
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
  let bestConfiguration: [number | undefined, number | undefined][] = [];

  for (const perm of perms) {
    const currentConfig = zip(perm, areMoreInOas ? docGroup : oasGroup);
    const totalInconsistencies = evaluateConfiguration(
      currentConfig,
      areMoreInOas,
      inconsistencyMap,
    );
    if (totalInconsistencies >= minTotalInconsistencies) continue;
    minTotalInconsistencies = totalInconsistencies;
    bestConfiguration = areMoreInOas
      ? currentConfig
      : currentConfig.map(([i2, i1]) => [i1, i2]);
  }

  return bestConfiguration;
};

const matchEndpoints = (
  groups: [number[], number[]][],
  inconsistencyMap: Map<string, Inconsistency[]>,
): [number, number][] => {
  const matches: [number, number][] = [];

  for (const [oasGroup, docGroup] of groups) {
    if (oasGroup.length === 1 && docGroup.length === 1) {
      assert(oasGroup[0] !== void 0);
      assert(docGroup[0] !== void 0);
      matches.push([oasGroup[0], docGroup[0]]);
    } else {
      const bestMatches = getBestMatches(oasGroup, docGroup, inconsistencyMap);
      for (const [i1, i2] of bestMatches) {
        if (i1 === void 0 || i2 === void 0) continue;
        matches.push([i1, i2]);
      }
    }
  }

  return matches;
};

export const findBestMatches = (
  oasIndexToDocIndices: Map<number, number[]>,
  docIndexToOasIndices: Map<number, number[]>,
  inconsistenciesMap: Map<string, Inconsistency[]>,
) => {
  const groups = getGroups(oasIndexToDocIndices, docIndexToOasIndices);
  return matchEndpoints(groups, inconsistenciesMap);
};
