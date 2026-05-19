import { vi, beforeEach } from 'vitest';

const getOrganizationsBase = vi.fn();
const getSpacesBase = vi.fn();
const getSpaceBase = vi.fn();
const getEnvironmentsBase = vi.fn();
const getEnvironmentBase = vi.fn();
const getApiKeyBase = vi.fn();
const getPreviewApiKeyBase = vi.fn();
const getManagementClient = vi.fn();

vi.mock('@jungvonmatt/contentful-client', () => ({
  getManagementClient,
  getOrganizations: getOrganizationsBase,
  getSpaces: getSpacesBase,
  getSpace: getSpaceBase,
  getEnvironments: getEnvironmentsBase,
  getEnvironment: getEnvironmentBase,
  getApiKey: getApiKeyBase,
  getPreviewApiKey: getPreviewApiKeyBase,
}));

let contentfulModule: typeof import('./contentful.js');

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();

  getOrganizationsBase.mockResolvedValue([{ sys: { id: 'org-1' }, name: 'Org 1' }]);
  getSpacesBase.mockResolvedValue([
    { sys: { id: 'space-1', organization: { sys: { id: 'org-1' } } }, name: 'Space 1' },
  ]);
  getSpaceBase.mockResolvedValue({ sys: { id: 'space-1' } });
  getEnvironmentsBase.mockResolvedValue([{ sys: { id: 'master' } }]);
  getEnvironmentBase.mockResolvedValue({ sys: { id: 'master' } });
  getApiKeyBase.mockResolvedValue('access-token');
  getPreviewApiKeyBase.mockResolvedValue('preview-token');
  getManagementClient.mockImplementation((options) => {
    if (!options?.managementToken) {
      throw new Error('You need to login first. Run npx contentful login');
    }
    return {};
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
    getEnvironmentBase.mockRejectedValue(
      new Error('Environment "staging" is not available in space s"'),
    );
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
    getOrganizationsBase.mockRejectedValue(
      new Error('You need to login first. Run npx contentful login'),
    );
    await expect(
      contentfulModule.getOrganizations({} as { managementToken: string }),
    ).rejects.toThrow(/login first/);
  });
});
