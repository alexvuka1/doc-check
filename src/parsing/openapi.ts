import SwaggerParser from '@apidevtools/swagger-parser';
import { includes } from 'lodash-es';
import { OpenAPI, OpenAPIV2, OpenAPIV3 } from 'openapi-types';
import { objectEntries } from 'src/utils';
import { convertFile } from 'swagger2openapi';
import {
  OasDocument,
  OasRequestConfig,
  OasServerInfo,
  Scheme,
  methods,
  validSchemes,
} from '.';

const isV2 = (openapiDoc: OpenAPI.Document): openapiDoc is OpenAPIV2.Document =>
  !!(openapiDoc as Partial<Pick<OpenAPIV2.Document, 'swagger'>>).swagger;

const oasParseServers = (servers?: OasDocument['servers']) => {
  if (!servers) return [];
  return servers.map<OasServerInfo>(s => {
    // if (s.variables) throw new Error('Server variables not supported yet');
    try {
      const url = new URL(s.url);
      const protocol = url.protocol.replace(':', '');
      return {
        scheme: includes(validSchemes, protocol)
          ? (protocol as Scheme)
          : void 0,
        basePath: oasParsePath(url.pathname),
        host: url.host,
      };
    } catch (_) {
      const protocol = s.url.includes('://') ? s.url.split('://')[0] : void 0;
      return {
        scheme: includes(validSchemes, protocol)
          ? (protocol as Scheme)
          : void 0,
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
  const queryParameters: OasRequestConfig['queryParameters'] = [];
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

export const oasParsePath = (path?: string) => {
  const pathSegs: OasRequestConfig['pathSegs'] = [];
  if (!path) return pathSegs;
  if (!path.startsWith('/')) throw new Error('Path must start with /');
  path = path.substring(1);
  if (path === '') return pathSegs;
  for (const part of path.split('/')) {
    switch (true) {
      case part.startsWith('{') && part.endsWith('}'):
        pathSegs.push({
          type: 'parameter',
          name: part.substring(1, part.length - 1),
        });
        break;
      default:
        pathSegs.push({ type: 'literal', value: part });
        break;
    }
  }
  return pathSegs;
};

export const oasParseRequestConfigs = (oas: OasDocument) => {
  const oasIdToRequestConfig = new Map<string, OasRequestConfig>();
  if (!oas.paths) return oasIdToRequestConfig;
  const oasServers = oasParseServers(oas.servers);
  for (const [path, pathItem] of objectEntries(oas.paths)) {
    if (!pathItem) continue;
    for (const method of methods) {
      const requestConfigItem = pathItem[method];
      if (!requestConfigItem) continue;

      const pathSegs = oasParsePath(path);

      const servers = requestConfigItem.servers
        ? oasParseServers(requestConfigItem.servers)
        : pathItem.servers
          ? oasParseServers(pathItem.servers)
          : oasServers;

      const queryParameters = oasParseQueryParams(
        requestConfigItem.parameters ?? [],
      );

      oasIdToRequestConfig.set(`${method} ${path}`, {
        method,
        servers,
        pathSegs,
        queryParameters,
      });
    }
  }
  return oasIdToRequestConfig;
};

export const oasParse = async (oasPath: string, shouldDereference = true) => {
  // TODO changed this from validate, should maybe show warnings if oas not valid
  const oasDoc = shouldDereference
    ? await SwaggerParser.dereference(oasPath)
    : await SwaggerParser.bundle(oasPath);
  const oas = isV2(oasDoc) ? (await convertFile(oasPath, {})).openapi : oasDoc;
  return oas;
};

export const oasPathSegsToPath = (pathSegs: OasRequestConfig['pathSegs']) => {
  let path = '';
  for (const part of pathSegs) {
    switch (part.type) {
      case 'parameter':
        path += `/{${part.name}}`;
        break;
      case 'literal':
        path += `/${part.value}`;
        break;
    }
  }
  return path === '' ? '/' : path;
};
