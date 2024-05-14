import { includes } from 'lodash-es';
import { DocEndpoint, Method, PathPart, Scheme, validSchemes } from '.';

export const mdCreateEndpoint = (method: Method, path: string): DocEndpoint => {
  const pathParts: DocEndpoint['pathParts'] = [];
  const queryParameters: DocEndpoint['queryParameters'] = [];
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

  const [beforeParams, params] = path.split('?');
  if (!beforeParams) throw new Error(`Invalid path: ${path}`);

  if (params) {
    for (const param of params.split('&')) {
      const [name, value] = param.split('=');
      if (!name || !value) throw new Error(`Invalid query parameter: ${param}`);
      queryParameters.push({ name, value });
    }
  }

  path = beforeParams;
  for (const s of path.split('/')) {
    switch (true) {
      case s.startsWith('{') && s.endsWith('}'):
      case s.startsWith('<') && s.endsWith('>'):
        pathParts.push({
          type: 'parameter',
          name: s.substring(1, s.length - 1),
        });
        break;
      case s.startsWith(':'):
        pathParts.push({
          type: 'parameter',
          name: s.substring(1, s.length - 1),
        });
      default:
        pathParts.push({ type: 'literal', value: s });
        break;
    }
  }

  return {
    method,
    pathParts,
    queryParameters,
    scheme,
    host,
  };
};
