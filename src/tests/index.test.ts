import { expect, spyOn, test } from 'bun:test';
import * as main from '../main';

// Mock the action's entrypoint
const runMock = spyOn(main, 'run');

// Unit test for the action's entrypoint, src/index.ts
test('index', async () => {
  await import('../index');

  expect(runMock).toHaveBeenCalled();
});
