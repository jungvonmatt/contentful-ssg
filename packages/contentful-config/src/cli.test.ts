import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

vi.mock('node:child_process', () => ({
  execFileSync: vi.fn(),
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn().mockReturnValue(false),
  readFileSync: vi.fn().mockReturnValue(''),
  writeFileSync: vi.fn(),
}));

const loadContentfulConfig = vi.fn();
vi.mock('./index.js', () => ({
  loadContentfulConfig: (...args: unknown[]) => loadContentfulConfig(...args),
}));

describe('contentful-config CLI', () => {
  let originalArgv: string[];
  let stdoutWrite: ReturnType<typeof vi.fn>;
  let stderrWrite: ReturnType<typeof vi.fn>;
  let consoleLog: ReturnType<typeof vi.fn>;
  let consoleError: ReturnType<typeof vi.fn>;
  let processExit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    originalArgv = process.argv;
    stdoutWrite = vi.fn();
    stderrWrite = vi.fn();
    consoleLog = vi.fn();
    consoleError = vi.fn();
    processExit = vi.fn();
    vi.spyOn(process.stdout, 'write').mockImplementation(stdoutWrite);
    vi.spyOn(process.stderr, 'write').mockImplementation(stderrWrite);
    vi.spyOn(console, 'log').mockImplementation(consoleLog);
    vi.spyOn(console, 'error').mockImplementation(consoleError);
    vi.spyOn(process, 'exit').mockImplementation(processExit as never);
    vi.resetModules();
  });

  afterEach(() => {
    process.argv = originalArgv;
    vi.restoreAllMocks();
  });

  test('shows help with --help flag', async () => {
    process.argv = ['node', 'cli', '--help'];
    loadContentfulConfig.mockResolvedValue({
      config: { managementToken: 'mt' },
    });

    await import('./cli.js');

    expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('Usage: contentful-config'));
  });

  test('outputs env vars to stdout by default', async () => {
    loadContentfulConfig
      .mockResolvedValueOnce({
        config: { managementToken: 'mt', spaceId: 'space-1' },
      })
      .mockResolvedValueOnce({
        config: {
          spaceId: 'space-1',
          environmentId: 'master',
          accessToken: 'at',
          previewAccessToken: 'pt',
        },
      });

    process.argv = ['node', 'cli'];
    await import('./cli.js');

    // Wait for async main() to complete
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(stdoutWrite).toHaveBeenCalledWith(
      expect.stringContaining('CONTENTFUL_SPACE_ID=space-1'),
    );
    expect(stdoutWrite).toHaveBeenCalledWith(
      expect.stringContaining('CONTENTFUL_ENVIRONMENT_ID=master'),
    );
  });

  test('triggers login when no management token', async () => {
    loadContentfulConfig
      .mockResolvedValueOnce({ config: {} })
      .mockResolvedValueOnce({ config: { managementToken: 'mt' } })
      .mockResolvedValueOnce({
        config: { spaceId: 'space-1', environmentId: 'master' },
      });

    process.argv = ['node', 'cli'];
    await import('./cli.js');
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(execFileSync).toHaveBeenCalledWith('contentful', ['login'], { stdio: 'inherit' });
  });

  test('writes output to file with --output flag', async () => {
    loadContentfulConfig
      .mockResolvedValueOnce({ config: { managementToken: 'mt' } })
      .mockResolvedValueOnce({
        config: { spaceId: 'space-1', environmentId: 'master' },
      });

    vi.mocked(existsSync).mockReturnValue(false);
    process.argv = ['node', 'cli', '--output', '/tmp/test.env'];
    await import('./cli.js');
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(writeFileSync).toHaveBeenCalledWith(
      '/tmp/test.env',
      expect.stringContaining('CONTENTFUL_SPACE_ID=space-1'),
      'utf-8',
    );
  });

  test('merges with existing file when output exists', async () => {
    loadContentfulConfig
      .mockResolvedValueOnce({ config: { managementToken: 'mt' } })
      .mockResolvedValueOnce({
        config: { spaceId: 'space-1', environmentId: 'master' },
      });

    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockReturnValue(
      '# Comment\nCONTENTFUL_SPACE_ID=old-space\nOTHER_VAR=keep\n',
    );

    process.argv = ['node', 'cli', '--output', '/tmp/test.env'];
    await import('./cli.js');
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(writeFileSync).toHaveBeenCalledWith(
      '/tmp/test.env',
      expect.stringContaining('# Comment'),
      'utf-8',
    );
    expect(writeFileSync).toHaveBeenCalledWith(
      '/tmp/test.env',
      expect.stringContaining('CONTENTFUL_SPACE_ID=space-1'),
      'utf-8',
    );
    expect(writeFileSync).toHaveBeenCalledWith(
      '/tmp/test.env',
      expect.stringContaining('OTHER_VAR=keep'),
      'utf-8',
    );
  });

  test('uses custom name with --name flag', async () => {
    loadContentfulConfig
      .mockResolvedValueOnce({ config: { managementToken: 'mt' } })
      .mockResolvedValueOnce({ config: { spaceId: 'space-1' } });

    process.argv = ['node', 'cli', '--name', 'myconfig'];
    await import('./cli.js');
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(loadContentfulConfig).toHaveBeenCalledWith('myconfig', expect.anything());
  });

  test('uses custom required keys with --required flag', async () => {
    loadContentfulConfig
      .mockResolvedValueOnce({ config: { managementToken: 'mt' } })
      .mockResolvedValueOnce({ config: { spaceId: 'space-1' } });

    process.argv = ['node', 'cli', '--required', 'spaceId,environmentId'];
    await import('./cli.js');
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(loadContentfulConfig).toHaveBeenCalledWith(
      'contentful',
      expect.objectContaining({ required: ['spaceId', 'environmentId'] }),
    );
  });

  test('skips keys in SKIP_KEYS set', async () => {
    loadContentfulConfig
      .mockResolvedValueOnce({ config: { managementToken: 'mt' } })
      .mockResolvedValueOnce({
        config: {
          spaceId: 'space-1',
          organizationId: 'org-1',
          managementToken: 'mt',
          activeSpaceId: 'active',
          activeEnvironmentId: 'env',
        },
      });

    process.argv = ['node', 'cli'];
    await import('./cli.js');
    await new Promise((resolve) => setTimeout(resolve, 10));

    const output = stdoutWrite.mock.calls.map((c) => c[0]).join('');
    expect(output).toContain('CONTENTFUL_SPACE_ID=space-1');
    expect(output).not.toContain('CONTENTFUL_ORGANIZATION_ID');
    expect(output).not.toContain('CONTENTFUL_MANAGEMENT_TOKEN');
  });
});
