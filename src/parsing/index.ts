import { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';

export const methods: `${OpenAPIV3.HttpMethods}`[] = Object.values(
  OpenAPIV3.HttpMethods,
);
export type Method = (typeof methods)[number];

export const validSchemes = ['https', 'http', 'ws', 'wss'] as const;
export type Scheme = (typeof validSchemes)[number];

export type PathSeg =
  | { type: 'literal'; value: string }
  | { type: 'parameter'; name: string };

export type BaseRequestConfig = {
  pathSegs: PathSeg[];
  method: Method;
};

export type OasDocument = OpenAPIV3.Document | OpenAPIV3_1.Document;

export type OasServerInfo = {
  scheme?: Scheme | undefined;
  host?: string | undefined;
  basePath: PathSeg[];
};

type OasQueryParam = {
  name: string;
  required: boolean;
};

export type OasRequestConfig = BaseRequestConfig & {
  servers: OasServerInfo[];
  queryParameters: OasQueryParam[];
};

export type DocRequestConfig = BaseRequestConfig & {
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
      oasHost: OasRequestConfig['servers'][number]['host'];
    }
  | {
      type: 'doc-scheme-not-supported-by-oas-server';
    };

export type OutputInconsistency =
  | {
      type: 'only-in-doc';
      requestConfig: DocRequestConfig;
    }
  | {
      type: 'only-in-oas';
      requestConfig: OasRequestConfig;
    }
  | {
      type: 'match-with-inconsistenties';
      oasRequestConfig: OasRequestConfig;
      docRequestConfig: DocRequestConfig;
      inconsistencies: Inconsistency[];
    };

export type FailOutput = OutputInconsistency[];
