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
  queryParameters: { name: string; required: boolean }[];
};

export type DocEndpoint = BaseEndpoint & {
  originalPath: string;
  scheme?: Scheme;
  host?: string;
  queryParameters: { name: string; value: string }[];
  line: number;
};

export type Inconsistency =
  | {
      type: 'path-path-parameter-name-mismatch';
      parameterIndex: number;
      oasServerIndex: number | null;
    }
  | {
      type: 'method-mismatch';
    }
  | {
      type: 'host-mismatch';
      oasHost: OasEndpoint['servers'][number]['host'];
    }
  | {
      type: 'doc-scheme-not-supported-by-oas-server';
    };

export type OutputInconsistency =
  | {
      type: 'only-in-doc';
      endpoint: DocEndpoint;
    }
  | {
      type: 'only-in-oas';
      endpoint: OasEndpoint;
    }
  | {
      type: 'match-with-inconsistenties';
      oasEndpoint: OasEndpoint;
      docEndpoint: DocEndpoint;
      inconsistencies: Inconsistency[];
    };

export type FailOutput = OutputInconsistency[];
