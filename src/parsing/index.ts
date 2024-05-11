import { OpenAPIV3 } from 'openapi-types';

export const methods: `${OpenAPIV3.HttpMethods}`[] = Object.values(
  OpenAPIV3.HttpMethods,
);
export const methodsSet = new Set(methods);
export type Method = (typeof methods)[number];

export const validSchemes = ['https', 'http', 'ws', 'wss'] as const;
export type Scheme = (typeof validSchemes)[number];

export type PathPart =
  | { type: 'literal'; value: string }
  | { type: 'parameter'; name: string };

export type Endpoint = {
  servers: ServerInfo[];
  pathParts: PathPart[];
  method: Method;
};

export type ServerInfo = Partial<{
  schemes: Scheme[];
  host: string;
  basePath: PathPart[];
}>;

export type OpenApiParsed = {
  endpoints: Endpoint[];
};

export type DocParsed = {
  endpoints: Endpoint[];
};

export type DocCheckErrors = {
  outdated: Endpoint[];
  notDocumented: Endpoint[];
};

// export const getNotDocumented = (
//   oasParsed: OpenApiParsed,
//   docParsed: DocParsed,
// ) => {
//   for (const oasServerInfo of oasParsed.serversInfo) {
//     for (const oasEndpoint of oasParsed.endpoints) {
//       for (const [i, docEndpoint] of docParsed.endpoints.entries()) {
//         for (const [j, docPathSegment] of docEndpoint.segments.entries()) {
//           if (
//             oasServerInfo.basePathSegments &&
//             j < oasServerInfo.basePathSegments.length
//           ) {
//           }
//           docEndpoint.segments;
//         }
//       }
//     }
//   }
// };
