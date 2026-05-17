import type { SetRequired } from 'type-fest';
import type { ApiKey, ClientOptions, PlainClientAPI, SpaceProps } from 'contentful-management';
import contentful from 'contentful-management';

let client: PlainClientAPI;

export type ContentfulOptions = {
  accessToken?: ClientOptions['accessToken'];
  host?: ClientOptions['host'];
  managementToken?: ClientOptions['accessToken'];
  previewAccessToken?: ClientOptions['accessToken'];
  environmentId?: string;
  organizationId?: string;
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
 * Get Contentful organizations
 */
export const getOrganizations = async (
  options: SetRequired<ContentfulOptions, 'managementToken'>,
) => {
  const client = getClient(options);

  const { items } = await client.organization.getAll();
  return items;
};

/**
 * Get Contentful spaces
 */
export const getSpaces = async (options: SetRequired<ContentfulOptions, 'managementToken'>) => {
  const client = getClient(options);

  const { items } = await client.space.getMany({});
  return items;
};

/**
 * Get Contentful space
 */
export const getSpace = async (
  options: SetRequired<ContentfulOptions, 'managementToken' | 'spaceId'>,
): Promise<SpaceProps> => {
  const { spaceId } = options || {};
  const client = getClient(options);
  return client.space.get({ spaceId });
};

/**
 * Get Contentful environments
 */
export const getEnvironments = async (
  options: SetRequired<ContentfulOptions, 'managementToken' | 'spaceId'>,
) => {
  const { spaceId } = options || {};
  const client = getClient(options);
  const { items } = await client.environment.getMany({ spaceId });
  return items;
};

/**
 * Get Contentful environment
 */
export const getEnvironment = async (
  options: SetRequired<ContentfulOptions, 'managementToken' | 'spaceId' | 'environmentId'>,
) => {
  const { environmentId, spaceId } = options || {};
  const client = getClient(options);

  const { items: environments } = await client.environment.getMany({ spaceId });

  const environmentIds = new Set((environments || []).map((env) => env.sys.id));

  if (environmentId && environmentIds.has(environmentId)) {
    return client.environment.get({ spaceId, environmentId });
  }

  if (environmentId && !environmentIds.has(environmentId)) {
    throw new Error(`Environment "${environmentId}" is not available in space ${spaceId}"`);
  }

  throw new Error('Missing required parameter: environmentId');
};

/**
 * Fetch api key from contentful
 */
export const getApiKey = async (
  options: SetRequired<ContentfulOptions, 'managementToken' | 'spaceId'>,
) => {
  const { spaceId } = options || {};
  const client = getClient(options);

  const { items: apiKeys = [] } = (await client.apiKey.getMany({ spaceId })) || {};
  const [apiKey] = apiKeys;
  const { accessToken } = apiKey || {};

  return accessToken;
};

/**
 * Fetch preview api key from contentful
 */
export const getPreviewApiKey = async (
  options: SetRequired<ContentfulOptions, 'managementToken' | 'spaceId'>,
) => {
  const { spaceId } = options || {};
  const client = getClient(options);

  const { items: previewApiKeys = [] } = await client.previewApiKey.getMany({ spaceId });
  const [previewApiKey] = previewApiKeys;
  const { accessToken: previewAccessToken } = previewApiKey as ApiKey;

  return previewAccessToken;
};
