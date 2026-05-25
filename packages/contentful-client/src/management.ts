import type {
  ApiKey,
  ClientOptions,
  CreateWebhooksProps,
  PlainClientAPI,
  SpaceProps,
  WebhookProps,
} from 'contentful-management';
import { createClient, fetchAll } from 'contentful-management';
import { createHash } from 'crypto';

export type ContentfulClientOptions = {
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

let client: PlainClientAPI;
let clientKey: string;

/**
 * Get or create the Contentful Management PlainClient.
 * Recreates the client if options (token/host) change.
 */
export const getManagementClient = (options: ContentfulClientOptions): PlainClientAPI => {
  const { managementToken, host } = options || {};

  const tokenStr =
    typeof managementToken === 'string' ? managementToken : (managementToken?.toString() ?? '');
  const hostStr = host ?? '';
  const key = createHash('sha256').update(`${tokenStr}::${hostStr}`).digest('hex');

  if (client && clientKey === key) {
    return client;
  }

  const params: ClientOptions = {
    accessToken: managementToken,
  };

  if (host) {
    params.host = host;
  }

  if (params.accessToken) {
    client = createClient(params);
    clientKey = key;
    return client;
  }

  throw new Error(
    'You need to login first. Run npx contentful login or pass the contentful management token',
  );
};

/**
 * Reset the cached client instance (useful for testing).
 */
export const resetManagementClient = () => {
  client = undefined as unknown as PlainClientAPI;
  clientKey = '';
};

/**
 * Get Contentful spaces
 */
export const getSpaces = async (options: ContentfulClientOptions) => {
  const client = getManagementClient(options);
  return fetchAll((params) => client.space.getMany(params), {});
};

/**
 * Get a single Contentful space
 */
export const getSpace = async (options: ContentfulClientOptions): Promise<SpaceProps> => {
  const { spaceId } = options || {};
  const client = getManagementClient(options);
  return client.space.get({ spaceId });
};

/**
 * Get Contentful environments for a space
 */
export const getEnvironments = async (options: ContentfulClientOptions) => {
  const { spaceId } = options || {};
  const client = getManagementClient(options);
  return fetchAll((params) => client.environment.getMany({ spaceId, ...params }), {});
};

/**
 * Get a specific Contentful environment, validates it exists
 */
export const getEnvironment = async (options: ContentfulClientOptions) => {
  const { environmentId, spaceId } = options || {};
  const client = getManagementClient(options);

  if (!environmentId) {
    throw new Error('Missing required parameter: environmentId');
  }

  try {
    return await client.environment.get({ spaceId, environmentId });
  } catch (error: unknown) {
    if (
      error &&
      typeof error === 'object' &&
      'status' in error &&
      (error as { status: number }).status === 404
    ) {
      throw new Error(`Environment "${environmentId}" is not available in space "${spaceId}"`, {
        cause: error,
      });
    }
    throw error;
  }
};

/**
 * Fetch api key from contentful
 */
export const getApiKey = async (options: ContentfulClientOptions) => {
  const { spaceId } = options || {};
  const client = getManagementClient(options);

  const apiKeys = await fetchAll((params) => client.apiKey.getMany({ spaceId, ...params }), {});
  const [apiKey] = apiKeys;
  const { accessToken } = (apiKey as ApiKey) || {};

  return accessToken;
};

/**
 * Fetch preview api key from contentful
 */
export const getPreviewApiKey = async (options: ContentfulClientOptions) => {
  const { spaceId } = options || {};
  const client = getManagementClient(options);

  const previewApiKeys = await fetchAll(
    (params) => client.previewApiKey.getMany({ spaceId, ...params }),
    {},
  );
  const [previewApiKey] = previewApiKeys;
  const { accessToken: previewAccessToken } = (previewApiKey as ApiKey) || {};

  return previewAccessToken;
};

/**
 * Get Contentful organizations
 */
export const getOrganizations = async (options: ContentfulClientOptions) => {
  const client = getManagementClient(options);
  const { items } = await client.organization.getAll();
  return items;
};

/**
 * Get webhooks for a space
 */
export const getWebhooks = async (options: ContentfulClientOptions) => {
  const { spaceId } = options || {};
  const client = getManagementClient(options);
  return fetchAll((params) => client.webhook.getMany({ spaceId, ...params }), {});
};

/**
 * Add or get an existing webhook (creates with deterministic ID via PUT)
 */
export const addWebhook = async (
  options: ContentfulClientOptions,
  id: string,
  data: CreateWebhooksProps,
) => {
  const { spaceId } = options || {};
  const client = getManagementClient(options);

  try {
    const webhook = await client.webhook.get({ spaceId, webhookDefinitionId: id });
    return webhook;
  } catch {
    // PlainClient doesn't expose createWithId, use raw PUT (Create/update endpoint)
    return client.raw.put<WebhookProps>(`/spaces/${spaceId}/webhook_definitions/${id}`, data);
  }
};

/**
 * Delete a webhook
 */
export const deleteWebhook = async (options: ContentfulClientOptions, id: string) => {
  const { spaceId } = options || {};
  const client = getManagementClient(options);
  return client.webhook.delete({ spaceId, webhookDefinitionId: id });
};
