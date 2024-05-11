import { OpenAPIV3 } from 'openapi-types';

export const methods: `${OpenAPIV3.HttpMethods}`[] = Object.values(
  OpenAPIV3.HttpMethods,
);
export type Method = (typeof methods)[number];

export const validSchemes = ['https', 'http', 'ws', 'wss'] as const;
export type Scheme = (typeof validSchemes)[number];

export type PathPart =
  | { type: 'literal'; value: string }
  | { type: 'parameter'; name: string };

export type OasServerInfo = Partial<{
  schemes: Scheme[];
  host: string;
  basePath: PathPart[];
}>;

export type OasEndpoint = {
  servers: OasServerInfo[];
  pathParts: PathPart[];
  method: Method;
};

export type DocEndpoint = {
  scheme?: Scheme;
  host?: string;
  pathParts: PathPart[];
  method: Method;
};

export type DocCheckErrors = {
  notDocumented: OasEndpoint[];
  outdated: DocEndpoint[];
};
