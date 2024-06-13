import { capitalize, includes } from 'lodash-es';
import { Root } from 'mdast';
import { remark } from 'remark';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkSectionize from 'remark-sectionize';
import remarkStringify from 'remark-stringify';
import { read } from 'to-vfile';
import {
  DocRequestConfig,
  Method,
  OasRequestConfig,
  PathSeg,
  Scheme,
  validSchemes,
} from '.';

export const docCreateRequestConfig = (
  method: Method,
  originalPath: string,
  line: number,
): DocRequestConfig => {
  const pathSegs: DocRequestConfig['pathSegs'] = [];
  const queryParameters: DocRequestConfig['queryParameters'] = [];
  let scheme: DocRequestConfig['scheme'];
  let host: DocRequestConfig['host'];
  let path: string | undefined = originalPath;

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

  if (params) {
    for (const param of params.split('&')) {
      const [name, value] = param.split('=');
      queryParameters.push(
        name && value ? { name, value } : { name: 'raw', value: param },
      );
    }
  }

  path = beforeParams;
  for (const s of path?.split('/') ?? []) {
    switch (true) {
      case s.startsWith('{') && s.endsWith('}'):
      case s.startsWith('<') && s.endsWith('>'):
      case s.startsWith('[') && s.endsWith(']'):
        pathSegs.push({
          type: 'parameter',
          name: s.substring(1, s.length - 1),
        });
        break;
      case s.startsWith(':'):
        pathSegs.push({
          type: 'parameter',
          name: s.substring(1),
        });
        break;
      default:
        if (s !== '') pathSegs.push({ type: 'literal', value: s });
        break;
    }
  }

  return {
    originalPath,
    method,
    pathSegs,
    queryParameters,
    scheme,
    host,
    line,
  };
};

export const escapeRegexSpecial = (str: string) =>
  str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getMethodRegex = (
  matchMethods: Method[],
  options: Partial<{ onlyUppercase: true }> = {},
) => {
  const matchUnionStr = matchMethods
    .flatMap(m =>
      options.onlyUppercase
        ? [m.toUpperCase()]
        : [m, m.toUpperCase(), capitalize(m)],
    )
    .join('|');
  return new RegExp(`\\b(?<!\\/)(${matchUnionStr})(?!\\/)\\b`, 'g');
};

const pathSegsToRegexStr = (pathSegs: PathSeg[]) =>
  pathSegs
    .map(p => {
      switch (p.type) {
        case 'literal':
          return p.value;
        case 'parameter':
          return p.name.replace(/(.*)/, `(\\{$1\\}|<$1>|:$1|\\[$1\\])`);
      }
    })
    .join('/');

export const oasRequestConfigToDocRegex = (requestConfig: OasRequestConfig) => {
  const serverRegex = requestConfig.servers
    .flatMap(s => {
      const serverStart =
        s.scheme && s.host
          ? `(${s.scheme})?:\\/\\/${escapeRegexSpecial(s.host)}`
          : s.host
            ? `${escapeRegexSpecial(s.host)}`
            : '';
      const serverEnd = `\\/${s.basePath.map(p => escapeRegexSpecial(pathSegsToRegexStr([p]))).join('\\/')}`;
      const server =
        Boolean(serverStart) && Boolean(serverEnd)
          ? `((${serverStart})?${serverEnd})`
          : Boolean(serverEnd)
            ? `(${serverEnd})`
            : '';
      return server === '' ? [] : server;
    })
    .join('|');
  const regex = new RegExp(
    `(?<=\\s|^)(${serverRegex})?/${pathSegsToRegexStr(requestConfig.pathSegs)}/?(?=\\s|$)`,
  );
  return regex;
};

// Extracts an API path from a string.
export const extractPaths = (str: string) => {
  const optionalParamPatern = `\\[(\\/:\\w+)\\]`;
  const reg = new RegExp(
    `(?<=\\s|^)(((http[s]?|ws[s]?):\\/\\/)?([\\w\\-]+\\.)+\\w+)?((\\/([\\w\\-]+|:\\w+|\\{\\w+\\}|<\\w+>|\\[[\\w\\s]+\\])|${optionalParamPatern})+\\/?|\\/)(\\?.*)?(?=\\s|$)`,
    'g',
  );
  const match = str.match(reg);
  if (!match) return [];
  const res: string[] = [];
  for (const path of match) {
    const normalisedPath = path.endsWith('/') ? path.slice(0, -1) : path;
    if (!normalisedPath.includes('[/:')) {
      res.push(normalisedPath);
      continue;
    }
    const optionalParamRegex = new RegExp(optionalParamPatern);
    const path1 = normalisedPath.replace(optionalParamRegex, '');
    const path2 = normalisedPath.replace(optionalParamRegex, '$1');
    res.push(path1, path2);
  }
  return res;
};

export const docParse = async (docPath: string) => {
  const docFile = await read(docPath);
  const docAST = remark().use(remarkFrontmatter).use(remarkGfm).parse(docFile);
  const tree = remark().use(remarkSectionize).runSync(docAST) as Root;
  return tree;
};

export const docStringify = (tree: Root) =>
  remark()
    .use(remarkGfm)
    .use(remarkFrontmatter)
    .use(remarkStringify, {
      handlers: {
        section: (node, _, state, info) => state.containerFlow(node, info),
      },
    })
    .stringify(tree);
