import { Code, Literal, Literals, Node, Root } from 'mdast';
import type { InclusiveDescendant, Matches } from 'unist-util-visit-parents';
import { Permutations, UnionToArray } from './utils';

export type SectionizedTree = Root;

const mdastLiterals = [
  'code',
  'html',
  'inlineCode',
  'text',
  'yaml',
] as const satisfies Permutations<UnionToArray<Literals['type']>>;

export const literalsToCheck = [
  'code',
  'inlineCode',
  'text',
] as const satisfies (typeof mdastLiterals)[number][];

const codeLangsToCheck = [void 0, null] as const satisfies Code['lang'][];

type LiteralNode = Matches<
  InclusiveDescendant<Root>,
  (typeof literalsToCheck)[number]
>;

export const shouldSkipLiteral = (node: Literal) =>
  !isLiteralNode(node) ||
  (node.type === 'code' && !codeLangsToCheck.some(l => l === node.lang));

export const isLiteralNode = (node: Node): node is LiteralNode =>
  literalsToCheck.some(l => l === node.type);
