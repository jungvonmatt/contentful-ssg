import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';

const run = vi.fn();
const getConfig = vi.fn();
const initializeCache = vi.fn();
const outputFile = vi.fn();
const confirm = vi.fn();

vi.mock('./index.js', () => ({
  run: (...args: unknown[]) => run(...args),
}));

vi.mock('./lib/config.js', () => ({
  ALL_PROMPTS: ['spaceId', 'environmentId'],
  getConfig: (...args: unknown[]) => getConfig(...args),
}));

vi.mock('./lib/cf-cache.js', () => ({
  initializeCache: (...args: unknown[]) => initializeCache(...args),
}));

vi.mock('./lib/object.js', () => ({
  omitKeys: (obj: Record<string, unknown>, ...keys: string[]) => {
    const result = { ...obj };
    for (const key of keys) {
      delete result[key];
    }
    return result;
  },
}));

vi.mock('./lib/ui.js', () => ({
  confirm: (...args: unknown[]) => confirm(...args),
  logError: vi.fn(),
}));

vi.mock('fs-extra', () => ({
  outputFile: (...args: unknown[]) => outputFile(...args),
}));

vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(false),
}));

vi.mock('fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue(''),
}));

vi.mock('exit-hook', () => ({
  asyncExitHook: vi.fn(),
  gracefulExit: vi.fn(),
}));

vi.mock('oxfmt', () => ({
  format: vi.fn().mockResolvedValue({ code: '// formatted' }),
}));

describe('contentful-ssg CLI', () => {
  let originalArgv: string[];
  let consoleLog: ReturnType<typeof vi.fn>;
  const mockCache = {
    hasSyncState: vi.fn().mockReturnValue(false),
    getSyncState: vi.fn().mockResolvedValue({}),
    setSyncState: vi.fn().mockResolvedValue(undefined),
    reset: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    originalArgv = process.argv;
    consoleLog = vi.fn();
    vi.spyOn(console, 'log').mockImplementation(consoleLog);
    vi.resetModules();
    run.mockReset();
    getConfig.mockReset();
    initializeCache.mockReset();
    outputFile.mockReset();
    confirm.mockReset();
    mockCache.hasSyncState.mockReturnValue(false);
    initializeCache.mockReturnValue(mockCache);
  });

  afterEach(() => {
    process.argv = originalArgv;
    vi.restoreAllMocks();
  });

  describe('init command', () => {
    test('initializes config and writes file', async () => {
      getConfig.mockResolvedValue({
        config: { spaceId: 'space-1', environmentId: 'master', directory: 'content' },
        layers: [],
      });
      confirm.mockResolvedValue(true);

      process.argv = ['node', 'cli', 'init'];
      await import('./cli.js');
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(getConfig).toHaveBeenCalledWith(
        expect.objectContaining({ cwd: expect.any(String) }),
        expect.objectContaining({ prompt: ['spaceId', 'environmentId'] }),
      );
      expect(outputFile).toHaveBeenCalled();
    });

    test('init with --typescript flag generates ts config', async () => {
      getConfig.mockResolvedValue({
        config: { spaceId: 'space-1', environmentId: 'master', directory: 'content' },
        layers: [],
      });
      confirm.mockResolvedValue(true);

      process.argv = ['node', 'cli', 'init', '--typescript'];
      await import('./cli.js');
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(outputFile).toHaveBeenCalledWith(expect.stringContaining('.ts'), expect.any(String));
    });

    test('init does not write file when user declines', async () => {
      getConfig.mockResolvedValue({
        config: { spaceId: 'space-1', environmentId: 'master', directory: 'content' },
        layers: [],
      });
      confirm.mockResolvedValue(false);

      process.argv = ['node', 'cli', 'init'];
      await import('./cli.js');
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(outputFile).not.toHaveBeenCalled();
    });
  });

  describe('fetch command', () => {
    test('fetches content with default options', async () => {
      getConfig.mockResolvedValue({ config: { spaceId: 'space-1' } });
      run.mockResolvedValue({ entries: [] });

      process.argv = ['node', 'cli', 'fetch'];
      await import('./cli.js');
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(run).toHaveBeenCalledWith(
        expect.objectContaining({ spaceId: 'space-1', sync: false }),
        undefined,
      );
    });

    test('fetch with --sync uses cache', async () => {
      getConfig.mockResolvedValue({ config: { spaceId: 'space-1' } });
      run.mockResolvedValue({ entries: [] });
      mockCache.hasSyncState.mockReturnValue(true);
      mockCache.getSyncState.mockResolvedValue({ entries: ['prev'] });

      process.argv = ['node', 'cli', 'fetch', '--sync'];
      await import('./cli.js');
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(run).toHaveBeenCalledWith(expect.objectContaining({ sync: true }), {
        entries: ['prev'],
      });
      expect(mockCache.setSyncState).toHaveBeenCalled();
    });

    test('fetch without --sync resets cache', async () => {
      getConfig.mockResolvedValue({ config: { spaceId: 'space-1' } });
      run.mockResolvedValue({ entries: [] });

      process.argv = ['node', 'cli', 'fetch'];
      await import('./cli.js');
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockCache.reset).toHaveBeenCalled();
    });

    test('fetch with --preview passes preview mode', async () => {
      getConfig.mockResolvedValue({ config: { preview: true } });
      run.mockResolvedValue({ entries: [] });

      process.argv = ['node', 'cli', 'fetch', '--preview'];
      await import('./cli.js');
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(getConfig).toHaveBeenCalledWith(expect.objectContaining({ preview: true }));
    });

    test('fetch handles errors gracefully', async () => {
      const { gracefulExit } = await import('exit-hook');
      getConfig.mockRejectedValue(new Error('Config error'));

      process.argv = ['node', 'cli', 'fetch'];
      await import('./cli.js');
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(gracefulExit).toHaveBeenCalledWith(1);
    });
  });

  describe('watch command', () => {
    test('watch command runs with --poll', async () => {
      getConfig.mockResolvedValue({ config: { spaceId: 'space-1' } });
      run.mockResolvedValue({ entries: [] });

      process.argv = ['node', 'cli', 'watch', '--poll'];
      await import('./cli.js');
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(run).toHaveBeenCalledWith(expect.objectContaining({ sync: true }), undefined);
    });

    test('watch without --poll shows deprecation message', async () => {
      getConfig.mockResolvedValue({ config: { spaceId: 'space-1' } });
      run.mockResolvedValue({ entries: [] });

      process.argv = ['node', 'cli', 'watch'];
      await import('./cli.js');
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(consoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Local tunneling has been disabled'),
      );
    });
  });
});
