import * as main from '../src/main';
import { expect, test, spyOn } from 'bun:test';

// Mock the action's entrypoint
const runMock = spyOn(main, 'run');

// Unit test for the action's entrypoint, src/index.ts
test('index', async () => {
  await import('../src/index');

  expect(runMock).toHaveBeenCalled();
});
