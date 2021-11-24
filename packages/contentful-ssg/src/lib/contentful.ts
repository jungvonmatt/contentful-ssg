/* eslint-disable @typescript-eslint/naming-convention */
import type { ClientAPI as ContentfulManagementApi } from 'contentful-management';
import type { Space, ApiKey, QueryOptions, CollectionProp } from 'contentful-management/types';
import type { CreateClientParams, ContentfulClientApi, EntryFields } from 'contentful';
import type {
  ContentfulConfig,
  FieldSettings,
  Node,
  Entry,
  Asset,
  ContentType,
  Locale,
} from '../types.js';
import contentful from 'contentful';
import contentfulManagement from 'contentful-management';

let client: ContentfulClientApi;
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
export const getContentTypeId = <T extends Node | EntryFields.Link<unknown>>(node: T): string =>
  node?.sys?.contentType?.sys?.id ?? 'unknown';

/**
 * Get environment id id from entry
 * @param {Object} node Contentful entry
 * @returns {String}
 */
export const getEnvironmentId = <T extends Node>(node: T): string =>
  node?.sys?.environment?.sys?.id ?? 'unknown';

/**
 * Get content id id from entry
 * @param {Object} node Contentful entry
 * @returns {String}
 */
export const getContentId = <T extends Node | ContentType | EntryFields.Link<unknown>>(
  node: T
): string => node?.sys?.id ?? 'unknown';

/**
 * Get contentful client api
 * @param {Object} options
 * @returns {*}
 */
const getClient = (options: ContentfulConfig): ContentfulClientApi => {
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
    return contentful.createClient(params);
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

interface PagedGetOptions<T> {
  method: string;
  skip?: number;
  aggregatedResponse?: CollectionProp<T>;
  query?: QueryOptions;
}
/**
 * Gets all the existing entities based on pagination parameters.
 * The first call will have no aggregated response. Subsequent calls will
 * concatenate the new responses to the original one.
 * Methods:
 * - getContentTypes
 * - getEntries
 * - getAssets
 */
const pagedGet = async <T>(
  apiClient,
  { method, skip = 0, aggregatedResponse = null, query = null }: PagedGetOptions<T>
): Promise<CollectionProp<T>> => {
  const fullQuery: QueryOptions = {
    skip,
    limit: MAX_ALLOWED_LIMIT,
    order: 'sys.createdAt,sys.id',
    locale: '*',
    include: 0,
    ...(query || {}),
  };

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const response = (await apiClient[method](fullQuery)) as CollectionProp<T>;

  if (aggregatedResponse) {
    aggregatedResponse.items = aggregatedResponse.items.concat(response.items);
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

  return aggregatedResponse;
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
  const { items: entries } = await pagedGet<Entry>(apiClient, {
    method: 'getEntries',
  });
  const { items: assets } = await pagedGet<Asset>(apiClient, {
    method: 'getAssets',
  });

  return { entries, assets, contentTypes, locales };
};

/**
 * Check if the passed object looks lika a regular contentful entity (entry or asset)
 * @param {Object} entity Contentful entity
 * @returns {Boolean}
 */
export const isContentfulObject = (obj) =>
  Object.prototype.toString.call(obj) === '[object Object]' && Object.keys(obj).includes('sys');

/**
 * Check if the passed object is a contentful link object
 * @param {Object} entity Contentful entity
 * @returns {Boolean}
 */
export const isLink = (obj) => isContentfulObject(obj) && obj.sys.type === FIELD_TYPE_LINK;

/**
 * Check if the passed object is a contentful asset link object
 * @param {Object} entity Contentful entity
 * @returns {Boolean}
 */
export const isAssetLink = (obj) => isLink(obj) && obj.sys.linkType === LINK_TYPE_ASSET;

/**
 * Check if the passed object is a contentful entry link object
 * @param {Object} entity Contentful entity
 * @returns {Boolean}
 */
export const isEntryLink = (obj) => isContentfulObject(obj) && obj.sys.linkType === LINK_TYPE_ENTRY;

/**
 * Check if the passed object is a contentful asset object
 * @param {Object} entity Contentful entity
 * @returns {Boolean}
 */
export const isAsset = (obj) => isContentfulObject(obj) && obj.sys.type === LINK_TYPE_ASSET;

/**
 * Check if the passed object is a contentful entry object
 * @param {Object} entity Contentful entity
 * @returns {Boolean}
 */
export const isEntry = (obj) => isContentfulObject(obj) && obj.sys.type === LINK_TYPE_ENTRY;

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
      {}
    );
    return { ...res, [id]: fields };
  }, {});

/**
 * Convert entries/assets array to map
 * @param {Array} nodes Nodes array (entries/assets)
 */
export const convertToMap = <T extends Node>(nodes: T[] = []) =>
  new Map(nodes.map((node) => [getContentId(node), node]));
