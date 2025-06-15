import type { SetRequired } from 'type-fest';
import type {
  ApiKey,
  ClientAPI,
  ClientOptions,
  Collection,
  PaginationQueryOptions,
  QueryOptions,
} from 'contentful-management';
import contentful from 'contentful-management';

let client: ClientAPI;

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

const MAX_ALLOWED_LIMIT = 1000;

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

type AwaitedCollectionItem<T> = T extends { items: Array<infer U> } ? U : never;

export const getAll = async <
  T extends (query?: QueryOptions) => Promise<Collection<any, any>>,
  TArgs extends Parameters<T> = Parameters<T>,
  TResult extends ReturnType<T> = ReturnType<T>,
>(
  fn: T,
): Promise<Awaited<TResult>> => {
  const makeRequest = async (
    options: {
      skip?: PaginationQueryOptions['skip'];
      aggregatedResponse?: Awaited<TResult>;
    } = {},
  ) => {
    let aggregatedResponse = options?.aggregatedResponse;
    const skip = options?.skip || 0;
    const query = {
      skip,
      limit: MAX_ALLOWED_LIMIT,
    };

    const response = await (fn(query as TArgs[0]) as Promise<TResult>);
    const { limit = MAX_ALLOWED_LIMIT, total, items } = response;

    if (aggregatedResponse) {
      aggregatedResponse.items = aggregatedResponse.items.concat(items);
    } else {
      aggregatedResponse = response;
    }

    if (skip + limit <= total) {
      return makeRequest({ skip: skip + limit, aggregatedResponse });
    }

    return aggregatedResponse;
  };

  const result = await makeRequest();
  return result;
};

/**
 * Get Contentful organizations
 */
export const getOrganizations = async (
  options: SetRequired<ContentfulOptions, 'managementToken'>,
) => {
  const client = getClient(options);

  const { items } = await getAll(async (query) => client.getOrganizations(query));
  return items;
};

/**
 * Get Contentful spaces
 */
export const getSpaces = async (options: SetRequired<ContentfulOptions, 'managementToken'>) => {
  const client = getClient(options);

  const { items } = await getAll(async (query) => client.getSpaces(query));
  return items;
};

/**
 * Get Contentful space
 */
export const getSpace = async (
  options: SetRequired<ContentfulOptions, 'managementToken' | 'spaceId'>,
) => {
  const { spaceId } = options || {};
  const client = getClient(options);
  return client.getSpace(spaceId);
};

/**
 * Get Contentful environments
 */
export const getEnvironments = async (
  options: SetRequired<ContentfulOptions, 'managementToken' | 'spaceId'>,
) => {
  const space = await getSpace(options);
  const { items } = await getAll(async (query) => space.getEnvironments(query));
  return items;
};

/**
 * Get Contentful environment
 */
export const getEnvironment = async (
  options: SetRequired<ContentfulOptions, 'managementToken' | 'spaceId' | 'environmentId'>,
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
export const getApiKey = async (
  options: SetRequired<ContentfulOptions, 'managementToken' | 'spaceId'>,
) => {
  const space = await getSpace(options);

  const { items: apiKeys = [] } = (await space.getApiKeys()) || {};
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
  const space = await getSpace(options);

  const { items: previewApiKeys = [] } = await space.getPreviewApiKeys();
  const [previewApiKey] = previewApiKeys;
  const { accessToken: previewAccessToken } = previewApiKey as ApiKey;

  return previewAccessToken;
};
