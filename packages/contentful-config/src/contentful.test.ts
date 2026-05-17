import { vi, beforeEach } from 'vitest';

const organizationGetAll = vi.fn();
const spaceGetMany = vi.fn();
const spaceGet = vi.fn();
const environmentGetMany = vi.fn();
const environmentGet = vi.fn();
const apiKeyGetMany = vi.fn();
const previewApiKeyGetMany = vi.fn();
const createClient = vi.fn();

vi.mock('contentful-management', () => ({
  default: { createClient },
  createClient,
}));

let contentfulModule: typeof import('./contentful.js');

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();

  organizationGetAll.mockResolvedValue({
    items: [{ sys: { id: 'org-1' }, name: 'Org 1' }],
  });
  spaceGetMany.mockResolvedValue({
    items: [{ sys: { id: 'space-1', organization: { sys: { id: 'org-1' } } }, name: 'Space 1' }],
  });

  spaceGet.mockResolvedValue({ sys: { id: 'space-1' } });

  environmentGetMany.mockResolvedValue({
    items: [{ sys: { id: 'master' } }],
  });
  environmentGet.mockResolvedValue({ sys: { id: 'master' } });

  apiKeyGetMany.mockResolvedValue({
    items: [{ accessToken: 'access-token' }],
  });
  previewApiKeyGetMany.mockResolvedValue({
    items: [{ accessToken: 'preview-token' }],
  });

  createClient.mockReturnValue({
    organization: { getAll: organizationGetAll },
    space: { getMany: spaceGetMany, get: spaceGet },
    environment: { getMany: environmentGetMany, get: environmentGet },
    apiKey: { getMany: apiKeyGetMany },
    previewApiKey: { getMany: previewApiKeyGetMany },
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
});
