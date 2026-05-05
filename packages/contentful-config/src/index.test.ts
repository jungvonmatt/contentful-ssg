import { vi, beforeEach } from 'vitest';

const getOrganizations = vi.fn();
const getSpaces = vi.fn();
const getApiKey = vi.fn();
const getPreviewApiKey = vi.fn();
const getEnvironments = vi.fn();
const loadConfig = vi.fn();

vi.mock('./contentful.js', () => ({
  getOrganizations,
  getSpaces,
  getApiKey,
  getPreviewApiKey,
  getEnvironments,
}));

vi.mock('@jungvonmatt/config-loader', () => ({
  loadConfig,
}));

vi.mock('node-homedir', () => ({
  homedir: vi.fn().mockReturnValue('/home/user'),
}));

vi.mock('package-up', () => ({
  packageUp: vi.fn().mockResolvedValue('/proj/package.json'),
}));

let mod: typeof import('./index.js');

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  getOrganizations.mockResolvedValue([{ sys: { id: 'org-1' }, name: 'Org 1' }]);
  getSpaces.mockResolvedValue([
    { sys: { id: 'space-1', organization: { sys: { id: 'org-1' } } }, name: 'Space 1' },
    { sys: { id: 'space-2', organization: { sys: { id: 'org-2' } } }, name: 'Space 2' },
  ]);
  getEnvironments.mockResolvedValue([{ sys: { id: 'master' } }, { sys: { id: 'staging' } }]);
  getApiKey.mockResolvedValue('access-token');
  getPreviewApiKey.mockResolvedValue('preview-token');
  loadConfig.mockResolvedValue({ config: { environmentId: 'master' } });
  mod = await import('./index.js');
});

const ctx = (answers: Record<string, unknown> = {}) => ({
  enquirer: { options: {}, answers },
  choices: [],
});

describe('getPrompts', () => {
  test('returns prompts in expected order', () => {
    const prompts = mod.getPrompts({});
    expect(prompts.map((p) => p.name)).toEqual([
      'managementToken',
      'host',
      'organizationId',
      'spaceId',
      'environmentId',
      'accessToken',
      'previewAccessToken',
    ]);
  });

  test('organizationId.choices uses managementToken from answers', async () => {
    const prompts = mod.getPrompts({});
    const [, , organizationId] = prompts;
    const result = await organizationId.choices.call(ctx({ managementToken: 'mt' }));
    expect(getOrganizations).toHaveBeenCalledWith({ managementToken: 'mt', host: undefined });
    expect(result).toEqual([{ message: 'Org 1', name: 'org-1', value: 'org-1' }]);
  });

  test('organizationId.choices returns [] when no managementToken', async () => {
    const prompts = mod.getPrompts({});
    const [, , organizationId] = prompts;
    const result = await organizationId.choices.call(ctx());
    expect(result).toEqual([]);
  });

  test('spaceId.choices filters by selected organizationId', async () => {
    const prompts = mod.getPrompts({});
    const spaceId = prompts.find((p) => p.name === 'spaceId');
    const result = await spaceId!.choices.call(
      ctx({ managementToken: 'mt', organizationId: 'org-1' }),
    );
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe('space-1');
  });

  test('spaceId.choices returns all spaces when no organizationId', async () => {
    const prompts = mod.getPrompts({});
    const spaceId = prompts.find((p) => p.name === 'spaceId');
    const result = await spaceId!.choices.call(ctx({ managementToken: 'mt' }));
    expect(result).toHaveLength(2);
  });

  test('spaceId.format returns choice message', () => {
    const prompts = mod.getPrompts({});
    const spaceId = prompts.find((p) => p.name === 'spaceId');
    const result = spaceId!.format.call(
      { choices: [{ message: 'Pretty', name: 'space-1', value: 'space-1' }] },
      'space-1',
    );
    expect(result).toBe('Pretty');
  });

  test('spaceId.format falls back to value when no matching choice', () => {
    const prompts = mod.getPrompts({});
    const spaceId = prompts.find((p) => p.name === 'spaceId');
    const result = spaceId!.format.call({ choices: [] }, 'plain-value');
    expect(result).toBe('plain-value');
  });

  test('environmentId.choices returns environment ids when token+space provided', async () => {
    const prompts = mod.getPrompts({});
    const environmentId = prompts.find((p) => p.name === 'environmentId');
    const result = await environmentId!.choices.call(
      ctx({ managementToken: 'mt', spaceId: 'space-1' }),
    );
    expect(result).toEqual(['master', 'staging']);
  });

  test('environmentId.choices returns [] without spaceId', async () => {
    const prompts = mod.getPrompts({});
    const environmentId = prompts.find((p) => p.name === 'environmentId');
    const result = await environmentId!.choices.call(ctx({ managementToken: 'mt' }));
    expect(result).toEqual([]);
  });

  test('accessToken.skip true when no spaceId in answers/data', () => {
    const prompts = mod.getPrompts({});
    const accessToken = prompts.find((p) => p.name === 'accessToken');
    expect(accessToken!.skip.call(ctx())).toBe(true);
  });

  test('accessToken.skip false when spaceId in answers', () => {
    const prompts = mod.getPrompts({});
    const accessToken = prompts.find((p) => p.name === 'accessToken');
    expect(accessToken!.skip.call(ctx({ spaceId: 'space-1' }))).toBe(false);
  });

  test('accessToken.initial fetches via getApiKey when token+space available', async () => {
    const prompts = mod.getPrompts({});
    const accessToken = prompts.find((p) => p.name === 'accessToken');
    const value = await accessToken!.initial.call(
      ctx({ managementToken: 'mt', spaceId: 'space-1' }),
    );
    expect(value).toBe('access-token');
  });

  test('accessToken.initial returns supplied data.accessToken (string)', async () => {
    const prompts = mod.getPrompts({ accessToken: 'preset' });
    const accessToken = prompts.find((p) => p.name === 'accessToken');
    const value = await accessToken!.initial.call(ctx());
    expect(value).toBe('preset');
  });

  test('accessToken.initial calls function-style data.accessToken', async () => {
    const prompts = mod.getPrompts({ accessToken: (() => 'fn-token') as never });
    const accessToken = prompts.find((p) => p.name === 'accessToken');
    const value = await accessToken!.initial.call(ctx());
    expect(value).toBe('fn-token');
  });

  test('previewAccessToken.initial fetches via getPreviewApiKey', async () => {
    const prompts = mod.getPrompts({});
    const previewAccessToken = prompts.find((p) => p.name === 'previewAccessToken');
    const value = await previewAccessToken!.initial.call(
      ctx({ managementToken: 'mt', spaceId: 'space-1' }),
    );
    expect(value).toBe('preview-token');
  });
});

describe('loadContentfulConfig', () => {
  test('delegates to loadConfig with merged options', async () => {
    loadConfig.mockResolvedValueOnce({ config: { home: true } });
    loadConfig.mockResolvedValueOnce({ config: { spaceId: 'space-1' } });
    const result = await mod.loadContentfulConfig('contentful', { cwd: '/cwd' });
    expect(result.config).toEqual({ spaceId: 'space-1' });
    expect(loadConfig).toHaveBeenCalledTimes(2);
    const secondCall = loadConfig.mock.calls[1][0];
    expect(secondCall.name).toBe('contentful');
    expect(secondCall.envMap.CONTENTFUL_SPACE_ID).toBe('spaceId');
  });

  test('required adds organizationId when spaceId is required and missing', async () => {
    loadConfig.mockResolvedValueOnce({ config: {} });
    loadConfig.mockResolvedValueOnce({ config: {} });
    await mod.loadContentfulConfig('contentful', { required: ['spaceId', 'environmentId'] });
    const secondCall = loadConfig.mock.calls[1][0];
    const requiredFn = secondCall.required;
    const required = await requiredFn({});
    expect(required).toEqual(['organizationId', 'spaceId', 'environmentId']);
  });

  test('required keeps original list when spaceId already in data', async () => {
    loadConfig.mockResolvedValueOnce({ config: {} });
    loadConfig.mockResolvedValueOnce({ config: {} });
    await mod.loadContentfulConfig('contentful', { required: ['spaceId'] });
    const secondCall = loadConfig.mock.calls[1][0];
    const required = await secondCall.required({ spaceId: 'space-1' });
    expect(required).toEqual(['spaceId']);
  });

  test('mergePrompts keeps default prompts when prompts === undefined', async () => {
    loadConfig.mockResolvedValueOnce({ config: {} });
    loadConfig.mockResolvedValueOnce({ config: {} });
    await mod.loadContentfulConfig('contentful');
    const secondCall = loadConfig.mock.calls[1][0];
    const prompts = secondCall.prompts({});
    expect(Array.isArray(prompts)).toBe(true);
    expect(prompts.length).toBeGreaterThan(0);
  });

  test('mergePrompts: prompts === false returns false', async () => {
    loadConfig.mockResolvedValueOnce({ config: {} });
    loadConfig.mockResolvedValueOnce({ config: {} });
    await mod.loadContentfulConfig('contentful', { prompts: false });
    const secondCall = loadConfig.mock.calls[1][0];
    expect(secondCall.prompts).toBe(false);
  });

  test('mergePrompts merges custom array with defaults, override by name', async () => {
    loadConfig.mockResolvedValueOnce({ config: {} });
    loadConfig.mockResolvedValueOnce({ config: {} });
    await mod.loadContentfulConfig('contentful', {
      prompts: [{ name: 'managementToken', message: 'custom' }] as never,
    });
    const secondCall = loadConfig.mock.calls[1][0];
    const merged = secondCall.prompts({});
    const custom = merged.find((p: { name: string }) => p.name === 'managementToken');
    expect(custom.message).toBe('custom');
  });
});
