import type { ContentfulClientApi, CreateClientParams, EntrySkeletonType } from 'contentful';
import { createClient } from 'contentful';
import { createHash } from 'crypto';
import type {
  AssetRaw,
  ContentfulCollection,
  ContentfulConfig,
  ContentType,
  DeliveryQueryOptions,
  EntryCollection,
  EntryRaw,
  Locale,
} from './types.js';

type ClientApi = ContentfulClientApi<'WITH_ALL_LOCALES'>;
type CollectionResponse<T> = {
  items: T[];
  total: number;
  includes?: { Entry?: EntryRaw[]; Asset?: AssetRaw[] };
};
type PagedGetOptions<T> = {
  method: string;
  skip?: number;
  aggregatedResponse?: CollectionResponse<T> | null;
  query?: DeliveryQueryOptions | null;
};

export const MAX_ALLOWED_LIMIT = 1000;

let client: ClientApi;
let clientKey: string;

/**
 * Get or create the Contentful Delivery API client.
 * Hash-based singleton — recreates if options change.
 */
export const getClient = (options: ContentfulConfig): ClientApi => {
  const { accessToken, previewAccessToken, spaceId, environmentId, preview } = options;

  const token = preview ? previewAccessToken : accessToken;
  const host = preview ? 'preview.contentful.com' : 'cdn.contentful.com';
  const key = createHash('sha256')
    .update(`${token}::${host}::${spaceId}::${environmentId}`)
    .digest('hex');

  if (client && clientKey === key) {
    return client;
  }

  if (!token) {
    throw new Error('You need to login first. Run npx contentful login');
  }

  const params: CreateClientParams = {
    space: spaceId,
    host,
    accessToken: token,
    environment: environmentId,
  };

  client = createClient(params).withAllLocales;
  clientKey = key;
  return client;
};

/**
 * Reset the cached delivery client (testing).
 */
export const resetClient = () => {
  client = undefined as unknown as ClientApi;
  clientKey = '';
};

/**
 * Recursive pagination for CDA endpoints (internal).
 */
const pagedGet = async <T>(
  apiClient: ClientApi,
  { method, skip = 0, aggregatedResponse = null, query = null }: PagedGetOptions<T>,
): Promise<CollectionResponse<T>> => {
  const fullQuery: DeliveryQueryOptions = {
    skip,
    limit: MAX_ALLOWED_LIMIT,
    order: 'sys.createdAt,sys.id',
    include: 0,
    ...query,
  };

  const response = (await (apiClient as any)[method](fullQuery)) as CollectionResponse<T>;

  if (aggregatedResponse) {
    aggregatedResponse.items = [...aggregatedResponse.items, ...response.items];
    if (response.includes) {
      aggregatedResponse.includes = {
        Entry: [...(aggregatedResponse.includes?.Entry ?? []), ...(response.includes?.Entry ?? [])],
        Asset: [...(aggregatedResponse.includes?.Asset ?? []), ...(response.includes?.Asset ?? [])],
      };
    }
  } else {
    aggregatedResponse = response;
  }

  if (skip + MAX_ALLOWED_LIMIT <= response.total) {
    return pagedGet(apiClient, {
      method,
      skip: skip + MAX_ALLOWED_LIMIT,
      aggregatedResponse,
      query,
    });
  }

  return aggregatedResponse!;
};

/**
 * Fetch all locales via pagination.
 */
export const getLocales = async (options: ContentfulConfig): Promise<Locale[]> => {
  const apiClient = getClient(options);
  const { items } = await pagedGet<Locale>(apiClient, { method: 'getLocales' });
  return items;
};

/**
 * Fetch all content types via pagination.
 */
export const getContentTypes = async (options: ContentfulConfig): Promise<ContentType[]> => {
  const apiClient = getClient(options);
  const { items } = await pagedGet<ContentType>(apiClient, { method: 'getContentTypes' });
  return items;
};

/**
 * Fetch all content (locales, content types, entries, assets) via pagination.
 * Does NOT include sync support — that stays in contentful-ssg.
 */
export const getContent = async (options: ContentfulConfig) => {
  const apiClient = getClient(options);

  const { items: locales } = await pagedGet<Locale>(apiClient, { method: 'getLocales' });
  const { items: contentTypes } = await pagedGet<ContentType>(apiClient, {
    method: 'getContentTypes',
  });
  const { items: entries, includes } = await pagedGet<EntryRaw>(apiClient, {
    method: 'getEntries',
    query: options?.query ?? null,
  });
  const { items: assets } = await pagedGet<AssetRaw>(apiClient, { method: 'getAssets' });

  return {
    entries: [...entries, ...(includes?.Entry ?? [])],
    assets: [...assets, ...(includes?.Asset ?? [])],
    contentTypes,
    locales,
  };
};

export const getEntriesLinkedToEntry = async (options: ContentfulConfig, id: string) => {
  const apiClient = getClient(options);
  const { items } = await pagedGet<EntryRaw>(apiClient, {
    method: 'getEntries',
    query: { links_to_entry: id },
  });
  return items;
};

export const getEntriesLinkedToAsset = async (options: ContentfulConfig, id: string) => {
  const apiClient = getClient(options);
  const { items } = await pagedGet<EntryRaw>(apiClient, {
    method: 'getEntries',
    query: { links_to_asset: id },
  });
  return items;
};
