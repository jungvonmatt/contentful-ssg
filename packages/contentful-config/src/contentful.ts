import type { SetRequired } from 'type-fest';
import type { ApiKey, ClientAPI, ClientOptions, Space } from 'contentful-management';
import contentful from 'contentful-management';

let client: ClientAPI;

export type ContentfulOptions = {
  accessToken: ClientOptions['accessToken'];
  host?: ClientOptions['host'];
  managementToken?: ClientOptions['accessToken'];
  previewAccessToken?: ClientOptions['accessToken'];
  environmentId?: string;
  activeEnvironmentId?: string;
  spaceId?: string;
  activeSpaceId?: string;
};

/**
 * Get contentful management client api
 */
const getClient = (options: ContentfulOptions) => {
  const { accessToken, managementToken, host } = options || {};

  if (client) {
    return client;
  }

  const params: ClientOptions = {
    accessToken: managementToken || accessToken,
  };

  if (host) {
    params.host = host;
  }

  if (params.accessToken) {
    client = contentful.createClient(params);
    return client;
  }

  throw new Error(
    'You need to login first. Run npx contentful login or pass the contentful management token',
  );
};

/**
 * Get Contentful spaces
 */
export const getSpaces = async (options: ContentfulOptions): Promise<Space[]> => {
  const client = getClient(options);

  const { items: spaces } = await client.getSpaces();

  return spaces;
};

/**
 * Get Contentful space
 */
export const getSpace = async (options: SetRequired<ContentfulOptions, 'spaceId'>) => {
  const { spaceId } = options || {};
  const client = getClient(options);
  return client.getSpace(spaceId);
};

/**
 * Get Contentful environments
 */
export const getEnvironments = async (options: SetRequired<ContentfulOptions, 'spaceId'>) => {
  const space = await getSpace(options);
  const { items: environments } = await space.getEnvironments();

  return environments;
};

/**
 * Get Contentful environment
 */
export const getEnvironment = async (
  options: SetRequired<ContentfulOptions, 'spaceId' | 'environmentId'>,
) => {
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
 */
export const getApiKey = async (options: SetRequired<ContentfulOptions, 'spaceId'>) => {
  const space = await getSpace(options);

  const { items: apiKeys = [] } = (await space.getApiKeys()) || {};
  const [apiKey] = apiKeys;
  const { accessToken } = apiKey || {};

  return accessToken;
};

/**
 * Fetch preview api key from contentful
 */
export const getPreviewApiKey = async (options: SetRequired<ContentfulOptions, 'spaceId'>) => {
  const space = await getSpace(options);

  const { items: previewApiKeys = [] } = await space.getPreviewApiKeys();
  const [previewApiKey] = previewApiKeys;
  const { accessToken: previewAccessToken } = previewApiKey as ApiKey;

  return previewAccessToken;
};
