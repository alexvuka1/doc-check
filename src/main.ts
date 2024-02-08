import * as core from '@actions/core';

export const run = async (): Promise<void> => {
  try {
    const str = core.getInput('str', { required: true });
    core.debug(`Hello ${str}`);
    core.setOutput('time', new Date().toTimeString());
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message);
  }
};
