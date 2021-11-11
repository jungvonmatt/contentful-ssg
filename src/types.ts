
import type {Options as RichtextOptions} from '@contentful/rich-text-html-renderer';
import type {Document} from '@contentful/rich-text-types';
// Import {KeyValueMap} from 'contentful-management/types';

import type {EntryFields, Locale as ContentfulLocale, Asset as ContentfulAsset, Field, Entry as ContentfulEntry, ContentType as ContentfulContentType} from 'contentful';
import type {ListrTaskObject} from 'listr';
import type {FileManager} from './helper/file-manager.js';
import type {Stats} from './helper/stats.js';
import type {HookManager} from './helper/hook-manager.js';

export type KeyValueMap<T = any> = Record<string, T>;

export interface ContentfulConfig {
  spaceId: string;
  environmentId: string;
  managementToken: string;
  previewAccessToken: string;
  accessToken: string;
  host?: string;
  preview?: boolean;
}

export interface ContentfulRcConfig {
  managementToken: string;
  activeSpaceId: string;
  activeEnvironmentId: string;
  host: string;
}

export type Locale = ContentfulLocale;
export type ContentType = ContentfulContentType;
export type Asset = ContentfulAsset;
export type Entry = Omit<ContentfulEntry<KeyValueMap>, 'update'>;

export type Node = Entry | Asset;

export type RuntimeHook = (runtimeContext: RuntimeContext) => Promise<Partial<RuntimeContext>> | Partial<RuntimeContext>;
export type TransformHook<T> = (transformContext: TransformContext, runtimeContext?: RuntimeContext, prev?: T) => Promise<T> | T;
export type ValidateHook = (transformContext: TransformContext, runtimeContext?: RuntimeContext) => Promise<boolean> | boolean;

export type FormatObject = KeyValueMap<string[]>;

export interface Hooks {
  before?: RuntimeHook;
  after?: RuntimeHook;
  transform?: TransformHook<KeyValueMap>;
  mapDirectory?: TransformHook<string>;
  mapFilename?: TransformHook<string>;
  mapMetaFields?: TransformHook<KeyValueMap>;
  mapAssetLink?: TransformHook<KeyValueMap>;
  mapEntryLink?: TransformHook<KeyValueMap>;
}

export type Config = Partial<ContentfulConfig> & Hooks & {
  directory: string;
  plugins: Hooks[];
  preset?: string;
  richTextRenderer?: boolean | RichtextOptions | ((document: Document, transformContext: TransformContext, runtimeContext: RuntimeContext,) => unknown);
  format?: string | FormatObject | TransformHook<string>;
  validate?: ValidateHook;
};

export type InitialConfig = Config & {
  plugins?: PluginInfo[] | string[];
};

export interface PluginInfo {
  options: KeyValueMap;
  resolve: string;
}

export type FieldSettings = KeyValueMap<KeyValueMap<Field>>;

export interface ContentfulData {
  fieldSettings: FieldSettings;
  locales: Locale[];
  contentTypes: ContentType[];
  entries: Entry[];
  assets: Asset[];
}

export interface LocalizedContent {
  assets: Asset[];
  entries: Entry[];
  assetMap: Map<string, Asset>;
  entryMap: Map<string, Entry>;
}

export type StatsKey = string;

export interface RuntimeContext {
  config: Config;
  defauleLocale: string;
  data: ContentfulData;
  localized: Map<string, LocalizedContent>;
  fileManager: FileManager;
  stats: Stats;
  hooks: HookManager;
  [x: string]: any;
}

export type Task = ListrTaskObject<RuntimeContext>;

export interface StatsEntry {
  id: string;
  contentType: string;
  locale: string;
  message?: string;
}

export interface TransformHelper {
  collectValues: <T>(key, options?: CollectOptions) => T[];
  collectParentValues: <T>(key, options?: CollectOptions) => T[];
}

export type TransformContext = LocalizedContent & {
  id: string;
  content?: KeyValueMap;
  entry: Entry;
  asset?: Asset;
  contentTypeId: string;
  locale: Locale;
  fieldId?: string;
  fieldContent?: unknown;
  fieldSettings?: Field;
  requiredFields?: string[];
  helper: TransformHelper;
  [x: string]: any;
};

export interface Ignore {
  add(pattern: string | Ignore | string[] | Ignore[]): Ignore;

  filter(paths: string[]): string[];

  createFilter(): (path: string) => boolean;

  ignores(pathname: string): boolean;
}

export interface MapAssetLink {
  mimeType: string;
  url: string;
  title: string;
  description: string;
  width?: number;
  height?: number;
  fileSize?: number;
}

export type Link = EntryFields.Link<unknown>;

export interface RichTextData {
  target?: Link;
}

export interface CollectOptions {
  reverse?: boolean;
  entry?: Entry;
  linkField?: string;
  getId?: (entry: Entry) => string;
  getNextId?: (entry: Entry) => string;
  getValue?: (entry: Entry) => any;
}
