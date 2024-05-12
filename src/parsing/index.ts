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

export type BaseEndpoint = {
  pathParts: PathPart[];
  method: Method;
};

export type OasServerInfo = Partial<{
  schemes: Scheme[];
  host: string;
  basePath: PathPart[];
}>;

export type OasEndpoint = BaseEndpoint & {
  servers: OasServerInfo[];
};

export type DocEndpoint = BaseEndpoint & {
  scheme?: Scheme;
  host?: string;
};

export type DocCheckErrors = {
  oasOnly: OasEndpoint[];
  docOnly: DocEndpoint[];
};
