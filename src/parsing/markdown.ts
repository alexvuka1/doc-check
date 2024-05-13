import { includes } from 'lodash-es';
import { DocEndpoint, Method, PathPart, Scheme, validSchemes } from '.';

export const mdCreateEndpoint = (method: Method, path: string): DocEndpoint => {
  const pathParts: PathPart[] = [];
  let scheme: DocEndpoint['scheme'];
  let host: DocEndpoint['host'];
  const protocolSeparator = '://';
  if (path.includes(protocolSeparator)) {
    const [protocol, rest] = path.split(protocolSeparator);
    if (!rest) throw new Error(`Invalid path: ${path}`);
    if (includes(validSchemes, protocol)) scheme = protocol as Scheme;
    path = rest;
  }
  if (path.includes('.')) {
    const hostEnd = path.indexOf('/');
    host = path.substring(0, hostEnd);
    path = path.substring(hostEnd);
  }
  if (path.startsWith('/')) path = path.substring(1);
  pathParts.push(
    ...path.split('/').map<PathPart>(s => {
      if (
        (s.startsWith('{') && s.endsWith('}')) ||
        (s.startsWith('<') && s.endsWith('>'))
      ) {
        return {
          type: 'parameter',
          name: s.substring(1, s.length - 1),
        };
      }
      if (s.startsWith(':')) {
        return {
          type: 'parameter',
          name: s.substring(1),
        };
      }
      return { type: 'literal', value: s };
    }),
  );
  return {
    method,
    pathParts,
    scheme,
    host,
  };
};
