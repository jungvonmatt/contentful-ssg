import { vi, beforeEach, describe, test, expect } from 'vitest';

const organizationGetAll = vi.fn();
const spaceGetMany = vi.fn();
const spaceGet = vi.fn();
const environmentGetMany = vi.fn();
const environmentGet = vi.fn();
const apiKeyGetMany = vi.fn();
const previewApiKeyGetMany = vi.fn();
const webhookGetMany = vi.fn();
const webhookGet = vi.fn();
const webhookCreate = vi.fn();
const webhookDelete = vi.fn();
const rawPut = vi.fn();
const createClient = vi.fn();

vi.mock('contentful-management', async (importOriginal) => {
  const actual = await importOriginal<typeof import('contentful-management')>();
  return {
    ...actual,
    default: { createClient },
    createClient,
  };
});

let clientModule: typeof import('./management.js');

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();

  organizationGetAll.mockResolvedValue({
    items: [{ sys: { id: 'org-1' }, name: 'Org 1' }],
    total: 1,
    skip: 0,
    limit: 100,
  });
  spaceGetMany.mockResolvedValue({
    items: [{ sys: { id: 'space-1', organization: { sys: { id: 'org-1' } } }, name: 'Space 1' }],
    total: 1,
    skip: 0,
    limit: 100,
  });

  spaceGet.mockResolvedValue({ sys: { id: 'space-1' } });

  environmentGetMany.mockResolvedValue({
    items: [{ sys: { id: 'master' } }],
    total: 1,
    skip: 0,
    limit: 100,
  });
  environmentGet.mockResolvedValue({ sys: { id: 'master' } });

  apiKeyGetMany.mockResolvedValue({
    items: [{ accessToken: 'access-token' }],
    total: 1,
    skip: 0,
    limit: 100,
  });
  previewApiKeyGetMany.mockResolvedValue({
    items: [{ accessToken: 'preview-token' }],
    total: 1,
    skip: 0,
    limit: 100,
  });

  webhookGetMany.mockResolvedValue({
    items: [{ sys: { id: 'wh-1' }, url: 'http://example.com' }],
    total: 1,
    skip: 0,
    limit: 100,
  });
  webhookGet.mockResolvedValue({ sys: { id: 'wh-1' }, url: 'http://example.com' });
  webhookCreate.mockImplementation((_params, data) => ({ ...data, sys: { id: 'new-wh' } }));
  webhookDelete.mockResolvedValue(undefined);
  rawPut.mockImplementation((_url, data) => ({ ...data, sys: { id: 'new-wh' } }));

  createClient.mockReturnValue({
    organization: { getAll: organizationGetAll },
    space: { getMany: spaceGetMany, get: spaceGet },
    environment: { getMany: environmentGetMany, get: environmentGet },
    apiKey: { getMany: apiKeyGetMany },
    previewApiKey: { getMany: previewApiKeyGetMany },
    webhook: {
      getMany: webhookGetMany,
      get: webhookGet,
      create: webhookCreate,
      delete: webhookDelete,
    },
    raw: { put: rawPut },
  });

  clientModule = await import('./management.js');
  clientModule.resetManagementClient();
});

describe('contentful-client', () => {
  test('getManagementClient throws without token', () => {
    expect(() => clientModule.getManagementClient({})).toThrow(/login first/);
  });

  test('getManagementClient creates and caches client', () => {
    const c1 = clientModule.getManagementClient({ managementToken: 'mt' });
    const c2 = clientModule.getManagementClient({ managementToken: 'mt' });
    expect(c1).toBe(c2);
    expect(createClient).toHaveBeenCalledTimes(1);
  });

  test('getManagementClient recreates client when token changes', () => {
    clientModule.getManagementClient({ managementToken: 'token-a' });
    clientModule.getManagementClient({ managementToken: 'token-b' });
    expect(createClient).toHaveBeenCalledTimes(2);
    expect(createClient).toHaveBeenNthCalledWith(1, { accessToken: 'token-a' });
    expect(createClient).toHaveBeenNthCalledWith(2, { accessToken: 'token-b' });
  });

  test('getManagementClient recreates client when host changes', () => {
    clientModule.getManagementClient({ managementToken: 'mt', host: 'host-a' });
    clientModule.getManagementClient({ managementToken: 'mt', host: 'host-b' });
    expect(createClient).toHaveBeenCalledTimes(2);
    expect(createClient).toHaveBeenNthCalledWith(1, { accessToken: 'mt', host: 'host-a' });
    expect(createClient).toHaveBeenNthCalledWith(2, { accessToken: 'mt', host: 'host-b' });
  });

  test('getSpaces returns flattened items', async () => {
    const spaces = await clientModule.getSpaces({ managementToken: 'mt' });
    expect(spaces[0].sys.id).toBe('space-1');
  });

  test('getEnvironments returns environments', async () => {
    const envs = await clientModule.getEnvironments({ managementToken: 'mt', spaceId: 's' });
    expect(envs[0].sys.id).toBe('master');
  });

  test('getEnvironment returns existing environment', async () => {
    const env = await clientModule.getEnvironment({
      managementToken: 'mt',
      spaceId: 's',
      environmentId: 'master',
    });
    expect(env.sys.id).toBe('master');
    expect(environmentGet).toHaveBeenCalledWith({ spaceId: 's', environmentId: 'master' });
  });

  test('getEnvironment throws on unknown environmentId', async () => {
    environmentGet.mockRejectedValueOnce(new Error('Not Found'));
    await expect(
      clientModule.getEnvironment({
        managementToken: 'mt',
        spaceId: 's',
        environmentId: 'staging',
      }),
    ).rejects.toThrow(/not available/);
  });

  test('getEnvironment throws when environmentId is missing', async () => {
    await expect(
      clientModule.getEnvironment({
        managementToken: 'mt',
        spaceId: 's',
      }),
    ).rejects.toThrow(/Missing required parameter/);
  });

  test('getApiKey returns first api access token', async () => {
    const token = await clientModule.getApiKey({ managementToken: 'mt', spaceId: 's' });
    expect(token).toBe('access-token');
  });

  test('getPreviewApiKey returns first preview access token', async () => {
    const token = await clientModule.getPreviewApiKey({ managementToken: 'mt', spaceId: 's' });
    expect(token).toBe('preview-token');
  });

  test('fetchAll paginates through all pages', async () => {
    const items1 = Array.from({ length: 100 }, (_, i) => ({ sys: { id: `s-${i}` } }));
    const items2 = [{ sys: { id: 's-100' } }];
    spaceGetMany
      .mockResolvedValueOnce({ items: items1, total: 101, skip: 0, limit: 100 })
      .mockResolvedValueOnce({ items: items2, total: 101, skip: 100, limit: 100 });

    const spaces = await clientModule.getSpaces({ managementToken: 'mt' });
    expect(spaces).toHaveLength(101);
    expect(spaceGetMany).toHaveBeenCalledTimes(2);
  });

  test('getOrganizations returns flattened items', async () => {
    const orgs = await clientModule.getOrganizations({ managementToken: 'mt' });
    expect(orgs).toEqual([{ sys: { id: 'org-1' }, name: 'Org 1' }]);
  });

  test('getWebhooks returns webhooks for a space', async () => {
    const webhooks = await clientModule.getWebhooks({ managementToken: 'mt', spaceId: 's' });
    expect(webhooks[0].sys.id).toBe('wh-1');
  });

  test('addWebhook returns existing webhook if found', async () => {
    const webhook = await clientModule.addWebhook({ managementToken: 'mt', spaceId: 's' }, 'wh-1', {
      name: 'test',
      url: 'http://test.com',
      topics: [],
      headers: [],
    });
    expect(webhook.sys.id).toBe('wh-1');
    expect(webhookCreate).not.toHaveBeenCalled();
  });

  test('addWebhook creates webhook with deterministic ID via raw PUT', async () => {
    webhookGet.mockRejectedValueOnce(new Error('Not Found'));
    const webhook = await clientModule.addWebhook(
      { managementToken: 'mt', spaceId: 's' },
      'new-wh',
      { name: 'test', url: 'http://test.com', topics: [], headers: [] },
    );
    expect(webhook.sys.id).toBe('new-wh');
    expect(rawPut).toHaveBeenCalledWith('/spaces/s/webhook_definitions/new-wh', {
      name: 'test',
      url: 'http://test.com',
      topics: [],
      headers: [],
    });
  });

  test('deleteWebhook deletes a webhook', async () => {
    await clientModule.deleteWebhook({ managementToken: 'mt', spaceId: 's' }, 'wh-1');
    expect(webhookDelete).toHaveBeenCalledWith({ spaceId: 's', webhookDefinitionId: 'wh-1' });
  });
});
