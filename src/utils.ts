export const objectKeys = <T extends object>(obj: T) =>
  Object.keys(obj) as (keyof T)[];
export const objectEntries = <T extends object>(obj: T) =>
  Object.entries(obj) as [keyof T, T[keyof T]][];
