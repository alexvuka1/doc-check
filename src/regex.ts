import { Endpoint, Method, PathPart } from './parsing';

export const getMethodRegex = (matchMethods: Method[]) => {
  const matchUnionStr = matchMethods
    .flatMap(m => [m, m.toUpperCase()])
    .join('|');
  return new RegExp(`\\b(?<!\\/)(${matchUnionStr})(?!\\/)\\b`);
};

const pathToRegexStr = (pathParts: PathPart[]) =>
  pathParts
    .map(p => {
      switch (p.type) {
        case 'literal':
          return p.value;
        case 'parameter':
          return p.name.replace(/(.*)/, `(\\{$1\\}|:$1)`);
      }
    })
    .join('/');

export const getPathRegex = (endpoint: Endpoint) => {
  const a = endpoint.servers
    .flatMap(s => {
      if (!s.basePath) return [];
      return [`/${pathToRegexStr(s.basePath)}`];
    })
    .join('|');
  const regex = new RegExp(
    `(?<=\\s|^)(${a})?/${pathToRegexStr(endpoint.pathParts)}(?=\\s|$)`,
  );
  return regex;
};

// Extracts an API path from a string.
export const extractPath = (str: string) => {
  const match = str.match(/\/\S*(?=\s|\?|$)/);
  if (!match || match[0].includes(' ')) return null;
  const path = match[0];
  return path;
};
