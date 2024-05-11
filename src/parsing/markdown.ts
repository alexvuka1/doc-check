import { includes } from 'lodash-es';
import {
  Endpoint,
  Method,
  PathPart,
  Scheme,
  ServerInfo,
  validSchemes,
} from '.';

export const mdCreateEndpoint = (method: Method, path: string): Endpoint => {
  const pathParts: PathPart[] = [];
  const server: ServerInfo = {};
  const protocolSeparator = '://';
  if (path.includes(protocolSeparator)) {
    const [protocol, rest] = path.split(protocolSeparator);
    if (includes(validSchemes, protocol)) server.schemes = [protocol as Scheme];
    path = rest;
  }
  if (path.includes('.')) {
    const hostEnd = path.indexOf('/');
    server.host = path.substring(0, hostEnd);
    path = path.substring(hostEnd);
  }
  if (path.startsWith('/')) path = path.substring(1);
  pathParts.push(
    ...path.split('/').map<PathPart>(s => {
      if (s.startsWith('{') && s.endsWith('}')) {
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
    servers: [server],
  };
};
