import type { RuntimeContext, Config, ContentfulConfig } from '../types.js';
import {
  getContent,
  getFieldSettings,
  getEntriesLinkedToEntry,
  getEntriesLinkedToAsset,
} from '../lib/contentful.js';

export const fetch = async (context: RuntimeContext, config: Config) => {
  const content = await getContent(config as ContentfulConfig);
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

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  content.entries = [...(content?.entries ?? []), ...additionalEntries];

  const fieldSettings = getFieldSettings(contentTypes);
  const { code: defaultLocale } = locales.find((locale) => locale.default);

  context.defaultLocale = defaultLocale;

  context.data = {
    ...content,
    fieldSettings,
  };
};
