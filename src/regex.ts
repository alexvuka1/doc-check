import { Method, OasEndpoint, PathPart } from './parsing';

export const escapeRegexSpecial = (str: string) =>
  str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getMethodRegex = (matchMethods: Method[]) => {
  const matchUnionStr = matchMethods
    .flatMap(m => [m, m.toUpperCase()])
    .join('|');
  return new RegExp(`\\b(?<!\\/)(${matchUnionStr})(?!\\/)\\b`);
};

const pathPartsToRegexStr = (pathParts: PathPart[]) =>
  pathParts
    .map(p => {
      switch (p.type) {
        case 'literal':
          return p.value;
        case 'parameter':
          return p.name.replace(/(.*)/, `(\\{$1\\}|<$1>|:$1)`);
      }
    })
    .join('/');

export const oasGetEndpointRegex = (endpoint: OasEndpoint) => {
  const serverRegex = endpoint.servers
    .flatMap(s => {
      const serverStart =
        s.schemes && s.host
          ? `(${s.schemes.join('|')}):\\/\\/${escapeRegexSpecial(s.host)}`
          : '';
      const serverEnd = s.basePath ? pathPartsToRegexStr(s.basePath) : '';
      const server =
        Boolean(serverStart) && Boolean(serverEnd)
          ? `((${serverStart})?(/${serverEnd}))`
          : Boolean(serverStart)
            ? `((${serverStart})?)`
            : `(/${serverEnd})`;
      return server === '' ? [] : server;
    })
    .join('|');
  const regex = new RegExp(
    `(?<=\\s|^)(${serverRegex})?/${pathPartsToRegexStr(endpoint.pathParts)}(?=\\s|$)`,
  );
  return regex;
};

// Extracts an API path from a string.
export const extractPath = (str: string) => {
  const match = str.match(/(?<=\s|^)((http[s]?|ws[s]?):)?\/\S*(?=\s|$)/);
  if (!match || match[0].includes(' ')) return null;
  const path = match[0];
  return path;
};
