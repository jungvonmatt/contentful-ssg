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

const getContentTypeId = (node) => {
  const { sys } = node || {};
  const { contentType } = sys || {};
  const { sys: contentTypeSys } = contentType || {};
  const { id } = contentTypeSys || {};

  return id;
};

const getEnvironmentId = (node) => {
  const { sys } = node || {};
  const { environment } = sys || {};
  const { sys: environmentSys } = environment || {};
  const { id } = environmentSys || {};

  return id;
};

const getContentId = (node) => {
  const { sys } = node || {};
  const { id } = sys || {};
  return id;
};

const getContentName = (node, displayField) => {
  const { fields, sys } = node;
  const { id: fallback = 'unknown' } = sys || {};
  const { [displayField]: field, name, title, id } = fields || {};

  for (const tmp of [field, name, title, id].filter((v) => v)) {
    const [result] = Object.values(tmp);

    if (result && typeof result === 'string') {
      return result;
    }
  }

  return fallback;
};

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

const getSpaces = async (options) => {
  const client = await getManagementClient(options);
  const { items: spaces } = await client.getSpaces();

  return spaces;
};

const getSpace = async (options) => {
  const { spaceId } = options || {};
  const client = await getManagementClient(options);
  return client.getSpace(spaceId);
};

const getEnvironments = async (options) => {
  const space = await getSpace(options);
  const { items: environments } = await space.getEnvironments();

  return environments;
};

const getApiKeys = async (options) => {
  const space = await getSpace(options);

  const { items: apiKeys = [] } = (await space.getApiKeys()) || {};
  const [apiKey] = apiKeys;
  const { accessToken } = apiKey || {};

  const { items: previewApiKeys = [] } = (await space.getPreviewApiKeys()) || {};
  const [previewApiKey] = previewApiKeys;
  const { accessToken: previewAccessToken } = previewApiKey || {};

  return { accessToken, previewAccessToken };
};

/**
 * Get Contentful management client
 * @param {Options} options
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
  // const page = Math.ceil(skip / MAX_ALLOWED_LIMIT) + 1;
  // const pages = Math.ceil(response.total / MAX_ALLOWED_LIMIT);

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

const filterDrafts = (items, includeDrafts) => {
  return includeDrafts ? items : items.filter((item) => !!item.sys.publishedVersion || !!item.sys.archivedVersion);
};

const filterArchived = (items, includeArchived) => {
  return includeArchived ? items : items.filter((item) => !item.sys.archivedVersion);
};
const getNodeName = (node, contentType) => {
  const { sys } = node || {};
  const { type } = sys || {};
  const { name: contentTypeName, displayField } = contentType || {};

  const name = getContentName(node, displayField);
  return `[${contentTypeName || type}] ${name}`;
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
 * @param {object} entity Contentful entity
 * @returns {boolean}
 */
const isContentfulObject = (obj) =>
  Object.prototype.toString.call(obj) === '[object Object]' && Object.keys(obj).includes('sys');

const isLink = (obj) => isContentfulObject(obj) && obj.sys.type === FIELD_TYPE_LINK;

const isAssetLink = (obj) => isLink(obj) && obj.sys.linkType === LINK_TYPE_ASSET;
const isEntryLink = (obj) => isContentfulObject(obj) && obj.sys.linkType === LINK_TYPE_ENTRY;

const isAsset = (obj) => isContentfulObject(obj) && obj.sys.type === LINK_TYPE_ASSET;
const isEntry = (obj) => isContentfulObject(obj) && obj.sys.type === LINK_TYPE_ENTRY;

const getFieldSettings = (contentTypes) =>
  contentTypes.reduce((res, contentType) => {
    const id = getContentId(contentType);
    const fields = contentType.fields.reduce((fields, field) => ({ ...fields, [field.id]: field }), {});
    return { ...res, [id]: fields };
  }, {});

exports.getClient = getClient;
exports.getSpaces = getSpaces;
exports.getSpace = getSpace;
exports.getEnvironments = getEnvironments;
exports.getEnvironment = getEnvironment;
exports.getContent = getContent;
exports.getContentId = getContentId;
exports.getContentTypeId = getContentTypeId;
exports.getContentName = getContentName;
exports.getNodeName = getNodeName;
exports.getEnvironmentId = getEnvironmentId;
exports.isAssetLink = isAssetLink;
exports.isEntryLink = isEntryLink;
exports.isAsset = isAsset;
exports.isEntry = isEntry;
exports.isLink = isLink;
exports.getFieldSettings = getFieldSettings;
exports.getApiKeys = getApiKeys;

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
