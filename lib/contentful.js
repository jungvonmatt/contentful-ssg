const contentfulManagement = require('contentful-management');
const contentful = require('contentful');
const DEFAULT_ENVIRONMENT = 'master';

let client;
let managementClient;

const FIELD_TYPE_SYMBOL = 'Symbol';
const FIELD_TYPE_TEXT = 'Text';
const FIELD_TYPE_RICHTEXT = 'RichText';
const FIELD_TYPE_NUMBER = 'Number';
const FIELD_TYPE_INTEGER = 'Integer';
const FIELD_TYPE_DATE = 'Date';
const FIELD_TYPE_LOCATION = 'Location';
const FIELD_TYPE_ARRAY = 'Array';
const FIELD_TYPE_BOOLEAN = 'Boolean';
const FIELD_TYPE_LINK = 'Link';
const FIELD_TYPE_OBJECT = 'Object';
const LINK_TYPE_ASSET = 'Asset';
const LINK_TYPE_ENTRY = 'Entry';

const MAX_ALLOWED_LIMIT = 1000;

/**
 * Get contentType id from entry
 * @param {Object} node Contentful entry
 * @returns {String}
 */
const getContentTypeId = (node) => {
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
const getEnvironmentId = (node) => {
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
const getContentId = (node) => {
  const { sys } = node || {};
  const { id } = sys || {};
  return id;
};

/**
 * Get contentful client api
 * @param {Object} options
 * @returns {*}
 */
const getClient = async (options) => {
  const { accessToken, previewAccessToken, spaceId, environmentId, previewMode } = options || {};

  if (client) {
    return client;
  }

  if (accessToken) {
    client = await contentful.createClient({
      space: spaceId,
      host: previewMode ? 'preview.contentful.com' : 'cdn.contentful.com',
      accessToken: previewMode ? previewAccessToken : accessToken,
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
const getManagementClient = async (options) => {
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
const getSpaces = async (options) => {
  const client = await getManagementClient(options);
  const { items: spaces } = await client.getSpaces();

  return spaces;
};

/**
 * Get Contentful space
 * @param {Options} options
 * @returns {Object}
 */
const getSpace = async (options) => {
  const { spaceId } = options || {};
  const client = await getManagementClient(options);
  return client.getSpace(spaceId);
};

/**
 * Get Contentful environments
 * @param {Options} options
 * @returns {Array<Object>}
 */
const getEnvironments = async (options) => {
  const space = await getSpace(options);
  const { items: environments } = await space.getEnvironments();

  return environments;
};

/**
 * Get Contentful environment
 * @param {Options} options
 * @returns {Object}
 */
const getEnvironment = async (options) => {
  const { environment, branch, fallbackEnvironment } = options || {};
  const space = await getSpace(options);

  const { items: environments } = await space.getEnvironments();

  const environmentIds = (environments || []).map((env) => env.sys.id);

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
const getApiKey = async (options) => {
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
const getPreviewApiKey = async (options) => {
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
const pagedGet = async (apiClient, { method, skip = 0, aggregatedResponse = null, query = null }) => {
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
    aggregatedResponse.items = aggregatedResponse.items.concat(response.items);
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
const getContent = async (options) => {
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
const isContentfulObject = (obj) =>
  Object.prototype.toString.call(obj) === '[object Object]' && Object.keys(obj).includes('sys');

/**
 * Check if the passed object is a contentful link object
 * @param {Object} entity Contentful entity
 * @returns {Boolean}
 */
const isLink = (obj) => isContentfulObject(obj) && obj.sys.type === FIELD_TYPE_LINK;

/**
 * Check if the passed object is a contentful asset link object
 * @param {Object} entity Contentful entity
 * @returns {Boolean}
 */
const isAssetLink = (obj) => isLink(obj) && obj.sys.linkType === LINK_TYPE_ASSET;

/**
 * Check if the passed object is a contentful entry link object
 * @param {Object} entity Contentful entity
 * @returns {Boolean}
 */
const isEntryLink = (obj) => isContentfulObject(obj) && obj.sys.linkType === LINK_TYPE_ENTRY;

/**
 * Check if the passed object is a contentful asset object
 * @param {Object} entity Contentful entity
 * @returns {Boolean}
 */
const isAsset = (obj) => isContentfulObject(obj) && obj.sys.type === LINK_TYPE_ASSET;

/**
 * Check if the passed object is a contentful entry object
 * @param {Object} entity Contentful entity
 * @returns {Boolean}
 */
const isEntry = (obj) => isContentfulObject(obj) && obj.sys.type === LINK_TYPE_ENTRY;

/**
 * Convert contenttype list to a map
 * @param {Array} entity Contentful entity
 * @returns {Object} e.g. {'contenttype-id': { 'field-1-id': { required: ..., type: ..., ...}}}
 */
const getFieldSettings = (contentTypes) =>
  contentTypes.reduce((res, contentType) => {
    const id = getContentId(contentType);
    const fields = contentType.fields.reduce((fields, field) => ({ ...fields, [field.id]: field }), {});
    return { ...res, [id]: fields };
  }, {});

/**
 * Convert entries/assets array to map
 * @param {Array} nodes Nodes array (entries/assets)
 */
const convertToMap = (nodes) => new Map(nodes.map((node) => [getContentId(node), node]));

exports.getClient = getClient;
exports.getSpaces = getSpaces;
exports.getSpace = getSpace;
exports.getEnvironments = getEnvironments;
exports.getEnvironment = getEnvironment;
exports.getContent = getContent;
exports.getContentId = getContentId;
exports.getContentTypeId = getContentTypeId;
exports.getEnvironmentId = getEnvironmentId;
exports.isAssetLink = isAssetLink;
exports.isEntryLink = isEntryLink;
exports.isAsset = isAsset;
exports.isEntry = isEntry;
exports.isLink = isLink;
exports.getFieldSettings = getFieldSettings;
exports.getApiKey = getApiKey;
exports.getPreviewApiKey = getPreviewApiKey;
exports.convertToMap = convertToMap;

// Constants
exports.FIELD_TYPE_SYMBOL = FIELD_TYPE_SYMBOL;
exports.FIELD_TYPE_TEXT = FIELD_TYPE_TEXT;
exports.FIELD_TYPE_RICHTEXT = FIELD_TYPE_RICHTEXT;
exports.FIELD_TYPE_NUMBER = FIELD_TYPE_NUMBER;
exports.FIELD_TYPE_INTEGER = FIELD_TYPE_INTEGER;
exports.FIELD_TYPE_DATE = FIELD_TYPE_DATE;
exports.FIELD_TYPE_LOCATION = FIELD_TYPE_LOCATION;
exports.FIELD_TYPE_ARRAY = FIELD_TYPE_ARRAY;
exports.FIELD_TYPE_OBJECT = FIELD_TYPE_OBJECT;
exports.FIELD_TYPE_BOOLEAN = FIELD_TYPE_BOOLEAN;
exports.FIELD_TYPE_LINK = FIELD_TYPE_LINK;
exports.LINK_TYPE_ASSET = LINK_TYPE_ASSET;
exports.LINK_TYPE_ENTRY = LINK_TYPE_ENTRY;
