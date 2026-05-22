import type { SyncCollection as ContentfulSyncCollection, EntrySkeletonType } from 'contentful';
import {
  getClient,
  getLocales,
  getContentTypes,
  getContent as getContentFromClient,
} from '@jungvonmatt/contentful-client';
import type { ContentfulConfig } from '@jungvonmatt/contentful-client';
import { initializeCache } from './cf-cache.js';

type SyncCollection = ContentfulSyncCollection<EntrySkeletonType, 'WITH_ALL_LOCALES'>;

type SyncOptions = {
  initial?: true;
  nextSyncToken?: string;
};

const sync = async (
  apiClient: ReturnType<typeof getClient>,
  config: ContentfulConfig,
): Promise<SyncCollection> => {
  const cache = initializeCache(config);
  const options: SyncOptions = { initial: true };
  if (cache.hasSyncToken()) {
    options.nextSyncToken = await cache.getSyncToken();
    delete options.initial;
  }

  const response: SyncCollection = await apiClient.sync(options);
  if (response.nextSyncToken) {
    await cache.setSyncToken(response.nextSyncToken);
  }

  return response;
};

/**
 * Sync-aware content fetcher. Routes based on config.sync:
 * - sync=true → uses Contentful Sync API (incremental)
 * - sync=false/undefined → delegates to getContent from client (full pagination)
 */
export const getContentWithSync = async (options: ContentfulConfig & { sync?: boolean }) => {
  if (options.sync) {
    const locales = await getLocales(options);
    const contentTypes = await getContentTypes(options);
    const apiClient = getClient(options);
    const { entries, assets, deletedEntries, deletedAssets } = await sync(apiClient, options);
    return { entries, assets, deletedEntries, deletedAssets, contentTypes, locales };
  }

  return getContentFromClient(options);
};
