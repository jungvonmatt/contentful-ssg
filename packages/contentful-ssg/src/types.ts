import type { Options } from '@contentful/rich-text-html-renderer';
import type { Document } from '@contentful/rich-text-types';
import type { QueryOptions } from 'contentful-management/types';
import type { Observable, ReplaySubject } from 'rxjs';

import type {
  ContentTypeField,
  Asset as ContentfulAsset,
  ContentType as ContentfulContentType,
  ContentfulCollection as ContentfulContentfulCollection,
  Entry as ContentfulEntry,
  EntryCollection as ContentfulEntryCollection,
  Locale as ContentfulLocale,
  DeletedAsset,
  DeletedEntry,
  EntryFields,
  EntrySkeletonType,
  LocaleCode,
  ResolvedField,
} from 'contentful';

import type { ListrTaskObject } from 'listr';
import type { FileManager } from './lib/file-manager.js';
import type { HookManager } from './lib/hook-manager.js';
import type { Stats } from './lib/stats.js';

export type Field = ContentTypeField;

export type { Ignore } from 'ignore';

export type KeyValueMap<T = any> = Record<string, T>;

// Export interface Asset {
//   sys: EntrySys;
//   fields: {
//     title: string;
//     description: string;
//     file: {
//       url: string;
//       details: {
//         size: number;
//         image?: {
//           width: number;
//           height: number;
//         };
//       };
//       fileName: string;
//       contentType: string;
//     };
//   };
//   metadata: Metadata;
// }

export type Locale = ContentfulLocale;
export type ContentType = ContentfulContentType;

export type EntryRaw = ContentfulEntry<EntrySkeletonType, 'WITH_ALL_LOCALES'>;
export type AssetRaw = ContentfulAsset<'WITH_ALL_LOCALES'>;
export type NodeRaw = EntryRaw | AssetRaw;

export type Asset = ContentfulAsset<undefined>;
export type Entry = ContentfulEntry<EntrySkeletonType, undefined>;

export type Node = Entry | Asset;

export type EntryFieldRaw = {
  [FieldName in keyof EntrySkeletonType['fields']]: {
    [LocaleName in LocaleCode]?: ResolvedField<
      EntrySkeletonType['fields'][FieldName],
      'WITH_ALL_LOCALES'
    >;
  };
};

export type EntryField = {
  [FieldName in keyof EntrySkeletonType['fields']]: ResolvedField<
    EntrySkeletonType['fields'][FieldName],
    undefined
  >;
};

export type EntryCollection = {
  includes?: {
    Entry?: EntryRaw[];
    Asset?: AssetRaw[];
  };
} & ContentfulEntryCollection<EntrySkeletonType, 'WITH_ALL_LOCALES'>;

export type ContentfulCollection<T> = ContentfulContentfulCollection<T>;

export type ContentfulRichtextOptions = Options;
export type FormatObject = KeyValueMap<string[]>;
export type RichTextConfig =
  | boolean
  | ContentfulRichtextOptions
  | ((
      document: Document,
      transformContext: TransformContext,
      runtimeContext: RuntimeContext,
    ) => unknown);

export type ContentfulConfig = {
  spaceId: string;
  environmentId: string;
  managementToken: string;
  previewAccessToken: string;
  accessToken: string;
  host?: string;
  preview?: boolean;
  sync?: boolean;
  query?: QueryOptions;
};

export type ContentfulRcConfig = {
  managementToken: string;
  activeSpaceId: string;
  activeEnvironmentId: string;
  host: string;
};

export type ConfigHook = (config: Config) => Config | Promise<Config>;

export type RuntimeHook = (
  runtimeContext: RuntimeContext,
) => Promise<Partial<RuntimeContext>> | Partial<RuntimeContext> | void;
export type TransformHook<T> = (
  transformContext: TransformContext,
  runtimeContext?: RuntimeContext,
  prev?: T,
) => Promise<T> | T;
export type ValidateHook = (
  transformContext: TransformContext,
  runtimeContext?: RuntimeContext,
) => Promise<boolean> | boolean;

export type Hooks = {
  config?: ConfigHook;
  before?: RuntimeHook;
  after?: RuntimeHook;
  transform?: TransformHook<KeyValueMap | undefined>;
  mapDirectory?: TransformHook<string>;
  mapFilename?: TransformHook<string>;
  mapMetaFields?: TransformHook<KeyValueMap>;
  mapAssetLink?: TransformHook<KeyValueMap>;
  mapEntryLink?: TransformHook<KeyValueMap>;
};

export type Config = Partial<ContentfulConfig> &
  Hooks & {
    rootDir?: string;
    directory: string;
    managedDirectories?: string[];
    verbose?: boolean;
    ignoreErrors?: boolean;
    plugins?: Array<[string, KeyValueMap] | PluginInfo | string>;
    resolvedPlugins?: Hooks[];
    preset?: string;
    richTextRenderer?: RichTextConfig;
    format?: string | FormatObject | TransformHook<string>;
    validate?: ValidateHook;
  };

export type PluginInfo = {
  options: KeyValueMap;
  resolve: string;
};

export type PluginModule = {
  default?: PluginSource;
} & Partial<Hooks>;

export type PluginSource = Hooks | ((options?: KeyValueMap) => Promise<Hooks> | Hooks);

export type FieldSettings = KeyValueMap<KeyValueMap<Field>>;

export type ContentfulData = {
  fieldSettings: FieldSettings;
  locales: Locale[];
  contentTypes: ContentType[];
  entries: EntryRaw[];
  assets: AssetRaw[];
  deletedEntries?: DeletedEntry[];
  deletedAssets?: DeletedAsset[];
};

export type LocalizedContent = {
  [x: string]: any;
  assets: Asset[];
  entries: Entry[];
  assetMap: Map<string, Asset>;
  entryMap: Map<string, Entry>;
};

export type StatsKey = string;

export type Converter = {
  parse: <T = KeyValueMap>(string: string) => T;
  stringify: <T = KeyValueMap>(obj: T) => string;
};

export type MarkdownConverter = {
  parse: <T = KeyValueMap>(string: string) => T;
  stringify: <T = KeyValueMap>(obj: T, additional?: string) => string;
};

type Entries<T> = Array<
  {
    [K in keyof T]: [K, T[K]];
  }[keyof T]
>;

export type RuntimeContext = {
  [x: string]: any;
  config: Config;
  defaultLocale: string;
  data: Partial<ContentfulData>;
  localized: Map<string, LocalizedContent>;
  fileManager: FileManager;
  stats: Stats;
  hooks: HookManager;
  helper: {
    [x: string]: any;
    array: {
      mapAsync: <T, U>(
        iterable: T[],
        callback: (value: T, index?: number, iterable?: T[]) => U | Promise<U>,
      ) => Promise<U[]>;
      forEachAsync: <T>(
        iterable: T[],
        callback: (value: T, index?: number, iterable?: T[]) => void | Promise<void>,
      ) => Promise<void>;
      filterAsync: <T>(
        iterable: T[],
        callback: (value: T, index?: number, array?: T[]) => boolean | Promise<boolean>,
      ) => Promise<T[]>;
      reduceAsync: <T, U>(
        iterable: T[],
        callback: (
          previousValue: U,
          currentValue: T,
          currentIndex?: number,
          array?: T[],
        ) => U | Promise<U>,
        initialValue?: U,
      ) => Promise<U>;
    };
    object: {
      isObject: (something: any) => boolean;
      getEntries: <T>(obj: T) => Entries<T>;
      fromEntries: <T = Array<[string, unknown]>>(entries: Entries<T>) => T;
      omitKeys: <T, K extends keyof T>(obj: T, ...keys: K[]) => T;
      removeEmpty: <T>(iterable: T) => T;
      snakeCaseKeys: <T>(iterable: T) => T;
      groupBy: <T extends Record<string, unknown>, K extends keyof T>(
        array: T[],
        key: K,
      ) => Record<string, unknown>;
    };
  };
  converter: {
    yaml: Converter;
    json: Converter;
    markdown: Converter;
    toml: Converter;
  };
  observables?: Record<string, ReplaySubject<ObservableContext>>;
};

export type Task = ListrTaskObject<RuntimeContext>;

export type RunResult = {
  observables: Record<string, ReplaySubject<ObservableContext>>;
  localized: Record<string, LocalizedContent>;
};

export type TransformHelper = {
  collectValues: <T>(key, options?: CollectOptions) => T[];
  collectParentValues: <T>(key, options?: CollectOptions) => T[];
  waitFor: (id: string, waitTimeout?: number) => Promise<ObservableContext>;
};

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
  observable: Observable<ObservableContext>;
};

export type ObservableContext = Readonly<
  Pick<TransformContext, 'id' | 'contentTypeId' | 'content' | 'locale'> & {
    error?: Error;
  }
>;

export type StatsEntry = {
  id: string;
  contentTypeId: string;
  locale: string;
  message?: string;
  error?: Error;
} & KeyValueMap;

export type MapAssetLink = {
  mimeType: string;
  url: string;
  title: string;
  description: string;
  width?: number;
  height?: number;
  fileSize?: number;
};

export type Link = EntryFields.Link<EntrySkeletonType>;

export type RichTextData = {
  target?: Link;
};

export type CollectOptions = {
  reverse?: boolean;
  entry?: Entry;
  entryMap?: Map<string, Entry>;
  linkField?: string;
  getId?: (entry: Entry) => string;
  getNextId?: (entry: Entry) => string;
  getValue?: (entry: Entry) => any;
};

export type CollectionResponse<T> = EntryCollection | ContentfulCollection<T>;

export type PagedGetOptions<T> = {
  method: string;
  skip?: number;
  aggregatedResponse?: CollectionResponse<T>;
  query?: QueryOptions;
  include?: number;
};

export type SyncOptions = {
  initial?: true;
  nextSyncToken?: string;
  resolveLinks?: boolean;
};

export type ErrorEntry = {
  spaceId: string;
  environmentId: string;
  entryId: string;
  contentTypeId: string;
  locale: Locale;
  missingFields: string[];
};

export type SandboxContext = {
  module?: NodeModule;
  exports: Record<string, any>;
  process: { env: NodeJS.ProcessEnv };
  require: NodeRequire;
  __dirname: string;
  __filename: string;
};
