import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';

const generateTypings = vi.fn();
const outputFile = vi.fn();

vi.mock('./index.js', () => ({
  generateTypings: (...args: unknown[]) => generateTypings(...args),
}));

vi.mock('fs-extra', () => ({
  outputFile: (...args: unknown[]) => outputFile(...args),
}));

vi.mock('@jungvonmatt/contentful-ssg/lib/ui', () => ({
  logError: vi.fn(),
}));

vi.mock('exit-hook', () => ({
  gracefulExit: vi.fn(),
}));

describe('contentful-typings CLI', () => {
  let originalArgv: string[];
  let consoleLog: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    originalArgv = process.argv;
    consoleLog = vi.fn();
    vi.spyOn(console, 'log').mockImplementation(consoleLog);
    vi.resetModules();
    generateTypings.mockReset();
    outputFile.mockReset();
  });

  afterEach(() => {
    process.argv = originalArgv;
    vi.restoreAllMocks();
  });

  test('generate command calls generateTypings and writes output', async () => {
    generateTypings.mockResolvedValue('// generated types\nexport type Page = {};');
    outputFile.mockResolvedValue(undefined);

    process.argv = ['node', 'cli', 'generate', '--output', 'types.ts'];

    await import('./cli.js');
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(generateTypings).toHaveBeenCalledWith(
      expect.objectContaining({
        typeguard: undefined,
        jsdoc: undefined,
        localized: undefined,
      }),
    );
    expect(outputFile).toHaveBeenCalledWith(
      'types.ts',
      '// generated types\nexport type Page = {};',
    );
    expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('types.ts'));
  });

  test('generate uses default output path', async () => {
    generateTypings.mockResolvedValue('// types');
    outputFile.mockResolvedValue(undefined);

    process.argv = ['node', 'cli', 'generate'];
    await import('./cli.js');
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(outputFile).toHaveBeenCalledWith('@types/contentful.ts', '// types');
  });

  test('generate passes --typeguard flag', async () => {
    generateTypings.mockResolvedValue('// types');
    outputFile.mockResolvedValue(undefined);

    process.argv = ['node', 'cli', 'generate', '--typeguard'];
    await import('./cli.js');
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(generateTypings).toHaveBeenCalledWith(expect.objectContaining({ typeguard: true }));
  });

  test('generate passes --jsdoc flag', async () => {
    generateTypings.mockResolvedValue('// types');
    outputFile.mockResolvedValue(undefined);

    process.argv = ['node', 'cli', 'generate', '--jsdoc'];
    await import('./cli.js');
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(generateTypings).toHaveBeenCalledWith(expect.objectContaining({ jsdoc: true }));
  });

  test('generate passes --localized flag', async () => {
    generateTypings.mockResolvedValue('// types');
    outputFile.mockResolvedValue(undefined);

    process.argv = ['node', 'cli', 'generate', '--localized'];
    await import('./cli.js');
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(generateTypings).toHaveBeenCalledWith(expect.objectContaining({ localized: true }));
  });

  test('generate passes --cwd option', async () => {
    generateTypings.mockResolvedValue('// types');
    outputFile.mockResolvedValue(undefined);

    process.argv = ['node', 'cli', 'generate', '--cwd', '/custom/dir'];
    await import('./cli.js');
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(generateTypings).toHaveBeenCalledWith(expect.objectContaining({ cwd: '/custom/dir' }));
  });

  test('generate passes --config option', async () => {
    generateTypings.mockResolvedValue('// types');
    outputFile.mockResolvedValue(undefined);

    process.argv = ['node', 'cli', 'generate', '--config', 'my.config.js'];
    await import('./cli.js');
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(generateTypings).toHaveBeenCalledWith(
      expect.objectContaining({ configFile: 'my.config.js' }),
    );
  });

  test('generate handles error from generateTypings', async () => {
    const { gracefulExit } = await import('exit-hook');
    generateTypings.mockRejectedValue(new Error('Generation failed'));

    process.argv = ['node', 'cli', 'generate'];
    await import('./cli.js');
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(gracefulExit).toHaveBeenCalledWith(1);
  });
});
