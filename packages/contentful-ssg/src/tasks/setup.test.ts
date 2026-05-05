import { vi } from 'vitest';
import { RuntimeContext } from '../types.js';
import { setup } from './setup.js';

vi.mock('globby', () => ({ globby: vi.fn().mockResolvedValue([]) }));
vi.mock('ignore', () => ({ default: vi.fn().mockReturnValue(false) }));
vi.mock('find-up', () => ({ findUp: vi.fn().mockResolvedValue(false) }));
vi.mock('fs-extra', () => ({
  outputFile: vi.fn(),
  remove: vi.fn(),
}));
vi.mock('fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue(''),
  readdir: vi.fn().mockResolvedValue([]).mockResolvedValueOnce([]),
}));

describe('transform', () => {
  test('runs transform task', async () => {
    const context = {} as RuntimeContext;
    await setup(context, { directory: process.cwd() });

    expect(Object.keys(context)).toEqual([
      'config',
      'fileManager',
      'stats',
      'hooks',
      'converter',
      'helper',
    ]);

    expect(Object.keys(context.converter)).toEqual(['json', 'markdown', 'yaml', 'toml']);
    expect(Object.keys(context.helper)).toEqual(['array', 'object']);
  });
});