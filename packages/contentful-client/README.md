[![NPM version][npm-image]][npm-url]

# @jungvonmatt/contentful-client

Shared Contentful API toolkit (Management + Delivery + Helpers) for the JvM Contentful toolchain.

This is a low-level support package used by `@jungvonmatt/contentful-ssg`,
`@jungvonmatt/contentful-config`, `@jungvonmatt/contentful-fakes`, and
`@jungvonmatt/contentful-typings`. It is published so those packages can
resolve their shared runtime dependency outside the pnpm workspace.

> **Note:** This is an internal-only package published to npm for use by internal tools.

## Install

```bash
npm install @jungvonmatt/contentful-client
```

## Modules

### Management API

```js
import {
  getManagementClient,
  getSpaces,
  getEnvironment,
} from "@jungvonmatt/contentful-client";
```

- `getManagementClient(options)` — create or reuse a Management API plain client
- `getSpaces(options)` — fetch all accessible spaces
- `getSpace(options)` — fetch a single space by `spaceId`
- `getEnvironments(options)` — fetch all environments for a space
- `getEnvironment(options)` — fetch and validate one environment by `environmentId`
- `getApiKey(options)` — fetch the first delivery API key for a space
- `getPreviewApiKey(options)` — fetch the first preview API key for a space
- `getOrganizations(options)` — fetch accessible organizations
- `getWebhooks(options)` — fetch webhooks for a space
- `addWebhook(options, id, data)` — get or create a webhook with a deterministic ID
- `deleteWebhook(options, id)` — delete a webhook by ID
- `resetManagementClient()` — clear the cached client instance (for tests)

### Delivery API

```js
import {
  getClient,
  getContent,
  getLocales,
  getContentTypes,
} from "@jungvonmatt/contentful-client";
```

- `getClient(options)` — create or reuse a Delivery/Preview API client
- `getContent(options)` — fetch all entries and assets for a space/environment
- `getLocales(options)` — fetch available locales
- `getContentTypes(options)` — fetch all content types
- `getEntriesLinkedToEntry(options, entryId)` — reverse-link lookup for entries
- `getEntriesLinkedToAsset(options, assetId)` — reverse-link lookup for assets
- `resetClient()` — clear the cached client instance (for tests)
- `MAX_ALLOWED_LIMIT` — page-size constant used internally

### Helpers

```js
import {
  isEntry,
  isAsset,
  isLink,
  getContentTypeId,
  convertToMap,
} from "@jungvonmatt/contentful-client";
```

- Type guards: `isEntry`, `isAsset`, `isLink`, `isAssetLink`, `isEntryLink`, `isContentfulObject`
- ID extractors: `getContentTypeId`, `getContentId`, `getEnvironmentId`
- Converters: `convertToMap`, `getFieldSettings`
- Field-type constants: `FIELD_TYPE_SYMBOL`, `FIELD_TYPE_TEXT`, `FIELD_TYPE_RICHTEXT`, etc.

## Related packages

| Package                          | Role                                                             |
| -------------------------------- | ---------------------------------------------------------------- |
| `@jungvonmatt/contentful-config` | Generates `.contentfulrc.json` (credentials + space/environment) |
| `@jungvonmatt/contentful-client` | Uses config for API access (Management + Delivery)               |
| `@jungvonmatt/contentful-ssg`    | Orchestrates SSG builds with content from contentful-client      |

[npm-url]: https://www.npmjs.com/package/@jungvonmatt/contentful-client
[npm-image]: https://img.shields.io/npm/v/@jungvonmatt/contentful-client.svg
