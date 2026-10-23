import type { DeletedEntry, DeletedAsset } from 'contentful';
import type { EntryRaw, AssetRaw, ContentType, Locale } from '@jungvonmatt/contentful-client';
import {
  getFieldSettings,
  getEntriesLinkedToEntry,
  getEntriesLinkedToAsset,
} from '@jungvonmatt/contentful-client';
import { getContent } from '../lib/contentful.js';
import type { RuntimeContext, Config, ContentfulConfig } from '../types.js';

type ContentResult = {
  entries: EntryRaw[];
  assets: AssetRaw[];
  contentTypes: ContentType[];
  locales: Locale[];
  deletedEntries?: DeletedEntry[];
  deletedAssets?: DeletedAsset[];
};

export const fetch = async (context: RuntimeContext, config: Config) => {
  const content = (await getContent(
    config as ContentfulConfig & { sync?: boolean },
  )) as ContentResult;
  const { locales, contentTypes } = content;

  // Add entries linked to deleted assets & entries to the list of changed entries
  const additionalEntriesPromise = [
    ...(content?.deletedEntries?.map(async (entry) =>
      getEntriesLinkedToEntry(config as ContentfulConfig, entry.sys.id),
    ) ?? []),
    ...(content?.deletedAssets?.map(async (asset) =>
      getEntriesLinkedToAsset(config as ContentfulConfig, asset.sys.id),
    ) ?? []),
  ];

  const additionalEntries = (await Promise.all(additionalEntriesPromise)).flat();

  content.entries = [...(content?.entries ?? []), ...additionalEntries];

  const fieldSettings = getFieldSettings(contentTypes);
  const { code: defaultLocale } = locales.find((locale) => locale.default);

  context.defaultLocale = defaultLocale;

  context.data = {
    ...content,
    fieldSettings,
  };
};
