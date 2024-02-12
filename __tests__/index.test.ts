/**
 * Unit tests for the action's entrypoint, src/index.ts
 */

import * as main from '../src/main';
import { expect, test, spyOn } from 'bun:test';

// Mock the action's entrypoint
const runMock = spyOn(main, 'run');

test('index', async () => {
  await import('../src/index');

  expect(runMock).toHaveBeenCalled();
});
