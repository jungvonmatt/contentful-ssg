import type {
  Asset as ContentfulAsset,
  ContentType as ContentfulContentType,
  ContentTypeField as ContentfulContentTypeField,
  ContentfulCollection as ContentfulContentfulCollection,
  Entry as ContentfulEntry,
  EntryCollection as ContentfulEntryCollection,
  EntrySkeletonType,
  Locale as ContentfulLocale,
} from 'contentful';

// --- Own types ---

export type DeliveryQueryOptions = {
  skip?: number;
  limit?: number;
  order?: string;
  include?: number;
  content_type?: string;
  locale?: string;
  links_to_entry?: string;
  links_to_asset?: string;
  query?: string;
  select?: string;
  [key: string]: unknown;
};

// NOTE: No `sync` field — that's SSG-specific. SSG defines its own extended type.
export type ContentfulConfig = {
  spaceId: string;
  environmentId: string;
  managementToken: string;
  previewAccessToken: string;
  accessToken: string;
  host?: string;
  preview?: boolean;
  query?: DeliveryQueryOptions;
};

export type FieldSettings = Record<string, Record<string, ContentTypeField>>;

export type KeyValueMap<T = any> = Record<string, T>;

// --- Type aliases for SDK types (decoupled from SDK generics) ---

export type EntryRaw = ContentfulEntry<EntrySkeletonType, 'WITH_ALL_LOCALES'>;
export type AssetRaw = ContentfulAsset<'WITH_ALL_LOCALES'>;
export type NodeRaw = EntryRaw | AssetRaw;

export type Entry = ContentfulEntry<EntrySkeletonType, undefined>;
export type Asset = ContentfulAsset<undefined>;
export type Node = Entry | Asset;

export type ContentType = ContentfulContentType;
export type ContentTypeField = ContentfulContentTypeField;
export type Locale = ContentfulLocale;
export type ContentfulCollection<T> = ContentfulContentfulCollection<T>;
export type EntryCollection = {
  includes?: { Entry?: EntryRaw[]; Asset?: AssetRaw[] };
} & ContentfulEntryCollection<EntrySkeletonType, 'WITH_ALL_LOCALES'>;

// --- Re-export from contentful-management ---
export type { CreateWebhooksProps, WebhookProps } from 'contentful-management';
