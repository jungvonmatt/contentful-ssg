import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';

const createFakes = vi.fn();
const outputFile = vi.fn();
const confirm = vi.fn();
const stringify = vi.fn();

vi.mock('./index.js', () => ({
  createFakes: (...args: unknown[]) => createFakes(...args),
}));

vi.mock('fs-extra', () => ({
  outputFile: (...args: unknown[]) => outputFile(...args),
}));

vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(false),
}));

vi.mock('@jungvonmatt/contentful-ssg/converter', () => ({
  stringify: (...args: unknown[]) => stringify(...args),
}));

vi.mock('@jungvonmatt/contentful-ssg/lib/array', () => ({
  forEachAsync: async (
    items: [string, unknown][],
    fn: (item: [string, unknown]) => Promise<void>,
  ) => {
    for (const item of items) {
      await fn(item);
    }
  },
}));

vi.mock('@jungvonmatt/contentful-ssg/lib/ui', () => ({
  confirm: (...args: unknown[]) => confirm(...args),
  logError: vi.fn(),
}));

vi.mock('exit-hook', () => ({
  gracefulExit: vi.fn(),
}));

describe('contentful-fakes CLI', () => {
  let originalArgv: string[];
  let consoleLog: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    originalArgv = process.argv;
    consoleLog = vi.fn();
    vi.spyOn(console, 'log').mockImplementation(consoleLog);
    vi.resetModules();
    createFakes.mockReset();
    outputFile.mockReset();
    confirm.mockReset();
    stringify.mockReset();
  });

  afterEach(() => {
    process.argv = originalArgv;
    vi.restoreAllMocks();
  });

  test('create command generates fake files', async () => {
    createFakes.mockResolvedValue({
      page: [{ title: 'Fake Page' }],
    });
    stringify.mockReturnValue('title: Fake Page\n');
    outputFile.mockResolvedValue(undefined);

    process.argv = ['node', 'cli', 'create', '--content-type', 'page', '--yes'];
    await import('./cli.js');
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(createFakes).toHaveBeenCalledWith(['page'], undefined, undefined);
    expect(outputFile).toHaveBeenCalledWith(
      expect.stringContaining('page/default.yaml'),
      'title: Fake Page\n',
    );
  });

  test('create command uses custom extension', async () => {
    createFakes.mockResolvedValue({
      page: [{ title: 'Fake Page' }],
    });
    stringify.mockReturnValue('{"title":"Fake Page"}');
    outputFile.mockResolvedValue(undefined);

    process.argv = [
      'node',
      'cli',
      'create',
      '--content-type',
      'page',
      '--extension',
      'json',
      '--yes',
    ];
    await import('./cli.js');
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(stringify).toHaveBeenCalledWith({ title: 'Fake Page' }, 'json');
    expect(outputFile).toHaveBeenCalledWith(
      expect.stringContaining('default.json'),
      '{"title":"Fake Page"}',
    );
  });

  test('create command uses custom output directory', async () => {
    createFakes.mockResolvedValue({
      page: [{ title: 'Fake Page' }],
    });
    stringify.mockReturnValue('content');
    outputFile.mockResolvedValue(undefined);

    process.argv = [
      'node',
      'cli',
      'create',
      '--content-type',
      'page',
      '--output-directory',
      'output',
      '--yes',
    ];
    await import('./cli.js');
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(outputFile).toHaveBeenCalledWith(
      expect.stringContaining('output/page/default.yaml'),
      'content',
    );
  });

  test('create command logs message when no fakes generated', async () => {
    createFakes.mockResolvedValue({});

    process.argv = ['node', 'cli', 'create', '--content-type', 'unknown'];
    await import('./cli.js');
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(consoleLog).toHaveBeenCalledWith('No files generated.');
  });

  test('create command handles errors gracefully', async () => {
    const { gracefulExit } = await import('exit-hook');
    createFakes.mockRejectedValue(new Error('API Error'));

    process.argv = ['node', 'cli', 'create', '--content-type', 'page'];
    await import('./cli.js');
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(gracefulExit).toHaveBeenCalledWith(1);
  });
});
