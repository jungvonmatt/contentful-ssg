import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from 'contentful';
import {
  getClient,
  resetClient,
  getLocales,
  getContentTypes,
  getContent,
  getEntriesLinkedToEntry,
  getEntriesLinkedToAsset,
  MAX_ALLOWED_LIMIT,
} from './delivery.js';
import type { ContentfulConfig } from './types.js';

const mockClient = {
  getLocales: vi.fn(),
  getContentTypes: vi.fn(),
  getEntries: vi.fn(),
  getAssets: vi.fn(),
};

vi.mock('contentful', () => ({
  createClient: vi.fn(() => ({
    withAllLocales: mockClient,
  })),
}));

const baseOptions: ContentfulConfig = {
  spaceId: 'test-space',
  environmentId: 'master',
  accessToken: 'test-token',
  previewAccessToken: 'preview-token',
  managementToken: 'mgmt-token',
};

describe('delivery', () => {
  beforeEach(() => {
    resetClient();
    vi.clearAllMocks();
  });

  describe('getClient', () => {
    it('creates client with correct params', () => {
      getClient(baseOptions);

      expect(createClient).toHaveBeenCalledWith({
        space: 'test-space',
        host: 'cdn.contentful.com',
        accessToken: 'test-token',
        environment: 'master',
      });
    });

    it('returns cached client on same options', () => {
      const client1 = getClient(baseOptions);
      const client2 = getClient(baseOptions);

      expect(client1).toBe(client2);
      expect(createClient).toHaveBeenCalledTimes(1);
    });

    it('recreates client when options change', () => {
      getClient(baseOptions);
      getClient({ ...baseOptions, accessToken: 'different-token' });

      expect(createClient).toHaveBeenCalledTimes(2);
    });

    it('throws when no token provided', () => {
      expect(() => getClient({ ...baseOptions, accessToken: '' })).toThrow(
        'You need to login first. Run npx contentful login',
      );
    });

    it('uses preview host when preview is true', () => {
      getClient({ ...baseOptions, preview: true });

      expect(createClient).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'preview.contentful.com',
          accessToken: 'preview-token',
        }),
      );
    });
  });

  describe('resetClient', () => {
    it('after reset, getClient creates a new client', () => {
      getClient(baseOptions);
      expect(createClient).toHaveBeenCalledTimes(1);

      resetClient();
      getClient(baseOptions);
      expect(createClient).toHaveBeenCalledTimes(2);
    });
  });

  describe('getLocales', () => {
    it('returns items from paginated response', async () => {
      const locales = [{ code: 'en-US', name: 'English' }];
      mockClient.getLocales.mockResolvedValue({ items: locales, total: 1 });

      const result = await getLocales(baseOptions);

      expect(result).toEqual(locales);
      expect(mockClient.getLocales).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          limit: MAX_ALLOWED_LIMIT,
          order: 'sys.createdAt,sys.id',
          include: 0,
        }),
      );
    });
  });

  describe('getContentTypes', () => {
    it('returns items from paginated response', async () => {
      const contentTypes = [{ sys: { id: 'page' }, name: 'Page', fields: [] }];
      mockClient.getContentTypes.mockResolvedValue({ items: contentTypes, total: 1 });

      const result = await getContentTypes(baseOptions);

      expect(result).toEqual(contentTypes);
      expect(mockClient.getContentTypes).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          limit: MAX_ALLOWED_LIMIT,
        }),
      );
    });
  });

  describe('getContent', () => {
    it('returns correct shape with entries, assets, contentTypes, locales', async () => {
      const locales = [{ code: 'en-US' }];
      const contentTypes = [{ sys: { id: 'page' } }];
      const entries = [{ sys: { id: 'entry-1' } }];
      const assets = [{ sys: { id: 'asset-1' } }];

      mockClient.getLocales.mockResolvedValue({ items: locales, total: 1 });
      mockClient.getContentTypes.mockResolvedValue({ items: contentTypes, total: 1 });
      mockClient.getEntries.mockResolvedValue({ items: entries, total: 1 });
      mockClient.getAssets.mockResolvedValue({ items: assets, total: 1 });

      const result = await getContent(baseOptions);

      expect(result).toEqual({
        entries,
        assets,
        contentTypes,
        locales,
      });
    });

    it('merges includes.Entry into entries', async () => {
      const locales = [{ code: 'en-US' }];
      const contentTypes = [{ sys: { id: 'page' } }];
      const entries = [{ sys: { id: 'entry-1' } }];
      const includedEntries = [{ sys: { id: 'entry-linked' } }];
      const assets = [{ sys: { id: 'asset-1' } }];

      mockClient.getLocales.mockResolvedValue({ items: locales, total: 1 });
      mockClient.getContentTypes.mockResolvedValue({ items: contentTypes, total: 1 });
      mockClient.getEntries.mockResolvedValue({
        items: entries,
        total: 1,
        includes: { Entry: includedEntries },
      });
      mockClient.getAssets.mockResolvedValue({ items: assets, total: 1 });

      const result = await getContent(baseOptions);

      expect(result.entries).toEqual([...entries, ...includedEntries]);
    });

    it('calls all four SDK methods', async () => {
      mockClient.getLocales.mockResolvedValue({ items: [], total: 0 });
      mockClient.getContentTypes.mockResolvedValue({ items: [], total: 0 });
      mockClient.getEntries.mockResolvedValue({ items: [], total: 0 });
      mockClient.getAssets.mockResolvedValue({ items: [], total: 0 });

      await getContent(baseOptions);

      expect(mockClient.getLocales).toHaveBeenCalled();
      expect(mockClient.getContentTypes).toHaveBeenCalled();
      expect(mockClient.getEntries).toHaveBeenCalled();
      expect(mockClient.getAssets).toHaveBeenCalled();
    });
  });

  describe('getEntriesLinkedToEntry', () => {
    it('passes links_to_entry query parameter', async () => {
      mockClient.getEntries.mockResolvedValue({ items: [], total: 0 });

      await getEntriesLinkedToEntry(baseOptions, 'entry-123');

      expect(mockClient.getEntries).toHaveBeenCalledWith(
        expect.objectContaining({
          links_to_entry: 'entry-123',
        }),
      );
    });
  });

  describe('getEntriesLinkedToAsset', () => {
    it('passes links_to_asset query parameter', async () => {
      mockClient.getEntries.mockResolvedValue({ items: [], total: 0 });

      await getEntriesLinkedToAsset(baseOptions, 'asset-456');

      expect(mockClient.getEntries).toHaveBeenCalledWith(
        expect.objectContaining({
          links_to_asset: 'asset-456',
        }),
      );
    });
  });
});
