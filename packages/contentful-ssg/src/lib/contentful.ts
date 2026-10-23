// --- Re-exports from @jungvonmatt/contentful-client (for plugin consumers) ---
export {
  // Management
  getManagementClient,
  resetManagementClient,
  getSpaces,
  getSpace,
  getEnvironments,
  getEnvironment,
  getApiKey,
  getPreviewApiKey,
  getWebhooks,
  addWebhook,
  deleteWebhook,
  // Delivery
  getClient,
  resetClient,
  getEntriesLinkedToEntry,
  getEntriesLinkedToAsset,
  getLocales,
  getContentTypes,
  MAX_ALLOWED_LIMIT,
  // Helpers
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
} from '@jungvonmatt/contentful-client';

// --- SSG-specific ---
export { addWatchWebhook } from './watch-webhook.js';
export { getContentWithSync } from './content-sync.js';

// Sync-aware getContent router (backwards compat for plugins)
import { getContent as getContentFromClient } from '@jungvonmatt/contentful-client';
import { getContentWithSync } from './content-sync.js';
import type { ContentfulConfig } from '@jungvonmatt/contentful-client';

export const getContent = async (options: ContentfulConfig & { sync?: boolean }) => {
  if (options.sync) {
    return getContentWithSync(options);
  }

  return getContentFromClient(options);
};
