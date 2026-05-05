import { vi } from 'vitest';
import { remove } from 'fs-extra';
import { FileManager } from './file-manager.js';

vi.mock('globby', () => ({
  globby: vi.fn().mockResolvedValue(['/test/a.md', '/test/b.md', '/test2/a.md']),
}));
vi.mock('ignore', () => ({
  default: vi.fn().mockReturnValue({ add: vi.fn().mockReturnValue({}) }),
}));
vi.mock('find-up', () => ({ findUp: vi.fn().mockResolvedValue('.gitignore') }));
vi.mock('fs-extra', () => ({
  outputFile: vi.fn(),
  remove: vi.fn(),
}));
vi.mock('fs/promises', () => ({
  lstat: vi.fn().mockResolvedValue({
    isDirectory: vi
      .fn()
      .mockReturnValue(false)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true),
  }),
  readFile: vi.fn().mockResolvedValue(''),
  readdir: vi.fn().mockResolvedValue([]).mockResolvedValueOnce(['/test']),
}));

describe('FileManager', () => {
  test('initialize', async () => {
    const fileManager = new FileManager({ directory: '/testbase' });
    await fileManager.initialize();

    expect(fileManager.files).toEqual(new Set(['/test/a.md', '/test/b.md', '/test2/a.md']));
  });

  test('writeFile', async () => {
    const fileManager = new FileManager({ directory: '/testbase' });
    await fileManager.initialize();

    await fileManager.writeFile('/test/b.md', '');
    await fileManager.writeFile('/test2/a.md', '');
    expect(fileManager.files).toEqual(new Set(['/test/a.md']));

    fileManager.ignore.ignores = vi.fn().mockReturnValue(true);
  });

  test('count', async () => {
    const fileManager = new FileManager({ directory: '/testbase' });
    await fileManager.initialize();

    fileManager.ignore.ignores = vi.fn().mockReturnValueOnce(true).mockReturnValue(false);
    expect(fileManager.count).toEqual(1);
  });

  test('ignoredFiles', async () => {
    const fileManager = new FileManager({ directory: '/testbase' });
    await fileManager.initialize();

    fileManager.ignore.ignores = vi.fn().mockReturnValueOnce(false).mockReturnValue(true);
    const ignored = fileManager.ignoredFiles;
    expect(ignored).toEqual(['/test/b.md', '/test2/a.md']);
  });

  test('cleanup', async () => {
    const fileManager = new FileManager({ directory: '/testbase' });
    await fileManager.initialize();

    fileManager.ignore.ignores = vi
      .fn()
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true)
      .mockReturnValue(false);

    const result = await fileManager.cleanup();
    expect(result).toEqual(true);

    expect(remove).toHaveBeenNthCalledWith(1, '/test/a.md');
    expect(remove).toHaveBeenNthCalledWith(2, '/test/b.md');
    expect(remove).toHaveBeenNthCalledWith(3, '/testbase/test');
    expect(remove).toHaveBeenCalledTimes(3);
  });
});
