import { includes, reduce } from 'lodash-es';
import { Root } from 'mdast';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkSectionize from 'remark-sectionize';
import { read } from 'to-vfile';
import {
  DocEndpoint,
  Method,
  OasEndpoint,
  PathPart,
  Scheme,
  validSchemes,
} from '.';
import remarkStringify from 'remark-stringify';
import remarkFrontmatter from 'remark-frontmatter';

export const docCreateEndpoint = (
  method: Method,
  originalPath: string,
  line: number,
): DocEndpoint => {
  const pathParts: DocEndpoint['pathParts'] = [];
  const queryParameters: DocEndpoint['queryParameters'] = [];
  let scheme: DocEndpoint['scheme'];
  let host: DocEndpoint['host'];
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
      if (!name || !value) throw new Error(`Invalid query parameter: ${param}`);
      queryParameters.push({ name, value });
    }
  }

  path = beforeParams;
  for (const s of path?.split('/') ?? []) {
    switch (true) {
      case s.startsWith('{') && s.endsWith('}'):
      case s.startsWith('<') && s.endsWith('>'):
      case s.startsWith('[') && s.endsWith(']'):
        pathParts.push({
          type: 'parameter',
          name: s.substring(1, s.length - 1),
        });
        break;
      case s.startsWith(':'):
        pathParts.push({
          type: 'parameter',
          name: s.substring(1),
        });
        break;
      default:
        if (s !== '') pathParts.push({ type: 'literal', value: s });
        break;
    }
  }

  return {
    originalPath,
    method,
    pathParts,
    queryParameters,
    scheme,
    host,
    line,
  };
};

export const escapeRegexSpecial = (str: string) =>
  str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getMethodRegex = (matchMethods: Method[]) => {
  const matchUnionStr = matchMethods
    .flatMap(m => [m, m.toUpperCase()])
    .join('|');
  return new RegExp(`\\b(?<!\\/)(${matchUnionStr})(?!\\/)\\b`);
};

const pathPartsToRegexStr = (pathParts: PathPart[]) =>
  pathParts
    .map(p => {
      switch (p.type) {
        case 'literal':
          return p.value;
        case 'parameter':
          return p.name.replace(/(.*)/, `(\\{$1\\}|<$1>|:$1|\\[$1\\])`);
      }
    })
    .join('/');

export const oasEndpointToDocRegex = (endpoint: OasEndpoint) => {
  const serverRegex = endpoint.servers
    .flatMap(s => {
      const serverStart =
        s.schemes && s.host
          ? `(${s.schemes.join('|')}):\\/\\/${escapeRegexSpecial(s.host)}`
          : '';
      const serverEnd = s.basePath
        ? reduce(
            s.basePath,
            (acc, p, i, ps) => {
              const regexStr = escapeRegexSpecial(pathPartsToRegexStr([p]));
              return acc === ''
                ? `(/${regexStr})?`
                : `(${acc}/${regexStr})${i === ps.length - 1 ? '' : '?'}`;
            },
            '',
          )
        : '';
      const server =
        Boolean(serverStart) && Boolean(serverEnd)
          ? `((${serverStart})?${serverEnd})`
          : Boolean(serverStart)
            ? `((${serverStart})?)`
            : serverEnd;
      return server === '' ? [] : server;
    })
    .join('|');
  const regex = new RegExp(
    `(?<=\\s|^)(${serverRegex})?/${pathPartsToRegexStr(endpoint.pathParts)}(?=\\s|$)`,
  );
  return regex;
};

// Extracts an API path from a string.
export const extractPath = (str: string) => {
  const match = str.match(
    /(?<=\s|^)((http[s]?|ws[s]?):)?(\/([\w\-]*|:\w+|\{\w+\}|<(\w)+>|\[(\w|\s)+\]))+(?=\s|$)/,
  );
  if (!match) return null;
  const path = match[0];
  return path;
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
