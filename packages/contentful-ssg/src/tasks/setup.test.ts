import { RuntimeContext } from '../types.js';
import { setup } from './setup.js';

jest.mock('globby', () => ({globby: jest.fn().mockResolvedValue([])}));
jest.mock('ignore', () => jest.fn().mockReturnValue(false));
jest.mock('find-up', () => ({findUp: jest.fn().mockResolvedValue(false)}));
jest.mock('fs-extra', () => ({
  outputFile: jest.fn(),
  remove: jest.fn(),
}));
jest.mock('fs/promises', () => ({
  readFile: jest.fn().mockResolvedValue(''),
  readdir: jest.fn().mockResolvedValue([]).mockResolvedValueOnce([]),
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
