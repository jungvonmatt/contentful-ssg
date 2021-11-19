import type {Options as RichtextOptions} from '@contentful/rich-text-html-renderer';
import type {Document} from '@contentful/rich-text-types';
// Import {KeyValueMap} from 'contentful-management/types';

import type {
  EntryFields,
  Locale as ContentfulLocale,
  Asset as ContentfulAsset,
  Field,
  Entry as ContentfulEntry,
  ContentType as ContentfulContentType,
} from 'contentful';
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

export type RuntimeHook = (
  runtimeContext: RuntimeContext
) => Promise<Partial<RuntimeContext>> | Partial<RuntimeContext>;
export type TransformHook<T> = (
  transformContext: TransformContext,
  runtimeContext?: RuntimeContext,
  prev?: T
) => Promise<T> | T;
export type ValidateHook = (
  transformContext: TransformContext,
  runtimeContext?: RuntimeContext
) => Promise<boolean> | boolean;

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

export type Config = Partial<ContentfulConfig> &
Hooks & {
  rootDir?: string;
  directory: string;
  verbose?: boolean;
  plugins?: Hooks[];
  preset?: string;
  richTextRenderer?:
  | boolean
  | RichtextOptions
  | ((
    document: Document,
    transformContext: TransformContext,
    runtimeContext: RuntimeContext
  ) => unknown);
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

export type PluginModule = {
  default?: PluginSource;
} & Partial<Hooks>;

export type PluginSource = Hooks | ((options?: KeyValueMap) => Promise<Hooks> | Hooks);

export type FieldSettings = KeyValueMap<KeyValueMap<Field>>;

export interface ContentfulData {
  fieldSettings: FieldSettings;
  locales: Locale[];
  contentTypes: ContentType[];
  entries: Entry[];
  assets: Asset[];
}

export interface LocalizedContent {
  [x: string]: any;
  assets: Asset[];
  entries: Entry[];
  assetMap: Map<string, Asset>;
  entryMap: Map<string, Entry>;
}

export type StatsKey = string;

export interface Converter {
  parse: <T = KeyValueMap>(string: string) => T;
  stringify: <T = KeyValueMap>(obj: T) => string;
}

export interface MarkdownConverter {
  parse: <T = KeyValueMap>(string: string) => T;
  stringify: <T = KeyValueMap>(obj: T, additional?: string) => string;
}

type Entries<T> = Array<{
  [K in keyof T]: [K, T[K]];
}[keyof T]>;

export interface RuntimeContext {
  [x: string]: any;
  config: Config;
  defaultLocale: string;
  data: ContentfulData;
  localized: Map<string, LocalizedContent>;
  fileManager: FileManager;
  stats: Stats;
  hooks: HookManager;
  helper: {
    [x: string]: any;
    array: {
      mapAsync: <T, U>(iterable: T[], callback: (value: T, index?: number, iterable?: T[]) => U | Promise<U>) => Promise<U[]>;
      forEachAsync: <T>(iterable: T[], callback: (value: T, index?: number, iterable?: T[]) => void | Promise<void>) => Promise<void>;
      filterAsync: <T>(iterable: T[], callback: (value: T, index?: number, array?: T[]) => boolean | Promise<boolean>) => Promise<T[]>;
      reduceAsync: <T, U>(iterable: T[], callback: (previousValue: U, currentValue: T, currentIndex?: number, array?: T[]) => U | Promise<U>, initialValue?: U) => Promise<U>;
    };
    object: {
      isObject: (something: any) => boolean;
      getEntries: <T>(obj: T) => Entries<T>;
      fromEntries: <T = Array<[string, unknown]>>(entries: Entries<T>) => T;
      omitKeys: <T, K extends keyof T>(obj: T, ...keys: K[]) => T;
      removeEmpty: <T>(iterable: T) => T;
      snakeCaseKeys: <T>(iterable: T) => T;
      groupBy: <T extends Record<string, unknown>, K extends keyof T>(array: T[], key: K) => Record<string, unknown>;
    };
  };
  converter: {
    yaml: Converter;
    json: Converter;
    markdown: Converter;
    toml: Converter;
  };
}

export type Task = ListrTaskObject<RuntimeContext>;

export interface StatsEntry extends KeyValueMap {
  id: string;
  contentTypeId: string;
  locale: string;
  message?: string;
  error?: Error;
}

export interface TransformHelper {
  collectValues: <T>(key, options?: CollectOptions) => T[];
  collectParentValues: <T>(key, options?: CollectOptions) => T[];
}

export type TransformContext = LocalizedContent & {
  [x: string]: any;
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
  utils: TransformHelper;
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
  entryMap?: Map<string, Entry>;
  linkField?: string;
  getId?: (entry: Entry) => string;
  getNextId?: (entry: Entry) => string;
  getValue?: (entry: Entry) => any;
}
