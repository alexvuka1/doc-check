import assert from 'assert';
import { FailOutput, OasRequestConfig } from './parsing';

const oasPathSegsToPath = (pathSegs: OasRequestConfig['pathSegs']) =>
  `/${pathSegs
    .map(p => {
      switch (p.type) {
        case 'literal':
          return p.value;
        case 'parameter':
          return `{${p.name}}`;
      }
    })
    .join('/')}`;

export type FormatOutputOptions = {
  oasPath: string;
  docPath: string;
};

export const formatOutput = (
  inconsistencies: FailOutput,
  options: FormatOutputOptions,
) => {
  if (inconsistencies.length === 0) {
    return `### ✅No inconsistencies found between the [OpenAPI Specification](${options.oasPath}) and the [Documentation](${options.docPath})!`;
  }

  const oasOnly = inconsistencies
    .flatMap(fail => {
      if (fail.type !== 'only-in-oas') return [];
      return [
        `- [ ] [\`${fail.requestConfig.method.toUpperCase()} ${oasPathSegsToPath(fail.requestConfig.pathSegs)}\`](${options.oasPath})`,
      ];
    })
    .join('\n\t');

  const oasOnlySection =
    oasOnly.length > 0
      ? `- ### 🟩Found in OpenAPI Specification, 🟥Not found in Documentation\n\t${oasOnly}`
      : '';

  const docOnly = inconsistencies
    .flatMap(fail => {
      if (fail.type !== 'only-in-doc') return [];
      return [
        `- [ ] [\`${fail.requestConfig.method.toUpperCase()} ${fail.requestConfig.originalPath}\`](${options.docPath}?plain=1#L${fail.requestConfig.line})`,
      ];
    })
    .join('\n\t');

  const docOnlySection =
    docOnly.length > 0
      ? `- ### 🟥Not found in OpenAPI Specification, 🟩Found in Documentation\n\t${docOnly}`
      : '';

  const matchesWithConflicts = inconsistencies
    .flatMap(i => {
      if (i.type !== 'match-with-conflicts') return [];
      const conflicts = [
        `- | Conflict type | OpenAPI Specification <br /> [\`${i.oasRequestConfig.method.toUpperCase()} ${oasPathSegsToPath(i.oasRequestConfig.pathSegs)}\`](${options.oasPath}) | Documentation <br /> [\`${i.docRequestConfig.method.toUpperCase()} ${i.docRequestConfig.originalPath}\`](${options.docPath}?plain=1#L${i.docRequestConfig.line}) |`,
        '| --- | --- | --- |',
        ...i.conflicts.map(c => {
          switch (c.type) {
            case 'method-mismatch':
              return `| Method mismatch | \`${i.oasRequestConfig.method.toUpperCase()}\` | \`${i.docRequestConfig.method.toUpperCase()}\` |`;
            case 'path-parameter-name-mismatch':
              const oasServerBasePath =
                (c.oasServerIndex
                  ? i.oasRequestConfig.servers[c.oasServerIndex]?.basePath
                  : null) ?? [];
              const oasFullPath = [
                ...oasServerBasePath,
                ...i.oasRequestConfig.pathSegs,
              ];
              const oasMismatchedParam = oasFullPath.flatMap(p =>
                p.type === 'parameter' ? [p.name] : [],
              )[c.parameterIndex];
              const docMismatchedParam = i.docRequestConfig.pathSegs.flatMap(
                p => (p.type === 'parameter' ? [p.name] : []),
              )[c.parameterIndex];
              assert(
                oasMismatchedParam,
                `No path parameter with index ${c.parameterIndex} in oas path`,
              );
              assert(
                docMismatchedParam,
                `No path parameter with index ${c.parameterIndex} in doc path`,
              );
              return `| Path parameter name mismatch | \`${oasMismatchedParam}\` | \`${docMismatchedParam}\` |`;
            case 'host-mismatch':
              throw new Error('Host mismatch not implemented');
            case 'doc-scheme-not-supported-by-oas-server':
              throw new Error(
                'Doc scheme not supported by oas server not implemented',
              );
          }
        }),
      ].join('\n\t\t');
      return conflicts;
    })
    .join('\n\t');

  const matchesWithConflictsSection =
    matchesWithConflicts.length > 0
      ? `- ### 🟩Found in OpenAPI Specification, 🟩Found in Documentation, 🟥Have Conflicts\n\t${matchesWithConflicts}`
      : '';

  return `\
The following possible instances of inconsistencies between [OpenAPI Specification](${options.oasPath}) and [Documentation](${options.docPath}) has been identified:

${oasOnlySection}
${docOnlySection}
${matchesWithConflictsSection}

**About**

This is part of the evaluation of my Master's Project at Imperial College London. The section above is automatically generated and aims to expose API documentation inconsistencies in real-world GitHub repositories. The end goal is for the tool to be used as part of CI/CD, namely as a GitHub action. 

Hopefully, this is a step towards easier maintenance of API documentation. If you find this helpful, please consider updating the documentation to keep it in sync with the source code. I am also happy to assist with it, if appropriate. If this has not been useful, consider updating this issue with an explanation, so I can improve my approach. Thank you!\
`;
};
