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
