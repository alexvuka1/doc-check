import { GetInputMock, SetFailedMock } from '..';

export type MutationTestEnv = {
  getInputMock: GetInputMock;
  setFailedMock: SetFailedMock;
  rng: () => number;
};
