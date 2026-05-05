import { vi, beforeEach } from 'vitest';

const getOrganizations = vi.fn();
const getSpaces = vi.fn();
const getSpace = vi.fn();
const createClient = vi.fn();

vi.mock('contentful-management', () => ({
  default: { createClient },
  createClient,
}));

let contentfulModule: typeof import('./contentful.js');

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();

  getOrganizations.mockResolvedValue({
    items: [{ sys: { id: 'org-1' }, name: 'Org 1' }],
    limit: 1000,
    total: 1,
  });
  getSpaces.mockResolvedValue({
    items: [{ sys: { id: 'space-1', organization: { sys: { id: 'org-1' } } }, name: 'Space 1' }],
    limit: 1000,
    total: 1,
  });

  const space = {
    getEnvironments: vi.fn().mockResolvedValue({
      items: [{ sys: { id: 'master' } }],
      limit: 1000,
      total: 1,
    }),
    getEnvironment: vi.fn().mockResolvedValue({ sys: { id: 'master' } }),
    getApiKeys: vi.fn().mockResolvedValue({
      items: [{ accessToken: 'access-token' }],
    }),
    getPreviewApiKeys: vi.fn().mockResolvedValue({
      items: [{ accessToken: 'preview-token' }],
    }),
  };
  getSpace.mockResolvedValue(space);

  createClient.mockReturnValue({
    getOrganizations,
    getSpaces,
    getSpace,
  });

  contentfulModule = await import('./contentful.js');
});

describe('contentful client helpers', () => {
  test('getOrganizations returns flattened items', async () => {
    const orgs = await contentfulModule.getOrganizations({ managementToken: 'mt' });
    expect(orgs).toEqual([{ sys: { id: 'org-1' }, name: 'Org 1' }]);
  });

  test('getSpaces returns flattened items', async () => {
    const spaces = await contentfulModule.getSpaces({ managementToken: 'mt' });
    expect(spaces[0].sys.id).toBe('space-1');
  });

  test('getEnvironments returns space environments', async () => {
    const envs = await contentfulModule.getEnvironments({
      managementToken: 'mt',
      spaceId: 's',
    });
    expect(envs[0].sys.id).toBe('master');
  });

  test('getEnvironment returns existing environment', async () => {
    const env = await contentfulModule.getEnvironment({
      managementToken: 'mt',
      spaceId: 's',
      environmentId: 'master',
    });
    expect(env.sys.id).toBe('master');
  });

  test('getEnvironment throws on unknown environmentId', async () => {
    await expect(
      contentfulModule.getEnvironment({
        managementToken: 'mt',
        spaceId: 's',
        environmentId: 'staging',
      }),
    ).rejects.toThrow(/not available/);
  });

  test('getApiKey returns first api access token', async () => {
    const token = await contentfulModule.getApiKey({ managementToken: 'mt', spaceId: 's' });
    expect(token).toBe('access-token');
  });

  test('getPreviewApiKey returns first preview access token', async () => {
    const token = await contentfulModule.getPreviewApiKey({
      managementToken: 'mt',
      spaceId: 's',
    });
    expect(token).toBe('preview-token');
  });

  test('throws when no token is provided', async () => {
    await expect(
      contentfulModule.getOrganizations({} as { managementToken: string }),
    ).rejects.toThrow(/login first/);
  });

  test('paginates results when total exceeds limit', async () => {
    const items1 = Array.from({ length: 1000 }, (_, i) => ({ sys: { id: `s-${i}` } }));
    const items2 = [{ sys: { id: 's-1000' } }];
    getSpaces
      .mockResolvedValueOnce({ items: items1, limit: 1000, total: 1001 })
      .mockResolvedValueOnce({ items: items2, limit: 1000, total: 1001 });

    const spaces = await contentfulModule.getSpaces({ managementToken: 'mt' });
    expect(spaces).toHaveLength(1001);
  });
});
