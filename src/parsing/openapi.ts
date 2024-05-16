import { includes } from 'lodash-es';
import { OpenAPI, OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import { objectEntries } from 'src/utils';
import { OasEndpoint, OasServerInfo, Scheme, methods, validSchemes } from '.';

export const isV2 = (
  openapiDoc: OpenAPI.Document,
): openapiDoc is OpenAPIV2.Document =>
  !!(openapiDoc as Partial<Pick<OpenAPIV2.Document, 'swagger'>>).swagger;

const oasParseServers = (
  servers?: OpenAPIV3.ServerObject[] | OpenAPIV3_1.ServerObject[],
) => {
  if (!servers) return [];
  return servers.map<OasServerInfo>(s => {
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
        basePath: oasParsePath(s.url.match(/(?<!\/)\/.+/g)?.[0]),
        host: s.url.match(/(?<=\/\/)(.*?)(?=\/|$)/g)?.[0] ?? void 0,
      };
    }
  });
};

const isRefObject = (
  obj: OpenAPI.Parameter,
): obj is OpenAPIV3.ReferenceObject => Object.hasOwn(obj, '$ref');

const oasParseQueryParams = (parameters: OpenAPI.Parameters) => {
  const queryParameters: OasEndpoint['queryParameters'] = [];
  for (const p of parameters) {
    if (isRefObject(p)) {
      throw new Error('Parameters should have been dereferenced');
    }
    if (p.in !== 'query') continue;
    queryParameters.push({
      name: p.name,
      required: p.required ?? false,
    });
  }
  return queryParameters;
};

const oasParsePath = (path?: string) => {
  const pathParts: OasEndpoint['pathParts'] = [];
  if (!path) return pathParts;
  if (!path.startsWith('/')) throw new Error('Path must start with /');
  path = path.substring(1);
  if (path === '') return pathParts;
  for (const part of path.split('/')) {
    switch (true) {
      case part.startsWith('{') && part.endsWith('}'):
        pathParts.push({
          type: 'parameter',
          name: part.substring(1, part.length - 1),
        });
        break;
      default:
        pathParts.push({ type: 'literal', value: part });
        break;
    }
  }
  return pathParts;
};

export const oasParseEndpoints = (
  oas: OpenAPIV3.Document | OpenAPIV3_1.Document,
) => {
  const oasIdToEndpoint = new Map<string, OasEndpoint>();
  if (!oas.paths) return oasIdToEndpoint;
  const oasServers = oasParseServers(oas.servers);
  for (const [path, pathItem] of objectEntries(oas.paths)) {
    if (!pathItem) continue;
    for (const method of methods) {
      const operation = pathItem[method];
      if (!operation) continue;

      const pathParts = oasParsePath(path);

      const servers = operation.servers
        ? oasParseServers(operation.servers)
        : pathItem.servers
          ? oasParseServers(pathItem.servers)
          : oasServers;

      const queryParameters = oasParseQueryParams(operation.parameters ?? []);

      oasIdToEndpoint.set(`${method} ${path}`, {
        method,
        servers,
        pathParts,
        queryParameters,
      });
    }
  }
  return oasIdToEndpoint;
};
