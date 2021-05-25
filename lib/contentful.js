import contentful from 'contentful';
import contentfulManagement from 'contentful-management';
const DEFAULT_ENVIRONMENT = 'master';

let client;
let managementClient;

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

const MAX_ALLOWED_LIMIT = 1000;

/**
 * Get contentType id from entry
 * @param {Object} node Contentful entry
 * @returns {String}
 */
export const getContentTypeId = (node) => {
  const { sys } = node || {};
  const { contentType } = sys || {};
  const { sys: contentTypeSys } = contentType || {};
  const { id } = contentTypeSys || {};

  return id;
};

/**
 * Get environment id id from entry
 * @param {Object} node Contentful entry
 * @returns {String}
 */
export const getEnvironmentId = (node) => {
  const { sys } = node || {};
  const { environment } = sys || {};
  const { sys: environmentSys } = environment || {};
  const { id } = environmentSys || {};

  return id;
};

/**
 * Get content id id from entry
 * @param {Object} node Contentful entry
 * @returns {String}
 */
export const getContentId = (node) => {
  const { sys } = node || {};
  const { id } = sys || {};
  return id;
};

/**
 * Get contentful client api
 * @param {Object} options
 * @returns {*}
 */
export const getClient = async (options) => {
  const { accessToken, previewAccessToken, spaceId, environmentId, preview } = options || {};

  if (client) {
    return client;
  }

  if (accessToken) {
    client = await contentful.createClient({
      space: spaceId,
      host: preview ? 'preview.contentful.com' : 'cdn.contentful.com',
      accessToken: preview ? previewAccessToken : accessToken,
      environment: environmentId,
    });
    return client;
  }

  throw new Error('You need to login first. Run npx contentful login');
};

/**
 * Get contentful management client api
 * @param {Object} options
 * @returns {*}
 */
export const getManagementClient = async (options) => {
  const { managementToken } = options || {};
  if (managementClient) {
    return managementClient;
  }

  if (managementToken) {
    managementClient = await contentfulManagement.createClient({
      accessToken: managementToken,
    });
    return managementClient;
  }

  throw new Error('You need to login first. Run npx contentful login');
};

/**
 * Get Contentful spaces
 * @param {Options} options
 * @returns {Array<Object>}
 */
export const getSpaces = async (options) => {
  const client = await getManagementClient(options);
  const { items: spaces } = await client.getSpaces();

  return spaces;
};

/**
 * Get Contentful space
 * @param {Options} options
 * @returns {Object}
 */
export const getSpace = async (options) => {
  const { spaceId } = options || {};
  const client = await getManagementClient(options);
  return client.getSpace(spaceId);
};

/**
 * Get Contentful environments
 * @param {Options} options
 * @returns {Array<Object>}
 */
export const getEnvironments = async (options) => {
  const space = await getSpace(options);
  const { items: environments } = await space.getEnvironments();

  return environments;
};

/**
 * Get Contentful environment
 * @param {Options} options
 * @returns {Object}
 */
export const getEnvironment = async (options) => {
  const { environment, branch, fallbackEnvironment } = options || {};
  const space = await getSpace(options);

  const { items: environments } = await space.getEnvironments();

  const environmentIds = (environments || []).map((environment_) => environment_.sys.id);

  const targetEnvironment = environment || branch;
  if (targetEnvironment && environmentIds.includes(targetEnvironment)) {
    return space.getEnvironment(targetEnvironment);
  }

  return space.getEnvironment(fallbackEnvironment || DEFAULT_ENVIRONMENT);
};

/**
 * Fetch api key from contentful
 * @param {Object} options
 * @returns {String} accessToken
 */
export const getApiKey = async (options) => {
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
export const getPreviewApiKey = async (options) => {
  const space = await getSpace(options);

  const { items: previewApiKeys = [] } = (await space.getPreviewApiKeys()) || {};
  const [previewApiKey] = previewApiKeys;
  const { accessToken: previewAccessToken } = previewApiKey || {};

  return previewAccessToken;
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
export const pagedGet = async (apiClient, { method, skip = 0, aggregatedResponse, query }) => {
  const fullQuery = {
    skip: skip,
    limit: MAX_ALLOWED_LIMIT,
    order: 'sys.createdAt,sys.id',
    locale: '*',
    include: 0,
    ...(query || {}),
  };

  const response = await apiClient[method](fullQuery);

  if (!aggregatedResponse) {
    aggregatedResponse = response;
  } else {
    aggregatedResponse.items = [...aggregatedResponse.items, ...response.items];
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
export const getContent = async (options) => {
  const { contentType } = options;
  const apiClient = await getClient(options);

  const { items: locales } = await pagedGet(apiClient, {
    method: 'getLocales',
  });

  const { items: contentTypes } = await pagedGet(apiClient, {
    method: 'getContentTypes',
  });
  const { items: entries } = await pagedGet(apiClient, {
    method: 'getEntries',
  });
  const { items: assets } = await pagedGet(apiClient, {
    method: 'getAssets',
  });

  return { entries, assets, contentTypes, locales };
};

/**
 * Check if the passed object looks lika a regular contentful entity (entry or asset)
 * @param {Object} entity Contentful entity
 * @returns {Boolean}
 */
export const isContentfulObject = (object) =>
  Object.prototype.toString.call(object) === '[object Object]' && Object.keys(object).includes('sys');

/**
 * Check if the passed object is a contentful link object
 * @param {Object} entity Contentful entity
 * @returns {Boolean}
 */
export const isLink = (object) => isContentfulObject(object) && object.sys.type === FIELD_TYPE_LINK;

/**
 * Check if the passed object is a contentful asset link object
 * @param {Object} entity Contentful entity
 * @returns {Boolean}
 */
export const isAssetLink = (object) => isLink(object) && object.sys.linkType === LINK_TYPE_ASSET;

/**
 * Check if the passed object is a contentful entry link object
 * @param {Object} entity Contentful entity
 * @returns {Boolean}
 */
export const isEntryLink = (object) => isContentfulObject(object) && object.sys.linkType === LINK_TYPE_ENTRY;

/**
 * Check if the passed object is a contentful asset object
 * @param {Object} entity Contentful entity
 * @returns {Boolean}
 */
export const isAsset = (object) => isContentfulObject(object) && object.sys.type === LINK_TYPE_ASSET;

/**
 * Check if the passed object is a contentful entry object
 * @param {Object} entity Contentful entity
 * @returns {Boolean}
 */
export const isEntry = (object) => isContentfulObject(object) && object.sys.type === LINK_TYPE_ENTRY;

/**
 * Convert contenttype list to a map
 * @param {Array} entity Contentful entity
 * @returns {Object} e.g. {'contenttype-id': { 'field-1-id': { required: ..., type: ..., ...}}}
 */
export const getFieldSettings = (contentTypes) =>
  contentTypes.reduce((result, contentType) => {
    const id = getContentId(contentType);
    const fields = contentType.fields.reduce((fields, field) => ({ ...fields, [field.id]: field }), {});
    return { ...result, [id]: fields };
  }, {});

/**
 * Convert entries/assets array to map
 * @param {Array} nodes Nodes array (entries/assets)
 */
export const convertToMap = (nodes = []) => new Map(nodes.map((node) => [getContentId(node), node]));
