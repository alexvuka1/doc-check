import * as main from '../main';
import { expect, test, spyOn } from 'bun:test';

// Mock the action's entrypoint
const runMock = spyOn(main, 'run');

// Unit test for the action's entrypoint, src/index.ts
test('index', async () => {
  await import('../index');

  expect(runMock).toHaveBeenCalled();
});
