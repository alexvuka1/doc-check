import * as core from '@actions/core';
import { readFile } from 'fs/promises';

export const run = async (): Promise<void> => {
  try {
    const oasPath = core.getInput('openapi-path', { required: true });
    const docPath = core.getInput('doc-path', { required: true });

    const oas = await readFile(oasPath, 'utf8');
    core.debug(oas);

    const doc = await readFile(docPath, 'utf8');
    core.debug(doc);

    core.setOutput('time', new Date().toTimeString());
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message);
  }
};
