/* eslint-disable @typescript-eslint/no-explicit-any */
import type { IsEqual, UnionToIntersection } from 'type-fest';

export const objectKeys = <T extends object>(obj: T) =>
  Object.keys(obj) as (keyof T)[];
export const objectEntries = <T extends object>(obj: T) =>
  Object.entries(obj) as [keyof T, T[keyof T]][];

type PopUnion<U> =
  UnionToIntersection<U extends any ? (f: U) => void : never> extends (
    a: infer A,
  ) => void
    ? A
    : never;

type IsUnion<T> = [T] extends [UnionToIntersection<T>] ? false : true;

export type UnionToArray<T, A extends unknown[] = []> =
  IsUnion<T> extends true
    ? UnionToArray<Exclude<T, PopUnion<T>>, [PopUnion<T>, ...A]>
    : [T, ...A];

export type Permutations<T extends readonly unknown[]> = T extends []
  ? T
  : {
      // put each member of T first in an array, and concatenate the permutations of T without that member
      [K in keyof T]: [T[K], ...Permutations<ExcludeElement<T, T[K]>>];
    }[number];

/** Removes the first instance of `T` from `A`. */
type ExcludeElement<
  Arr extends readonly unknown[],
  T,
  $acc extends unknown[] = [],
> = Arr extends readonly [infer H, ...infer R]
  ? IsEqual<H, T> extends true
    ? [...$acc, ...R]
    : ExcludeElement<R, T, [...$acc, H]>
  : $acc;

export const mapIncrement = <K>(map: Map<K, number>, key: K) =>
  map.set(key, (map.get(key) ?? 0) + 1);

export const mapGetOrSetDefault = <K, V>(map: Map<K, V>, key: K, def: V) => {
  let value = map.get(key);
  if (value === void 0) {
    value = def;
    map.set(key, value);
  }
  return value;
};

export const makeKey = ([i1, i2]: [string | number, string | number]): string =>
  `${i1.toString()} ${i2.toString()}`;
