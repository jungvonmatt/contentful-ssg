// Management API
export {
  getManagementClient,
  resetManagementClient,
  getSpaces,
  getSpace,
  getEnvironments,
  getEnvironment,
  getApiKey,
  getPreviewApiKey,
  getOrganizations,
  getWebhooks,
  addWebhook,
  deleteWebhook,
} from './management.js';
export type { ContentfulClientOptions } from './management.js';

// Delivery API
export {
  getClient,
  resetClient,
  getContent,
  getLocales,
  getContentTypes,
  getEntriesLinkedToEntry,
  getEntriesLinkedToAsset,
  MAX_ALLOWED_LIMIT,
} from './delivery.js';

// Helpers
export {
  FIELD_TYPE_SYMBOL,
  FIELD_TYPE_TEXT,
  FIELD_TYPE_RICHTEXT,
  FIELD_TYPE_NUMBER,
  FIELD_TYPE_INTEGER,
  FIELD_TYPE_DATE,
  FIELD_TYPE_LOCATION,
  FIELD_TYPE_ARRAY,
  FIELD_TYPE_BOOLEAN,
  FIELD_TYPE_LINK,
  FIELD_TYPE_OBJECT,
  LINK_TYPE_ASSET,
  LINK_TYPE_ENTRY,
  getContentTypeId,
  getContentId,
  getEnvironmentId,
  isContentfulObject,
  isLink,
  isAssetLink,
  isEntryLink,
  isAsset,
  isEntry,
  getFieldSettings,
  convertToMap,
} from './helpers.js';

// Types (cross-module domain types)
export type {
  ContentfulConfig,
  DeliveryQueryOptions,
  FieldSettings,
  KeyValueMap,
  Node,
  NodeRaw,
  Entry,
  Asset,
  EntryRaw,
  AssetRaw,
  ContentType,
  ContentTypeField,
  Locale,
  ContentfulCollection,
  EntryCollection,
  CreateWebhooksProps,
  WebhookProps,
} from './types.js';
