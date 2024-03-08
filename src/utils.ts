/* eslint-disable @typescript-eslint/no-explicit-any */
import type { UnionToIntersection } from 'type-fest';

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
