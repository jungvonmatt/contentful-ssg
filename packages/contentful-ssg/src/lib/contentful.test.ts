/* eslint-env jest */
import { existsSync } from 'fs';
import { readFile, unlink } from 'fs/promises';
import { ContentfulConfig, Entry } from '../types.js';
import { getContent as getMockContent } from '../__test__/mock.js';
import {
  convertToMap,
  getContentId,
  getContentTypeId,
  getEnvironmentId,
  getFieldSettings,
  isContentfulObject,
  isAsset,
  isAssetLink,
  isEntry,
  isEntryLink,
  isLink,
  getSpaces,
  getContent,
  getSpace,
  getEnvironment,
  getEnvironments,
  getApiKey,
  getPreviewApiKey,
  getWebhooks,
  addWebhook,
  deleteWebhook,
  addWatchWebhook,
  resetSync,
  SYNC_TOKEN_FILENAME,
  isSyncRequest,
} from './contentful.js';

const configMock = {
  spaceId: 'spaceId',
  environmentId: 'environmentId',
  managementToken: 'managementToken',
  previewAccessToken: 'previewAccessToken',
  accessToken: 'accessToken',
};

jest.mock('contentful', () => {
  return {
    createClient: jest.fn().mockReturnValue({
      getLocales: jest.fn().mockResolvedValue({ items: Array(2) }),
      getContentTypes: jest.fn().mockResolvedValue({ items: Array(3) }),
      getAssets: jest.fn().mockResolvedValue({ items: Array(4) }),
      getEntries: jest
        .fn()
        .mockResolvedValueOnce({ items: Array(1000), total: 2004 })
        .mockResolvedValueOnce({ items: Array(1000), total: 2004 })
        .mockResolvedValue({ items: Array(4), total: 2004 }),
      sync: jest
        .fn()
        .mockResolvedValueOnce({
          nextSyncToken: 'sync-token',
          entries: Array(5),
          assets: Array(3),
          deletedEntries: [{ sys: { id: 'entry' } }],
          deletedAssets: [{ sys: { id: 'asset' } }],
        })
        .mockResolvedValueOnce({
          nextSyncToken: 'sync-token-2',
          entries: [],
          assets: [],
          deletedEntries: [{ sys: { id: 'entry-2' } }],
          deletedAssets: [],
        }),
    }),
  };
});

jest.mock('contentful-management', () => {
  const mockedApiKey = { accessToken: 'accessToken' };
  const mockedPreviewApiKey = { accessToken: 'previewAccessToken' };
  const mockedEnvironment = {
    sys: { id: 'environment-id' },
  };

  const mockedWebhook = {
    name: '...',
    url: '...',
    httpBasicUsername: null,
    topics: [
      'ContentType.publish',
      'ContentType.unpublish',
      'ContentType.delete',
      'Entry.archive',
      'Entry.unarchive',
      'Entry.publish',
      'Entry.unpublish',
      'Entry.delete',
      'Asset.archive',
      'Asset.unarchive',
      'Asset.publish',
      'Asset.unpublish',
      'Asset.delete',
    ],
    active: true,
    sys: {
      type: 'WebhookDefinition',
      id: 'b737d0fe-d100-490a-a378-48453ca5b541',
      version: 1,
    },
    headers: [],
    delete: jest.fn().mockResolvedValue('deleted'),
  };

  const mockedSpace = {
    sys: { id: 'space-id' },
    getEnvironments: jest.fn().mockResolvedValue({ items: [mockedEnvironment] }),
    getEnvironment: jest.fn().mockResolvedValue(mockedEnvironment),
    getApiKeys: jest.fn().mockResolvedValue({ items: [mockedApiKey] }),
    getPreviewApiKeys: jest.fn().mockResolvedValue({ items: [mockedPreviewApiKey] }),
    getWebhooks: jest.fn().mockResolvedValue({ items: [mockedWebhook] }),
    getWebhook: jest.fn().mockImplementation((id) => {
      if (/new/.test(id) || id === 'http://test.url') {
        throw new Error('Not Found');
      }

      return mockedWebhook;
    }),
    createWebhookWithId: jest.fn().mockImplementation((id, data) => ({
      ...data,
      sys: {
        type: 'WebhookDefinition',
        id,
        version: 1,
      },
    })),
  };

  return {
    createClient: jest.fn().mockReturnValue({
      getSpaces: jest.fn().mockResolvedValue({ items: [mockedSpace] }),
      getSpace: jest.fn().mockResolvedValue(mockedSpace),
    }),
  };
});

describe('Contentful', () => {
  test('throws on missing managementToken (managament client)', async () => {
    await expect(async () => {
      await getSpaces({
        spaceId: 'spaceId',
        environmentId: 'environmentId',
        previewAccessToken: 'previewAccessToken',
        accessToken: 'accessToken',
      } as ContentfulConfig);
    }).rejects.toThrowError(/You need to login first/);
  });

  test('throws on missing accessToken (client)', async () => {
    await expect(async () => {
      await getContent({
        spaceId: 'spaceId',
        environmentId: 'environmentId',
        managementToken: 'managementToken',
      } as ContentfulConfig);
    }).rejects.toThrowError(/You need to login first/);
  });

  test('getSpaces', async () => {
    const spaces = await getSpaces(configMock);
    expect(Array.isArray(spaces)).toBe(true);
    expect(spaces?.[0]?.sys?.id).toEqual('space-id');
  });

  test('getSpace', async () => {
    const space = await getSpace(configMock);
    expect(space?.sys?.id).toEqual('space-id');
  });

  test('getEnvironments', async () => {
    const environments = await getEnvironments(configMock);
    expect(Array.isArray(environments)).toBe(true);
    expect(environments?.[0]?.sys?.id).toEqual('environment-id');
  });

  test('getEnvironment', async () => {
    const environment = await getEnvironment({ ...configMock, environmentId: 'environment-id' });
    expect(environment?.sys?.id).toEqual('environment-id');

    await expect(async () => {
      await getEnvironment({ ...configMock, environmentId: 'false-id' });
    }).rejects.toThrowError(/not available in space/);

    await expect(async () => {
      await getEnvironment({
        spaceId: 'spaceId',
        managementToken: 'managementToken',
      } as ContentfulConfig);
    }).rejects.toThrowError(/Missing required parameter: environmentId/);
  });

  test('getEnvironmentId', () => {
    const success = getEnvironmentId({ sys: { environment: { sys: { id: 'test' } } } } as Entry);
    const error = getEnvironmentId({} as Entry);
    expect(error).toBe('unknown');
    expect(success).toBe('test');
  });

  test('getApiKey', async () => {
    const key = await getApiKey(configMock);
    expect(key).toEqual('accessToken');
  });

  test('getPreviewApiKey', async () => {
    const key = await getPreviewApiKey(configMock);
    expect(key).toEqual('previewAccessToken');
  });

  test('getContent', async () => {
    const { entries, assets, contentTypes, locales } = await getContent(configMock);
    expect(Array.isArray(entries)).toBe(true);
    expect(Array.isArray(assets)).toBe(true);
    expect(Array.isArray(contentTypes)).toBe(true);
    expect(Array.isArray(locales)).toBe(true);
    expect(entries.length).toBe(2004);
    expect(assets.length).toBe(4);
    expect(contentTypes.length).toBe(3);
    expect(locales.length).toBe(2);
  });

  test('getContent (sync)', async () => {
    expect(isSyncRequest()).toBe(false);
    const first = await getContent({ ...configMock, sync: true });
    expect(Array.isArray(first.entries)).toBe(true);
    expect(Array.isArray(first.assets)).toBe(true);
    expect(Array.isArray(first.contentTypes)).toBe(true);
    expect(Array.isArray(first.locales)).toBe(true);
    expect(Array.isArray(first.deletedAssets)).toBe(true);
    expect(Array.isArray(first.deletedEntries)).toBe(true);
    expect(existsSync(SYNC_TOKEN_FILENAME)).toBe(true);
    expect(isSyncRequest()).toBe(true);
    const firstToken = await readFile(SYNC_TOKEN_FILENAME, 'utf8');
    expect(firstToken).toBe('sync-token');

    const second = await getContent({ ...configMock, sync: true });
    expect(second.deletedEntries.length).toBe(1);
    const secondToken = await readFile(SYNC_TOKEN_FILENAME, 'utf8');
    expect(secondToken).toBe('sync-token-2');

    await resetSync();
    expect(isSyncRequest()).toBe(false);
    expect(existsSync(SYNC_TOKEN_FILENAME)).toBe(false);
  });

  test('getWebhooks', async () => {
    const webhooks = await getWebhooks(configMock);
    expect(webhooks.length).toBe(1);
  });
  test('addWebhook', async () => {
    const webhook = await addWebhook(configMock, 'new-id', {
      name: 'name',
      url: 'url',
      topics: ['abc'],
      headers: [],
    });

    expect(webhook?.sys?.id).toBe('new-id');
    expect(webhook?.name).toBe('name');
  });

  test('deleteWebhook', async () => {
    const result = await deleteWebhook(configMock, 'id');
    expect(result).toBe('deleted');
  });

  test('addWatchWebhook', async () => {
    const webhook = await addWatchWebhook(configMock, 'http://test.url');
    expect(webhook.url).toBe('http://test.url');
    expect(webhook.topics).toEqual([
      'ContentType.publish',
      'ContentType.unpublish',
      'ContentType.delete',
      'Entry.archive',
      'Entry.unarchive',
      'Entry.publish',
      'Entry.unpublish',
      'Entry.delete',
      'Asset.archive',
      'Asset.unarchive',
      'Asset.publish',
      'Asset.unpublish',
      'Asset.delete',
    ]);
  });

  test('addWatchWebhook (preview)', async () => {
    const webhook = await addWatchWebhook({ ...configMock, preview: true }, 'http://test.url');
    expect(webhook.url).toBe('http://test.url');
    expect(webhook.topics).toEqual([
      'ContentType.publish',
      'ContentType.unpublish',
      'ContentType.delete',
      'Entry.archive',
      'Entry.unarchive',
      'Entry.publish',
      'Entry.unpublish',
      'Entry.delete',
      'Asset.archive',
      'Asset.unarchive',
      'Asset.publish',
      'Asset.unpublish',
      'Asset.delete',
      'ContentType.save',
      'Entry.save',
      'Entry.auto_save',
      'Asset.save',
      'Asset.auto_save',
    ]);
  });

  test('isContentfulObject', () => {
    expect(isContentfulObject({})).toBe(false);
    expect(isContentfulObject('')).toBe(false);
    expect(isContentfulObject([])).toBe(false);
    expect(isContentfulObject({ sys: {} })).toBe(true);
  });

  test('isAssetLink', async () => {
    const { entry, asset, entryLink, assetLink } = await getMockContent();
    expect(isAssetLink(assetLink)).toBe(true);
    expect(isAssetLink(entryLink)).toBe(false);
    expect(isAssetLink(entry)).toBe(false);
    expect(isAssetLink(asset)).toBe(false);
  });

  test('isEntryLink', async () => {
    const { entry, asset, entryLink, assetLink } = await getMockContent();
    expect(isEntryLink(assetLink)).toBe(false);
    expect(isEntryLink(entryLink)).toBe(true);
    expect(isEntryLink(entry)).toBe(false);
    expect(isEntryLink(asset)).toBe(false);
  });

  test('isAsset', async () => {
    const { entry, asset, entryLink, assetLink } = await getMockContent();
    expect(isAsset(assetLink)).toBe(false);
    expect(isAsset(entryLink)).toBe(false);
    expect(isAsset(entry)).toBe(false);
    expect(isAsset(asset)).toBe(true);
  });

  test('isEntry', async () => {
    const { entry, asset, entryLink, assetLink } = await getMockContent();
    expect(isEntry(assetLink)).toBe(false);
    expect(isEntry(entryLink)).toBe(false);
    expect(isEntry(entry)).toBe(true);
    expect(isEntry(asset)).toBe(false);
  });
  test('isLink', async () => {
    const { entry, asset, entryLink, assetLink } = await getMockContent();
    expect(isLink(assetLink)).toBe(true);
    expect(isLink(entryLink)).toBe(true);
    expect(isLink(entry)).toBe(false);
    expect(isLink(asset)).toBe(false);
  });
  test('isContentfulObject', async () => {
    const { entry, asset, entryLink, assetLink } = await getMockContent();
    expect(isLink(assetLink)).toBe(true);
    expect(isLink(entryLink)).toBe(true);
    expect(isLink(entry)).toBe(false);
    expect(isLink(asset)).toBe(false);
  });

  test('getFieldSettings', async () => {
    const { contentTypes } = await getMockContent();
    const fieldSettings = getFieldSettings(contentTypes);

    expect(Object.keys(fieldSettings)).toContain('fieldTest');
    expect(Object.keys(fieldSettings.fieldTest)).toContain('shortTextList');
    expect(Object.values(fieldSettings.fieldTest)).toContainEqual({
      id: 'shortTextList',
      name: 'Short text (list)',
      type: 'Array',
      localized: true,
      required: false,
      disabled: false,
      omitted: false,
      items: {
        type: 'Symbol',
        validations: [],
      },
    });
  });

  test('getContentId', async () => {
    const { entry } = await getMockContent();
    expect(getContentId(entry)).toEqual('34O95Y8gLXd3jPozdy7gmd');
  });

  test('getContentTypeId', async () => {
    const { entry } = await getMockContent();
    expect(getContentTypeId(entry)).toEqual('fieldTest');
  });

  test('getEnvironmentId', async () => {
    const { entry } = await getMockContent();
    expect(getEnvironmentId(entry)).toEqual('master');
  });

  test('convertToMap', async () => {
    const { entries } = await getMockContent();
    const entryMap = convertToMap(entries);

    const ids = [
      '34O95Y8gLXd3jPozdy7gmd',
      'WLITBNhFp0VzHqOwKJAwR',
      '56O29iIIcee0ZcgIuwlHSv',
      '2WLqjLlMJUbc0vCf9UMfjA',
    ];

    expect(entryMap.size).toBe(ids.length);
    ids.forEach((id) => expect(entryMap.has(id)).toBe(true));
  });
});
