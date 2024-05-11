import { includes } from 'lodash-es';
import { OpenAPI, OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import { PathPart, Scheme, ServerInfo, validSchemes } from '.';

export const isV2 = (
  openapiDoc: OpenAPI.Document,
): openapiDoc is OpenAPIV2.Document =>
  !!(openapiDoc as Partial<Pick<OpenAPIV2.Document, 'swagger'>>).swagger;

export const getServersInfo = (
  servers?: OpenAPIV3.ServerObject[] | OpenAPIV3_1.ServerObject[],
) => {
  if (!servers) return [];
  return servers.map<ServerInfo>(s => {
    if (s.variables) throw new Error('Server variables not supported yet');
    try {
      const url = new URL(s.url);
      const protocol = url.protocol.replace(':', '');
      return {
        schemes: includes(validSchemes, protocol)
          ? [protocol as Scheme]
          : void 0,
        basePath: oasParsePath(url.pathname),
        host: url.host,
      };
    } catch (_) {
      return {
        basePath: oasParsePath(s.url.match(/(?<!\/)\/\w+/g)?.[0]),
        host: s.url.match(/(?<=\/\/)(.*?)(?=\/|$)/g)?.[0] ?? void 0,
      };
    }
  });
};

export const oasParsePath = (path?: string) => {
  if (!path) return [];
  if (!path.startsWith('/')) throw new Error('Path must start with /');
  path = path.substring(1);
  if (path === '') return [];
  return path.split('/').map<PathPart>(s =>
    s.startsWith('{') && s.endsWith('}')
      ? {
          type: 'parameter',
          name: s.substring(1, s.length - 1),
        }
      : { type: 'literal', value: s },
  );
};
