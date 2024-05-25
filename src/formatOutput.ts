import assert from 'assert';
import { FailOutput, OasEndpoint } from './parsing';

const oasPathPartsToPath = (pathParts: OasEndpoint['pathParts']) =>
  `/${pathParts
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
  failOutput: FailOutput,
  options: FormatOutputOptions,
) => {
  if (failOutput.length === 0) {
    return '### ✅No inconsistencies found between Open API specifiaction and Documentation!';
  }

  const oasOnly = failOutput
    .flatMap(fail => {
      if (fail.type !== 'only-in-oas') return [];
      return [
        `- [ ] [\`${fail.endpoint.method.toUpperCase()} ${oasPathPartsToPath(fail.endpoint.pathParts)}\`](${options.oasPath})`,
      ];
    })
    .join('\n\t');

  const oasOnlySection =
    oasOnly.length > 0
      ? `- ### 🟩Found in Open API specification, 🟥Not found in Documentation\n\t${oasOnly}`
      : '';

  const docOnly = failOutput
    .flatMap(fail => {
      if (fail.type !== 'only-in-doc') return [];
      return [
        `- [ ] [\`${fail.endpoint.method.toUpperCase()} ${fail.endpoint.originalPath}\`](${options.docPath}?plain=1#L${fail.endpoint.line})`,
      ];
    })
    .join('\n\t');

  const docOnlySection =
    docOnly.length > 0
      ? `- ### 🟥Not found in Open API specification, 🟩Found in Documentation\n\t${docOnly}`
      : '';

  const matchesWithInconsistencies = failOutput
    .flatMap(fail => {
      if (fail.type !== 'match-with-inconsistenties') return [];
      const inconsistencies = [
        `- | Inconsistency type | Open API specification <br /> [\`${fail.oasEndpoint.method.toUpperCase()} ${oasPathPartsToPath(fail.oasEndpoint.pathParts)}\`](${options.oasPath}) | Documentation <br /> [\`${fail.docEndpoint.method.toUpperCase()} ${fail.docEndpoint.originalPath}\`](${options.docPath}?plain=1#L${fail.docEndpoint.line}) |`,
        '| --- | --- | --- |',
        ...fail.inconsistencies.map(i => {
          switch (i.type) {
            case 'method-mismatch':
              return `| Method mismatch | \`${fail.oasEndpoint.method.toUpperCase()}\` | \`${fail.docEndpoint.method.toUpperCase()}\` |`;
            case 'path-path-parameter-name-mismatch':
              const oasServerBasePath =
                (i.oasServerIndex
                  ? fail.oasEndpoint.servers[i.oasServerIndex]?.basePath
                  : null) ?? [];
              const oasFullPath = [
                ...oasServerBasePath,
                ...fail.oasEndpoint.pathParts,
              ];
              const oasMismatchedParam = oasFullPath.flatMap(p =>
                p.type === 'parameter' ? [p.name] : [],
              )[i.parameterIndex];
              const docMismatchedParam = fail.docEndpoint.pathParts.flatMap(
                p => (p.type === 'parameter' ? [p.name] : []),
              )[i.parameterIndex];
              assert(
                oasMismatchedParam,
                `No path parameter with index ${i.parameterIndex} in oas path`,
              );
              assert(
                docMismatchedParam,
                `No path parameter with index ${i.parameterIndex} in doc path`,
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
      return inconsistencies;
    })
    .join('\n\t');

  const matchesWithInconsistenciesSection =
    matchesWithInconsistencies.length > 0
      ? `- ### 🟩Found in Open API specification, 🟩Found in Documentation, 🟥Have Inconsistencies\n\t${matchesWithInconsistencies}`
      : '';

  return `
I have identified the following possible instances of inconsistencies between [Open API specification](${options.oasPath}) and [Documentation](${options.docPath}):

${oasOnlySection}
${docOnlySection}
${matchesWithInconsistenciesSection}

**About**

This is part of the evaluation of my Master's Project at Imperial College London. It aims to detect API documentation inconsistencies in GitHub repositories automatically. I am evaluating the validity of the approach by identifying such inconsistencies in real-world repositories. 

Hopefully, this is a step towards easier maintenance of API documentation. If you find this helpful, please consider updating the documentation to keep it in sync with the source code. I am also happy to assist with it, if appropriate. If this has not been useful, consider updating this issue with an explanation, so I can improve my approach. Thank you!
    `;
};
