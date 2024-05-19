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

export const formatOutput = (
  failOutput: FailOutput,
  options: { oasPath: string; docPath: string },
) => {
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
      ? `- [ ] Found in Open API specification, but missing in Documentation:\n\t${oasOnly}`
      : '';

  const docOnly = failOutput
    .flatMap(fail => {
      if (fail.type !== 'only-in-doc') return [];
      return [
        `- [ ] [\`${fail.endpoint.method.toUpperCase()} ${fail.endpoint.originalPath}\`](${options.docPath}#L${fail.endpoint.line})`,
      ];
    })
    .join('\n\t');

  const docOnlySection =
    docOnly.length > 0
      ? `- [ ] Found in Documentation, but missing in Open API specification:\n\t${docOnly}`
      : '';

  const matchesWithInconsistencies = failOutput
    .flatMap(fail => {
      if (fail.type !== 'match-with-inconsistenties') return [];
      const inconsistencies = fail.inconsistencies
        .map(i => {
          switch (i.type) {
            case 'method-mismatch':
              return `- [ ] Method mismatch [\`${fail.oasEndpoint.method.toUpperCase()}\`](${options.oasPath}) (Open API specification) - [\`${fail.docEndpoint.method.toUpperCase()}\`](${options.docPath}#L${fail.docEndpoint.line}) (Documentation)`;
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
              assert(oasMismatchedParam);
              assert(docMismatchedParam);
              return `- [ ] Path parameter mismatch [\`${oasMismatchedParam}\`](${options.oasPath}) (Open API specification) - [\`${docMismatchedParam}\`](${options.docPath}#L${fail.docEndpoint.line}) (Documentation)`;
            case 'host-mismatch':
              return '';
            case 'doc-scheme-not-supported-by-oas-server':
              return '';
          }
        })
        .join('\n\t');
      return `- [ ] Inconsistencies between [\`${fail.oasEndpoint.method.toUpperCase()} ${oasPathPartsToPath(fail.oasEndpoint.pathParts)}\`](${options.oasPath}) (Open API specification) [\`${fail.docEndpoint.method.toUpperCase()} ${fail.docEndpoint.originalPath}\`](${options.docPath}#L${fail.docEndpoint.line}) (Documentation)\n\t${inconsistencies}`;
    })
    .join('\n');

  return `
I have identified the following possible instances of documentation inconsistencies:

${oasOnlySection}
${docOnlySection}
${matchesWithInconsistencies}

**About**

This is part of a research project that aims to detect API documentation inconsistencies in GitHub repositories automatically. I am evaluating the validity of the approach by identifying such inconsistencies in real-world repositories. 

Hopefully, this is a step towards easier maintenance of API documentation. If you find this helpful, please consider updating the documentation to keep it in sync with the source code. I am also happy to assist with it, if appropriate. If this has not been useful, consider updating this issue with an explanation, so I can improve my approach. Thank you!
    `;
};
