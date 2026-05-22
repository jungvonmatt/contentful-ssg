# Contentful-Client Package Expansion

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand `@jungvonmatt/contentful-client` to include both the Management API and the Delivery API client + generic Contentful helpers, making it the single source of truth for all Contentful API interactions.

**Architecture:** The package gets two submodules: `management` (existing code) and `delivery` (extracted from `contentful-ssg/src/lib/contentful.ts`). Generic entity helpers (type guards, accessors, converters) move to a shared `helpers` module. The `contentful-ssg` package becomes a consumer that adds SSG-specific logic (watch webhooks, sync/caching, content orchestration) and provides a facade for plugin consumers.

**Nature of the Client package:** Shared Toolkit (Factory + Helpers + common operations), NOT an abstraction boundary. SSG may use the raw SDK client for SSG-specific operations (e.g., Sync API).

**Tech Stack:** TypeScript, Vitest, pnpm workspaces, Turborepo

**Important:** `@jungvonmatt/contentful-client` is an **internal-only** package (published to npm only so internal tools can reference it). There are no external consumers. Breaking changes to this package require no deprecation period.

---

## Current State

```
contentful-client/src/index.ts  → Management API only (170 lines)
contentful-ssg/src/lib/contentful.ts → Delivery API + Helpers + re-exports Management (400 lines)
contentful-ssg/src/lib/cf-cache.ts → Sync token persistence (SSG-specific)
```

## Target State

```
contentful-client/
  src/
    index.ts              → Barrel export (re-exports everything)
    management.ts         → getManagementClient, resetManagementClient, getSpaces, ... (existing)
    delivery.ts           → getClient, resetClient, getContent, getLocales, getContentTypes, getEntriesLinked*
    helpers.ts            → Type guards, accessors, constants, convertToMap, getFieldSettings
    types.ts              → Cross-module domain types (ContentfulConfig, Node, FieldSettings, ...)
  package.json            → adds "contentful" as dependency

contentful-ssg/
  src/lib/contentful.ts   → Facade: re-exports from client + SSG-specific logic (webhook, sync-router)
  src/lib/watch-webhook.ts → addWatchWebhook (extracted)
  src/lib/content-sync.ts  → sync logic + getContentWithSync
```

## Dependency Changes

```
contentful-client:
  + "contentful": "catalog:"     (Delivery API SDK)

contentful-ssg:
  "contentful": "catalog:"       (STAYS — needed for direct SDK type imports like DeletedEntry, EntryFields)
  "@jungvonmatt/contentful-client": "workspace:*"  (unchanged)
```

## README Update

Both `contentful-client` and `contentful-config` READMEs should reference each other:

```
contentful-config  →  Erzeugt .contentfulrc.json (Credentials + Space/Environment)
contentful-client  →  Nutzt die Config für API-Zugriff (Management + Delivery)
contentful-ssg     →  Orchestriert den SSG-Build mit Content aus contentful-client
```

---

## Task 1: Extract shared types to `contentful-client/src/types.ts`

**Files:**
- Create: `packages/contentful-client/src/types.ts`
- Reference: `packages/contentful-ssg/src/types.ts` (source of truth for type definitions)

**Scope:** Only cross-module and externally-usable domain types. Module-internal types (like `PagedGetOptions`, `CollectionResponse`) stay local in `delivery.ts`. `ContentfulClientOptions` stays in `management.ts`.

```typescript
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
// NOTE: QueryOptions re-export is REMOVED. Use DeliveryQueryOptions instead.
```

**What stays in `contentful-ssg/src/types.ts`:**
- `SsgContentfulConfig` (extends `ContentfulConfig` with `sync?: boolean`)
- RuntimeContext, TransformContext, Hooks, Config, PluginInfo, PluginModule, PluginSource
- Task, RunResult, StatsEntry, StatsKey, ErrorEntry
- Converter, MarkdownConverter, FormatObject, RichTextConfig
- ContentfulRichtextOptions, ContentfulRcConfig, ConfigHook, RuntimeHook, TransformHook, ValidateHook
- CollectOptions, ObservableContext, LocalizedContent, ContentfulData
- MapAssetLink, Link, RichTextData, EntryField, EntryFieldRaw
- SyncOptions (SSG-specific, used by content-sync.ts)

**What `contentful-ssg/src/types.ts` will re-export from `@jungvonmatt/contentful-client`:**
```typescript
export type {
  ContentfulConfig, DeliveryQueryOptions, FieldSettings, KeyValueMap,
  ContentType, ContentTypeField, Locale,
  EntryRaw, AssetRaw, Node, NodeRaw, Asset, Entry,
  ContentfulCollection, EntryCollection,
} from '@jungvonmatt/contentful-client';
```

- [ ] **Step 1:** Create `packages/contentful-client/src/types.ts` with the types as specified above
- [ ] **Step 2:** Verify types compile: `pnpm --filter @jungvonmatt/contentful-client exec tsc --noEmit`
- [ ] **Step 3:** Commit: `feat(contentful-client): add shared contentful types`

---

## Task 2: Extract helpers to `contentful-client/src/helpers.ts`

**Files:**
- Create: `packages/contentful-client/src/helpers.ts`
- Create: `packages/contentful-client/src/helpers.test.ts`
- Reference: `packages/contentful-ssg/src/lib/contentful.ts` (lines 48–100, 280–360)

Move these from `contentful-ssg/src/lib/contentful.ts`:

```typescript
// Constants (lines 48–60) — simple string constants, copy verbatim
FIELD_TYPE_SYMBOL, FIELD_TYPE_TEXT, FIELD_TYPE_RICHTEXT, FIELD_TYPE_NUMBER,
FIELD_TYPE_INTEGER, FIELD_TYPE_DATE, FIELD_TYPE_LOCATION, FIELD_TYPE_ARRAY,
FIELD_TYPE_BOOLEAN, FIELD_TYPE_LINK, FIELD_TYPE_OBJECT, LINK_TYPE_ASSET, LINK_TYPE_ENTRY

// Accessors (lines 64–101) — use types from ./types.js
getContentTypeId(node): string   // handles Asset, DeletedEntry, Entry
getEnvironmentId(node): string
getContentId(node): string

// Type Guards (lines 330–370) — all take `any`, return boolean
isContentfulObject(obj)
isLink(obj)
isAssetLink(obj)
isEntryLink(obj)
isAsset(obj)
isEntry(obj)

// Converters (lines 375–395)
getFieldSettings(contentTypes: ContentType[]): FieldSettings
convertToMap<T extends Node | NodeRaw>(nodes: T[]): Map<string, T>
```

**Types needed by helpers.ts** (imported from `./types.js`):
- `Node`, `NodeRaw`, `ContentType`, `FieldSettings`, `KeyValueMap`
- From `contentful`: `EntryFields`, `EntrySkeletonType`, `DeletedEntry` (for generic constraints)

- [ ] **Step 1:** Create `helpers.ts` with constants, accessors, type guards, and converters — copy implementation from `contentful-ssg/src/lib/contentful.ts`, adjust imports to use local `./types.js`
- [ ] **Step 2:** Create `helpers.test.ts` — cover: each type guard with positive/negative cases, getFieldSettings with mock contentType array, convertToMap with entries/assets, getContentTypeId edge cases (Asset, DeletedEntry, regular Entry)
- [ ] **Step 3:** Run tests: `pnpm --filter @jungvonmatt/contentful-client test`
- [ ] **Step 4:** Commit: `feat(contentful-client): add entity helpers and type guards`

---

## Task 3: Extract delivery client to `contentful-client/src/delivery.ts`

**Files:**
- Create: `packages/contentful-client/src/delivery.ts`
- Create: `packages/contentful-client/src/delivery.test.ts`
- Modify: `packages/contentful-client/package.json` (add `contentful` dependency)
- Source: `packages/contentful-ssg/src/lib/contentful.ts` (lines 106–320)

### Functions to export (public):

```typescript
// getClient — hash-based singleton (replaces SSG's module-level singleton)
export const getClient: (options: ContentfulConfig) => ContentfulClientApi<'WITH_ALL_LOCALES'>
export const resetClient: () => void

// High-level content fetchers
export const getContent: (options: ContentfulConfig) => Promise<{ entries, assets, contentTypes, locales }>
export const getLocales: (options: ContentfulConfig) => Promise<Locale[]>
export const getContentTypes: (options: ContentfulConfig) => Promise<ContentType[]>
export const getEntriesLinkedToEntry: (options: ContentfulConfig, id: string) => Promise<EntryRaw[]>
export const getEntriesLinkedToAsset: (options: ContentfulConfig, id: string) => Promise<EntryRaw[]>

// Constants
export const MAX_ALLOWED_LIMIT = 1000;
```

### Internal (NOT exported from barrel):

```typescript
// pagedGet — recursive pagination, implementation detail
const pagedGet = async <T, R>(apiClient, options: PagedGetOptions<T>): Promise<R>
```

### Implementation:

```typescript
import type { ContentfulClientApi, CreateClientParams, EntrySkeletonType } from 'contentful';
import { createClient } from 'contentful';
import { createHash } from 'crypto';
import type {
  ContentfulConfig, DeliveryQueryOptions, EntryRaw, AssetRaw, Locale, ContentType,
} from './types.js';

type ClientApi = ContentfulClientApi<'WITH_ALL_LOCALES'>;
type CollectionResponse<T> = { items: T[]; total: number; includes?: { Entry?: EntryRaw[]; Asset?: AssetRaw[] } };
type PagedGetOptions<T> = {
  method: string;
  skip?: number;
  aggregatedResponse?: CollectionResponse<T> | null;
  query?: DeliveryQueryOptions | null;
};

export const MAX_ALLOWED_LIMIT = 1000;

let client: ClientApi;
let clientKey: string;

/**
 * Get or create the Contentful Delivery API client.
 * Hash-based singleton — recreates if options change.
 */
export const getClient = (options: ContentfulConfig): ClientApi => {
  const { accessToken, previewAccessToken, spaceId, environmentId, preview } = options;

  const token = preview ? previewAccessToken : accessToken;
  const host = preview ? 'preview.contentful.com' : 'cdn.contentful.com';
  const key = createHash('sha256')
    .update(`${token}::${host}::${spaceId}::${environmentId}`)
    .digest('hex');

  if (client && clientKey === key) {
    return client;
  }

  if (!token) {
    throw new Error('You need to login first. Run npx contentful login');
  }

  const params: CreateClientParams = {
    space: spaceId,
    host,
    accessToken: token,
    environment: environmentId,
  };

  client = createClient(params).withAllLocales;
  clientKey = key;
  return client;
};

/**
 * Reset the cached delivery client (testing).
 */
export const resetClient = () => {
  client = undefined as unknown as ClientApi;
  clientKey = '';
};

/**
 * Recursive pagination for CDA endpoints (internal).
 */
const pagedGet = async <T>(
  apiClient: ClientApi,
  { method, skip = 0, aggregatedResponse = null, query = null }: PagedGetOptions<T>,
): Promise<CollectionResponse<T>> => {
  const fullQuery: DeliveryQueryOptions = {
    skip,
    limit: MAX_ALLOWED_LIMIT,
    order: 'sys.createdAt,sys.id',
    include: 0,
    ...query,
  };

  const response = (await apiClient[method](fullQuery)) as CollectionResponse<T>;

  if (aggregatedResponse) {
    aggregatedResponse.items = [...aggregatedResponse.items, ...response.items];
    if (response.includes) {
      aggregatedResponse.includes = {
        Entry: [...(aggregatedResponse.includes?.Entry ?? []), ...(response.includes?.Entry ?? [])],
        Asset: [...(aggregatedResponse.includes?.Asset ?? []), ...(response.includes?.Asset ?? [])],
      };
    }
  } else {
    aggregatedResponse = response;
  }

  if (skip + MAX_ALLOWED_LIMIT <= response.total) {
    return pagedGet(apiClient, { method, skip: skip + MAX_ALLOWED_LIMIT, aggregatedResponse, query });
  }

  return aggregatedResponse!;
};

/**
 * Fetch all locales via pagination.
 */
export const getLocales = async (options: ContentfulConfig): Promise<Locale[]> => {
  const apiClient = getClient(options);
  const { items } = await pagedGet<Locale>(apiClient, { method: 'getLocales' });
  return items;
};

/**
 * Fetch all content types via pagination.
 */
export const getContentTypes = async (options: ContentfulConfig): Promise<ContentType[]> => {
  const apiClient = getClient(options);
  const { items } = await pagedGet<ContentType>(apiClient, { method: 'getContentTypes' });
  return items;
};

/**
 * Fetch all content (locales, content types, entries, assets) via pagination.
 * Does NOT include sync support — that stays in contentful-ssg.
 */
export const getContent = async (options: ContentfulConfig) => {
  const apiClient = getClient(options);

  const { items: locales } = await pagedGet<Locale>(apiClient, { method: 'getLocales' });
  const { items: contentTypes } = await pagedGet<ContentType>(apiClient, { method: 'getContentTypes' });
  const { items: entries, includes } = await pagedGet<EntryRaw>(apiClient, {
    method: 'getEntries',
    query: options?.query ?? null,
  });
  const { items: assets } = await pagedGet<AssetRaw>(apiClient, { method: 'getAssets' });

  return {
    entries: [...entries, ...(includes?.Entry ?? [])],
    assets: [...assets, ...(includes?.Asset ?? [])],
    contentTypes,
    locales,
  };
};

export const getEntriesLinkedToEntry = async (options: ContentfulConfig, id: string) => {
  const apiClient = getClient(options);
  const { items } = await pagedGet<EntryRaw>(apiClient, {
    method: 'getEntries',
    query: { links_to_entry: id },
  });
  return items;
};

export const getEntriesLinkedToAsset = async (options: ContentfulConfig, id: string) => {
  const apiClient = getClient(options);
  const { items } = await pagedGet<EntryRaw>(apiClient, {
    method: 'getEntries',
    query: { links_to_asset: id },
  });
  return items;
};
```

**Key differences from current SSG implementation:**
- `getClient` replaces SSG's `getClient` — now hash-based (not module-level singleton), supports config changes
- `getContent` does NOT call `sync()` — SSG wraps this with sync logic
- `getLocales` and `getContentTypes` are standalone public functions (used by SSG's `getContentWithSync`)
- `pagedGet` is **internal** — not exported from the barrel
- `resetClient` exported for testability

- [ ] **Step 1:** Add `"contentful": "catalog:"` to `contentful-client/package.json` dependencies
- [ ] **Step 2:** Create `delivery.ts` with the above implementation
- [ ] **Step 3:** Create `delivery.test.ts` — test: client caching/hash, getContent return shape, getLocales/getContentTypes, resetClient
- [ ] **Step 4:** Run tests: `pnpm --filter @jungvonmatt/contentful-client test`
- [ ] **Step 5:** Commit: `feat(contentful-client): add delivery API client and content fetcher`

---

## Task 4: Rename management module and update barrel export

**Files:**
- Rename: `packages/contentful-client/src/index.ts` → `packages/contentful-client/src/management.ts`
- Create: new `packages/contentful-client/src/index.ts` (barrel)
- Rename: `packages/contentful-client/src/index.test.ts` → `packages/contentful-client/src/management.test.ts`

**Ownership:** `ContentfulClientOptions` stays in `management.ts` (co-located with its consumers). Barrel re-exports it.

**Renames:**
- `resetClient` (management) → `resetManagementClient` (avoids collision with delivery's `resetClient`)

**Removed:**
- `export type { QueryOptions } from 'contentful-management'` — no deprecation needed (internal-only package)

New barrel `index.ts`:
```typescript
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
```

- [ ] **Step 1:** Rename `resetClient` → `resetManagementClient` in current `index.ts`
- [ ] **Step 2:** Rename current `index.ts` → `management.ts`
- [ ] **Step 3:** Remove `export type { QueryOptions } from 'contentful-management'` from `management.ts`
- [ ] **Step 4:** Rename `index.test.ts` → `management.test.ts`; adjust imports (use `resetManagementClient`)
- [ ] **Step 5:** Create new barrel `index.ts` as shown above
- [ ] **Step 6:** Update `package.json` test script to run all `*.test.ts` files
- [ ] **Step 7:** Run all tests: `pnpm --filter @jungvonmatt/contentful-client test`
- [ ] **Step 8:** Commit: `refactor(contentful-client): restructure into management/delivery/helpers modules`

---

## Task 5: Update `contentful-ssg` to consume from `contentful-client`

**Strategy:**
1. **Internal SSG modules** (`map-field.ts`, `localize.ts`, etc.) import **directly** from `@jungvonmatt/contentful-client` — makes dependency sources transparent
2. **`src/lib/contentful.ts`** becomes a **facade for external plugin consumers** (via subpath export `@jungvonmatt/contentful-ssg/lib/contentful`) — re-exports from client + contains SSG-specific logic
3. **SSG-specific logic** extracted into dedicated files: `watch-webhook.ts`, `content-sync.ts`

### Files to create:

**`packages/contentful-ssg/src/lib/watch-webhook.ts`** (extracted from `contentful.ts`):
```typescript
import { createHash } from 'crypto';
import { hostname } from 'os';
import { v4 as uuidv4 } from 'uuid';
import { addWebhook } from '@jungvonmatt/contentful-client';
import type { SsgContentfulConfig } from '../types.js';

export const addWatchWebhook = async (options: SsgContentfulConfig, url: string) => {
  // ... existing implementation (topics, uuid, addWebhook call)
};
```

**`packages/contentful-ssg/src/lib/content-sync.ts`** (extracted from `contentful.ts`):
```typescript
import type { SyncCollection as ContentfulSyncCollection, EntrySkeletonType } from 'contentful';
import { getClient, getLocales, getContentTypes, getContent as getContentFromClient } from '@jungvonmatt/contentful-client';
import type { SsgContentfulConfig, SyncOptions } from '../types.js';
import { initializeCache } from './cf-cache.js';

type SyncCollection = ContentfulSyncCollection<EntrySkeletonType, 'WITH_ALL_LOCALES'>;

const sync = async (apiClient, config: SsgContentfulConfig): Promise<SyncCollection> => {
  const cache = initializeCache(config);
  const options: SyncOptions = { initial: true };
  if (cache.hasSyncToken()) {
    options.nextSyncToken = await cache.getSyncToken();
    delete options.initial;
  }
  const response: SyncCollection = await apiClient.sync(options);
  if (response.nextSyncToken) {
    await cache.setSyncToken(response.nextSyncToken);
  }
  return response;
};

/**
 * Sync-aware content fetcher. Routes based on config.sync:
 * - sync=true → uses Contentful Sync API (incremental)
 * - sync=false/undefined → delegates to getContent from client (full pagination)
 */
export const getContentWithSync = async (options: SsgContentfulConfig) => {
  if (options.sync) {
    const locales = await getLocales(options);
    const contentTypes = await getContentTypes(options);
    const apiClient = getClient(options);
    const { entries, assets, deletedEntries, deletedAssets } = await sync(apiClient, options);
    return { entries, assets, deletedEntries, deletedAssets, contentTypes, locales };
  }
  return getContentFromClient(options);
};
```

### Files to rewrite:

**`packages/contentful-ssg/src/lib/contentful.ts`** (facade):
```typescript
// --- Re-exports from @jungvonmatt/contentful-client (for plugin consumers) ---
export {
  // Management
  getManagementClient, resetManagementClient,
  getSpaces, getSpace, getEnvironments, getEnvironment,
  getApiKey, getPreviewApiKey, getWebhooks, addWebhook, deleteWebhook,
  // Delivery
  getClient, resetClient,
  getEntriesLinkedToEntry, getEntriesLinkedToAsset,
  getLocales, getContentTypes,
  MAX_ALLOWED_LIMIT,
  // Helpers
  FIELD_TYPE_SYMBOL, FIELD_TYPE_TEXT, FIELD_TYPE_RICHTEXT, FIELD_TYPE_NUMBER,
  FIELD_TYPE_INTEGER, FIELD_TYPE_DATE, FIELD_TYPE_LOCATION, FIELD_TYPE_ARRAY,
  FIELD_TYPE_BOOLEAN, FIELD_TYPE_LINK, FIELD_TYPE_OBJECT,
  LINK_TYPE_ASSET, LINK_TYPE_ENTRY,
  getContentTypeId, getContentId, getEnvironmentId,
  isContentfulObject, isLink, isAssetLink, isEntryLink, isAsset, isEntry,
  getFieldSettings, convertToMap,
} from '@jungvonmatt/contentful-client';

// --- SSG-specific ---
export { addWatchWebhook } from './watch-webhook.js';
export { getContentWithSync } from './content-sync.js';

// Sync-aware getContent router (backwards compat for plugins)
import { getContent as getContentFromClient } from '@jungvonmatt/contentful-client';
import { getContentWithSync } from './content-sync.js';
import type { SsgContentfulConfig } from '../types.js';

export const getContent = async (options: SsgContentfulConfig) => {
  if (options.sync) {
    return getContentWithSync(options);
  }
  return getContentFromClient(options);
};
```

### Files to modify (import path changes):

Internal SSG modules change from `'../lib/contentful.js'` to `'@jungvonmatt/contentful-client'`:
- `src/mapper/map-field.ts` — `FIELD_TYPE_*` constants
- `src/mapper/map-reference-field.ts` — type guards + accessors
- `src/mapper/map-entry.test.ts` — `convertToMap`, `getContentId`, `getContentTypeId`
- `src/tasks/localize.ts` — `convertToMap`, `getContentTypeId`
- `src/tasks/localize.test.ts` — `getContentId`, `getFieldSettings`
- `src/tasks/fetch.ts` — `getFieldSettings`, `getEntriesLinkedToEntry/Asset`; changes `getContent` → `getContentWithSync` from `'../lib/content-sync.js'`
- `src/tasks/fetch.test.ts` — `getEntriesLinkedToEntry/Asset`
- `src/__test__/mock.ts` — `FIELD_TYPE_LINK`, `getFieldSettings`, `LINK_TYPE_*`
- `src/mapper/map-field.test.ts` — constants

### Type changes:

**`packages/contentful-ssg/src/types.ts`:**
- Remove definitions of: `ContentfulConfig`, `KeyValueMap`, `FieldSettings`, `ContentType`, `Locale`, `EntryRaw`, `AssetRaw`, `NodeRaw`, `Entry`, `Asset`, `Node`, `ContentfulCollection`, `EntryCollection`, `CollectionResponse`, `PagedGetOptions`
- Add re-exports from `@jungvonmatt/contentful-client`
- Add `SsgContentfulConfig`:
```typescript
import type { ContentfulConfig, DeliveryQueryOptions } from '@jungvonmatt/contentful-client';
export type { ContentfulConfig, DeliveryQueryOptions, ... } from '@jungvonmatt/contentful-client';

export type SsgContentfulConfig = ContentfulConfig & {
  sync?: boolean;
  query?: DeliveryQueryOptions;
};
```
- Keep `SyncOptions` (SSG-specific, used by content-sync.ts)
- `Config` type changes: `Partial<SsgContentfulConfig>` instead of `Partial<ContentfulConfig>`

### Dependency changes:
- `contentful` **stays** in `contentful-ssg/package.json` dependencies (needed for direct SDK type imports: `DeletedEntry`, `EntryFields`, `EntrySkeletonType`, `SyncCollection`, etc.)

- [ ] **Step 1:** Create `src/lib/watch-webhook.ts` — extract `addWatchWebhook` from `contentful.ts`
- [ ] **Step 2:** Create `src/lib/content-sync.ts` — extract sync logic + `getContentWithSync`
- [ ] **Step 3:** Rewrite `src/lib/contentful.ts` as facade (re-exports + `getContent` router)
- [ ] **Step 4:** Update `src/types.ts` — remove moved type definitions, add re-exports, add `SsgContentfulConfig`
- [ ] **Step 5:** Update internal module imports: change `'../lib/contentful.js'` → `'@jungvonmatt/contentful-client'` in all mapper/task files
- [ ] **Step 6:** Update `src/tasks/fetch.ts` — import `getContentWithSync` from `'../lib/content-sync.js'`
- [ ] **Step 7:** Update `contentful-ssg/src/lib/contentful.test.ts` — adjust for new structure (mock `@jungvonmatt/contentful-client`, test facade routing)
- [ ] **Step 8:** Fix `resetClient` → `resetManagementClient` in test mocks
- [ ] **Step 9:** Run full test suite: `pnpm --filter @jungvonmatt/contentful-ssg test`
- [ ] **Step 10:** Commit: `refactor(contentful-ssg): consume helpers and delivery client from contentful-client`

---

## Task 6: Update `contentful-config` README and cross-references

**Files:**
- Modify: `packages/contentful-client/README.md`
- Modify: `packages/contentful-config/README.md`

Document:
1. Package purpose and scope
2. Relationship between the packages
3. Typical usage flow: config → client → ssg

- [ ] **Step 1:** Update `contentful-client/README.md` — describe Management + Delivery + Helpers, mention contentful-config
- [ ] **Step 2:** Update `contentful-config/README.md` — mention it works with contentful-client
- [ ] **Step 3:** Commit: `docs: document package relationships`

---

## Task 7: Final validation

- [ ] **Step 1:** Run full monorepo build: `pnpm build`
- [ ] **Step 2:** Run full test suite: `pnpm test`
- [ ] **Step 3:** Verify no circular dependencies: check imports don't loop (`contentful-client` must NOT import from `contentful-ssg`)
- [ ] **Step 4:** Verify `contentful-config` still works (it imports from `contentful-client`)
- [ ] **Step 5:** Verify `tsconfig.json` in `contentful-client` — no changes needed (already uses `node16` module resolution, no project references required since packages use `workspace:*` resolution)
- [ ] **Step 6:** Verify pnpm catalog — `contentful: ^11.12.2` is already listed in `pnpm-workspace.yaml` catalog, so `"contentful": "catalog:"` will resolve correctly

---

## Decisions (Grill-Session 2025-05-22)

| # | Frage | Entscheidung |
|---|-------|-------------|
| 1 | Package-Name | Beibehalten: `@jungvonmatt/contentful-client` — passt jetzt sogar besser als "DER Client" |
| 2 | Delivery-Client Singleton | Hash-basiert (wie Management), SHA256 über `accessToken::host::space::env` |
| 3 | `getContent` Placement | Primitives only in Client (getContent, getEntriesLinked*). Sync + Orchestration bleibt in SSG |
| 4 | Pagination | `pagedGet` (rekursiv) für Delivery, `fetchAll` (SDK-built-in) für Management — verschiedene APIs, verschiedene Pagination-Strategien |
| 5 | QueryOptions Type | **Eigener `DeliveryQueryOptions` Typ** — robust, entkoppelt von SDK-internen generischen Typen |
| 6 | `contentful` als dep | Regular dependency in Client UND SSG. SSG behält es für direkte SDK-Type-Imports |
| 7 | Breaking Change | Irrelevant — Package ist intern-only. Keine Deprecation nötig |
| 8 | Subpath exports | Später. Erstmal alles über Barrel-Export |
| 9 | Sync-API | Bleibt in SSG — Cache-Strategie (Filesystem, V8 serialize) ist SSG-spezifisch |

### Decisions (Grill-Session 2025-05-23)

| # | Frage | Entscheidung |
|---|-------|-------------|
| 10 | `ContentfulConfig` + `sync` | Config im Client **ohne `sync`**. SSG definiert `SsgContentfulConfig extends ContentfulConfig` |
| 11 | SDK-Type Re-Exports | `contentful` bleibt reguläre Dependency in SSG (für `DeletedEntry`, `EntryFields` etc.) |
| 12 | `pagedGet` Export | **Nicht exportiert** — internes Implementierungsdetail. Client bietet High-Level-Funktionen |
| 13 | `QueryOptions` Entfernung | Sofort entfernen, kein Compat (internal-only Package) |
| 14 | Facade-Pattern | Facade bleibt in `contentful-ssg/src/lib/contentful.ts` — für Plugin-Consumer via Subpath-Export |
| 15 | `getContent` Semantik | Facade exportiert Router-Funktion: `sync` → `getContentWithSync`, sonst → Client's `getContent` |
| 16 | Delivery-Client Naming | `getClient` (kurz, weil Normalfall) + `getManagementClient` (qualifiziert, seltener) |
| 17 | Reset Naming | `resetClient` (Delivery) + `resetManagementClient` (CMA) — konsistent mit Gettern |
| 18 | Locales/ContentTypes | Client exportiert `getLocales(config)` + `getContentTypes(config)` als standalone Funktionen |
| 19 | `ContentfulClientOptions` | Bleibt in `management.ts` (co-location mit Consumer) |
| 20 | `types.ts` Scope | Nur cross-module + extern nutzbare Domain-Typen. Modul-interne Typen bleiben lokal |
| 21 | Client = Toolkit | Shared Toolkit, KEINE Abstraction-Boundary. SSG darf Raw-Client nutzen |
| 22 | Interne Imports | SSG-Module importieren direkt aus `@jungvonmatt/contentful-client`. Facade nur für extern |
| 23 | `convertToMap` | Gehört in `contentful-client/src/helpers.ts` — generischer Entity-Utility |

### DeliveryQueryOptions (Detail)

Eigener Typ statt SDK-Reuse, weil:
- Die `contentful` SDK-Typen (`EntriesQueries<Skeleton, Modifiers>`) sind stark generisch und als Union-Type nicht als einfacher Query-Parameter nutzbar
- Kein simpler zusammengesetzter Export-Typ im SDK vorhanden
- `QueryOptions` aus `contentful-management` hat `[key: string]: any` → null Typsicherheit
- Eigener Typ überlebt jedes SDK-Update ohne Breaking Changes

```typescript
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
```

### Delivery-Client Singleton (Detail)

```typescript
// Hash über alle relevanten Parameter
const key = createHash('sha256').update(`${token}::${host}::${spaceId}::${environmentId}`).digest('hex');
```

Vorteile gegenüber dem aktuellen Module-Level-Singleton in SSG:
- Testbar (deterministisch)
- Unterstützt Multi-Space/Multi-Env-Szenarien
- Konsistent mit Management-Client-Pattern

### Naming Convention (Detail)

```
getClient()              → Delivery (CDA/CPA) — der Normalfall, kurzer Name
getManagementClient()    → Management (CMA) — qualifiziert, seltenerer Zugriff

resetClient()            → Reset Delivery
resetManagementClient()  → Reset Management
```

### Facade Architecture (Detail)

```
Plugin/Hook:
  import { getContent, isEntry } from '@jungvonmatt/contentful-ssg/lib/contentful'
  → getContent = sync-aware router (SSG-spezifisch)
  → isEntry = re-export from @jungvonmatt/contentful-client

Internes SSG-Modul (map-field.ts, localize.ts, etc.):
  import { FIELD_TYPE_ARRAY, getContentTypeId } from '@jungvonmatt/contentful-client'
  → direkt, keine Indirection
```
