import {remove} from 'fs-extra';
import {FileManager} from './file-manager.js';


jest.mock('globby', () => ({globby: jest.fn().mockResolvedValue(['/test/a.md', '/test/b.md', '/test2/a.md'])}));
jest.mock('ignore', () => jest.fn().mockReturnValue({add: jest.fn().mockReturnValue({})}));
jest.mock('find-up', () => ({findUp: jest.fn().mockResolvedValue('.gitignore')}));
jest.mock('fs-extra', () => ({
  outputFile: jest.fn(),
  remove: jest.fn(),
}));
jest.mock('fs/promises', () => ({
  readFile: jest.fn().mockResolvedValue(''),
  readdir: jest.fn().mockResolvedValue([]).mockResolvedValueOnce(['/test/b.md']),
}));

describe('FileManager', () => {
  test('initialize', async () => {
    const fileManager = new FileManager({directory: '/testbase'});
    await fileManager.initialize();

    expect(fileManager.files).toEqual(new Set(['/test/a.md', '/test/b.md', '/test2/a.md']));
  })

  test('writeFile', async () => {
    const fileManager = new FileManager({directory: '/testbase'});
    await fileManager.initialize();

    await fileManager.writeFile('/test/b.md','');
    await fileManager.writeFile('/test2/a.md','');
    expect(fileManager.files).toEqual(new Set(['/test/a.md']));

    fileManager.ignore.ignores = jest.fn().mockReturnValue(true);

  })

  test('count', async () => {
    const fileManager = new FileManager({directory: '/testbase'});
    await fileManager.initialize();

    fileManager.ignore.ignores = jest.fn().mockReturnValueOnce(true).mockReturnValue(false);
    expect(fileManager.count).toEqual(1);
  })

  test('ignoredFiles', async () => {
    const fileManager = new FileManager({directory: '/testbase'});
    await fileManager.initialize();

    fileManager.ignore.ignores = jest.fn().mockReturnValueOnce(false).mockReturnValue(true);
    const ignored = fileManager.ignoredFiles;
    expect(ignored).toEqual(['/test/b.md', '/test2/a.md']);
  })

  test('cleanup', async () => {
    const fileManager = new FileManager({directory: '/testbase'});
    await fileManager.initialize();

    fileManager.ignore.ignores = jest.fn().mockReturnValueOnce(true).mockReturnValueOnce(true).mockReturnValue(false);
    const result = await fileManager.cleanup();

    expect(Array.isArray(result)).toEqual(true);
    expect(result.length).toEqual(2);

    expect(remove).toHaveBeenCalledTimes(3);
    expect(remove).toHaveBeenNthCalledWith(1, '/test/a.md');
    expect(remove).toHaveBeenNthCalledWith(2, '/test/b.md');
    expect(remove).toHaveBeenNthCalledWith(3, '/test');
  })
});
