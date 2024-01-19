import type {
  ContentfulClientApi,
  CreateClientParams,
  DeletedEntry,
  EntryFields,
  EntrySkeletonType,
  SyncCollection as ContentfulSyncCollection,
} from 'contentful';
import contentful from 'contentful';
import type { ClientAPI as ContentfulManagementApi } from 'contentful-management';
import contentfulManagement from 'contentful-management';
import type { ApiKey, CreateWebhooksProps, QueryOptions, Space } from 'contentful-management/types';
import { createHash } from 'crypto';
import { hostname } from 'os';
import { v4 as uuidv4 } from 'uuid';
import type {
  ContentfulConfig,
  ContentType,
  FieldSettings,
  Locale,
  Node,
  PagedGetOptions,
  SyncOptions,
  CollectionResponse,
  EntryCollection,
  ContentfulCollection,
  EntryRaw,
  AssetRaw,
  NodeRaw,
} from '../types.js';
import { initializeCache } from './cf-cache.js';

type ClientApi = ContentfulClientApi<'WITH_ALL_LOCALES'>;

let client: ClientApi;
let managementClient: ContentfulManagementApi;

export const FIELD_TYPE_SYMBOL = 'Symbol';
export const FIELD_TYPE_TEXT = 'Text';
export const FIELD_TYPE_RICHTEXT = 'RichText';
export const FIELD_TYPE_NUMBER = 'Number';
export const FIELD_TYPE_INTEGER = 'Integer';
export const FIELD_TYPE_DATE = 'Date';
export const FIELD_TYPE_LOCATION = 'Location';
export const FIELD_TYPE_ARRAY = 'Array';
export const FIELD_TYPE_BOOLEAN = 'Boolean';
export const FIELD_TYPE_LINK = 'Link';
export const FIELD_TYPE_OBJECT = 'Object';
export const LINK_TYPE_ASSET = 'Asset';
export const LINK_TYPE_ENTRY = 'Entry';

export const MAX_ALLOWED_LIMIT = 1000;

/**
 * Get contentType id from entry
 * @param {Object} node Contentful entry
 * @returns {String}
 */
export const getContentTypeId = <
  T extends Node | NodeRaw | EntryFields.EntryLink<EntrySkeletonType> | DeletedEntry,
>(
  node: T,
): string => {
  if (node?.sys?.type === 'Asset') {
    return 'asset';
  }

  if (node?.sys?.type === 'DeletedEntry') {
    return 'unknown';
  }

  return node?.sys?.contentType?.sys?.id ?? 'unknown';
};

/**
 * Get environment id id from entry
 * @param {Object} node Contentful entry
 * @returns {String}
 */
export const getEnvironmentId = <T extends Node | NodeRaw>(node: T): string =>
  node?.sys?.environment?.sys?.id ?? 'unknown';

/**
 * Get content id id from entry
 * @param {Object} node Contentful entry
 * @returns {String}
 */
export const getContentId = <
  T extends Node | NodeRaw | ContentType | EntryFields.Link<EntrySkeletonType> | DeletedEntry,
>(
  node: T,
): string => node?.sys?.id ?? 'unknown';

/**
 * Get contentful client api
 * @param {Object} options
 * @returns {*}
 */
const getClient = (options: ContentfulConfig): ClientApi => {
  const { accessToken, previewAccessToken, spaceId, environmentId, preview } = options || {};

  if (client) {
    return client;
  }

  if (accessToken) {
    const params: CreateClientParams = {
      space: spaceId,
      host: preview ? 'preview.contentful.com' : 'cdn.contentful.com',
      accessToken: preview ? previewAccessToken : accessToken,
      environment: environmentId,
    };
    return contentful.createClient(params).withAllLocales;
  }

  throw new Error('You need to login first. Run npx contentful login');
};

/**
 * Get contentful management client api
 * @param {Object} options
 * @returns {*}
 */
const getManagementClient = (options: ContentfulConfig): ContentfulManagementApi => {
  const { managementToken } = options || {};

  if (managementClient) {
    return managementClient;
  }

  if (managementToken) {
    return contentfulManagement.createClient({
      accessToken: managementToken,
    });
  }

  throw new Error('You need to login first. Run npx contentful login');
};

/**
 * Get Contentful spaces
 * @param {Options} options
 * @returns {Array<Object>}
 */
export const getSpaces = async (options: ContentfulConfig): Promise<Space[]> => {
  const client = getManagementClient(options);

  const { items: spaces } = await client.getSpaces();

  return spaces;
};

/**
 * Get Contentful space
 * @param {Options} options
 * @returns {Object}
 */
export const getSpace = async (options: ContentfulConfig) => {
  const { spaceId } = options || {};
  const client = getManagementClient(options);
  return client.getSpace(spaceId);
};

/**
 * Get Contentful environments
 * @param {Options} options
 * @returns {Array<Object>}
 */
export const getEnvironments = async (options: ContentfulConfig) => {
  const space = await getSpace(options);
  const { items: environments } = await space.getEnvironments();

  return environments;
};

/**
 * Get Contentful environment
 * @param {Options} options
 * @returns {Object}
 */
export const getEnvironment = async (options: ContentfulConfig) => {
  const { environmentId, spaceId } = options || {};
  const space = await getSpace(options);

  const { items: environments } = await space.getEnvironments();

  const environmentIds = (environments || []).map((env) => env.sys.id);

  if (environmentId && environmentIds.includes(environmentId)) {
    return space.getEnvironment(environmentId);
  }

  if (environmentId && !environmentIds.includes(environmentId)) {
    throw new Error(`Environment "${environmentId}" is not available in space ${spaceId}"`);
  }

  throw new Error('Missing required parameter: environmentId');
};

/**
 * Fetch api key from contentful
 * @param {Object} options
 * @returns {String} accessToken
 */
export const getApiKey = async (options: ContentfulConfig) => {
  const space = await getSpace(options);

  const { items: apiKeys = [] } = (await space.getApiKeys()) || {};
  const [apiKey] = apiKeys;
  const { accessToken } = apiKey || {};

  return accessToken;
};

/**
 * Fetch preview api key from contentful
 * @param {Object} options
 * @returns {String} previewAccessToken
 */
export const getPreviewApiKey = async (options: ContentfulConfig) => {
  const space = await getSpace(options);

  const { items: previewApiKeys = [] } = await space.getPreviewApiKeys();
  const [previewApiKey] = previewApiKeys;
  const { accessToken: previewAccessToken } = previewApiKey as ApiKey;

  return previewAccessToken;
};

export const getWebhooks = async (options: ContentfulConfig) => {
  const space = await getSpace(options);
  const { items: webhooks = [] } = await space.getWebhooks();

  return webhooks;
};

export const addWebhook = async (
  options: ContentfulConfig,
  id: string,
  data: CreateWebhooksProps,
) => {
  const space = await getSpace(options);

  try {
    const webhook = await space.getWebhook(id);
    return webhook;
  } catch {
    return space.createWebhookWithId(id, data);
  }
};

export const deleteWebhook = async (options: ContentfulConfig, id: string) => {
  const space = await getSpace(options);
  const webhook = await space.getWebhook(id);

  return webhook.delete();
};

export const addWatchWebhook = async (options: ContentfulConfig, url: string) => {
  let topics = [
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
  ];

  if (options.preview) {
    topics = [
      ...topics,
      'ContentType.save',
      'Entry.save',
      'Entry.auto_save',
      'Asset.save',
      'Asset.auto_save',
    ];
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const uuid = url ? createHash('sha1').update(url).digest('hex') : (uuidv4() as string);

  return addWebhook(options, uuid, {
    name: `contentful-ssg (${hostname()})`,
    url,
    httpBasicUsername: null,
    topics,
    filters: [
      {
        equals: [
          {
            doc: 'sys.environment.sys.id',
          },
          options.environmentId,
        ],
      },
    ],
    transformation: {
      includeContentLength: true,
    },

    headers: [],
  });
};

/**
 * Gets all the existing entities based on pagination parameters.
 * The first call will have no aggregated response. Subsequent calls will
 * concatenate the new responses to the original one.
 * Methods:
 * - getContentTypes
 * - getEntries
 * - getAssets
 */

export const pagedGet = async <T, R extends CollectionResponse<T> = ContentfulCollection<T>>(
  apiClient,
  { method, skip = 0, aggregatedResponse = null, query = null }: PagedGetOptions<T>,
): Promise<R> => {
  const fullQuery: QueryOptions = {
    skip,
    limit: MAX_ALLOWED_LIMIT,
    order: 'sys.createdAt,sys.id',
    locale: '*',
    include: 0,
    ...(query || {}),
  };

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const response = (await apiClient[method](fullQuery)) as CollectionResponse<T>;

  if (aggregatedResponse) {
    aggregatedResponse.items = [
      ...aggregatedResponse.items,
      ...response.items,
    ] as CollectionResponse<T>['items'];

    if ((response as EntryCollection).includes) {
      (aggregatedResponse as EntryCollection).includes = {
        Entry: [
          ...((aggregatedResponse as EntryCollection)?.includes?.Entry ?? []),
          ...((response as EntryCollection).includes?.Entry ?? []),
        ],
        Asset: [
          ...((aggregatedResponse as EntryCollection)?.includes?.Asset ?? []),
          ...((response as EntryCollection).includes?.Asset ?? []),
        ],
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

  return aggregatedResponse as R;
};

/**
 * Synchronizes either all the content or only new content since last sync
 * @param apiClient Contentful API client
 * @returns Promise for the collection resulting of a sync operation
 */
type SyncCollection = ContentfulSyncCollection<EntrySkeletonType, 'WITH_ALL_LOCALES'>;
const sync = async (apiClient: ClientApi, config: ContentfulConfig): Promise<SyncCollection> => {
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
 * Gets all the existing entities based on pagination parameters.
 * The first call will have no aggregated response. Subsequent calls will
 * concatenate the new responses to the original one.
 * Methods:
 * - getContentTypes
 * - getEntries
 * - getAssets
 * - getLocales
 */
export const getContent = async (options: ContentfulConfig) => {
  const apiClient = getClient(options);

  const { items: locales } = await pagedGet<Locale>(apiClient, {
    method: 'getLocales',
  });

  const { items: contentTypes } = await pagedGet<ContentType>(apiClient, {
    method: 'getContentTypes',
  });

  // Use the sync api if watch mode is enabled
  if (options.sync) {
    const { entries, assets, deletedEntries, deletedAssets } = await sync(apiClient, options);
    return { entries, assets, deletedEntries, deletedAssets, contentTypes, locales };
  }

  // EntryCollections can have linked entries/assets included:
  // https://www.contentful.com/developers/docs/references/content-delivery-api/#/reference/links
  const { items: entries, includes } = await pagedGet<EntryRaw, EntryCollection>(apiClient, {
    method: 'getEntries',
    query: options?.query ?? null,
  });

  const { items: assets } = await pagedGet<AssetRaw>(apiClient, {
    method: 'getAssets',
  });

  return {
    entries: [...entries, ...(includes?.Entry ?? [])],
    assets: [...assets, ...(includes?.Asset ?? [])],
    contentTypes,
    locales,
  };
};

export const getEntriesLinkedToEntry = async (options: ContentfulConfig, id: string) => {
  const apiClient = getClient(options);

  const { items: entries } = await pagedGet<EntryRaw>(apiClient, {
    method: 'getEntries',
    query: { links_to_entry: id },
  });

  return entries;
};

export const getEntriesLinkedToAsset = async (options: ContentfulConfig, id: string) => {
  const apiClient = getClient(options);

  const { items: entries } = await pagedGet<EntryRaw>(apiClient, {
    method: 'getEntries',
    query: { links_to_asset: id },
  });

  return entries;
};

/**
 * Check if the passed object looks lika a regular contentful entity (entry or asset)
 * @param {Object} entity Contentful entity
 * @returns {Boolean}
 */
export const isContentfulObject = (obj: any) =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  Object.prototype.toString.call(obj) === '[object Object]' && Object.keys(obj).includes('sys');

/**
 * Check if the passed object is a contentful link object
 * @param {Object} entity Contentful entity
 * @returns {Boolean}
 */
export const isLink = (obj: any) => isContentfulObject(obj) && obj.sys.type === FIELD_TYPE_LINK;

/**
 * Check if the passed object is a contentful asset link object
 * @param {Object} entity Contentful entity
 * @returns {Boolean}
 */
export const isAssetLink = (obj: any) => isLink(obj) && obj.sys.linkType === LINK_TYPE_ASSET;

/**
 * Check if the passed object is a contentful entry link object
 * @param {Object} entity Contentful entity
 * @returns {Boolean}
 */
export const isEntryLink = (obj: any) =>
  isContentfulObject(obj) && obj.sys.linkType === LINK_TYPE_ENTRY;

/**
 * Check if the passed object is a contentful asset object
 * @param {Object} entity Contentful entity
 * @returns {Boolean}
 */
export const isAsset = (obj: any) => isContentfulObject(obj) && obj.sys.type === LINK_TYPE_ASSET;

/**
 * Check if the passed object is a contentful entry object
 * @param {Object} entity Contentful entity
 * @returns {Boolean}
 */
export const isEntry = (obj: any) => isContentfulObject(obj) && obj.sys.type === LINK_TYPE_ENTRY;

/**
 * Convert contenttype list to a map
 * @param {Array} entity Contentful entity
 * @returns {Object} e.g. {'contenttype-id': { 'field-1-id': { required: ..., type: ..., ...}}}
 */
export const getFieldSettings = (contentTypes: ContentType[]): FieldSettings =>
  contentTypes.reduce((res, contentType) => {
    const id = getContentId(contentType);
    const fields = contentType.fields.reduce(
      (fields, field) => ({ ...fields, [field.id]: field }),
      {},
    );
    return { ...res, [id]: fields };
  }, {});

/**
 * Convert entries/assets array to map
 * @param {Array} nodes Nodes array (entries/assets)
 */
export const convertToMap = <T extends Node | NodeRaw>(nodes: T[] = []) =>
  new Map(nodes.map((node) => [getContentId(node), node]));
