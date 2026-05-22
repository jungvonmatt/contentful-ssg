[![NPM version][npm-image]][npm-url]

# JvM Contentful client

Shared Contentful Management API helpers for the JvM Contentful toolchain.

This package is a low-level support package used by packages such as
`@jungvonmatt/contentful-ssg`, `@jungvonmatt/contentful-config`,
`@jungvonmatt/contentful-fakes`, and `@jungvonmatt/contentful-typings`.
It is published so those packages can resolve their shared runtime dependency
outside the pnpm workspace.

## Getting started

### Install

```bash
npm install @jungvonmatt/contentful-client
```

## Usage

```js
import {
  getManagementClient,
  getSpaces,
  getEnvironment,
} from '@jungvonmatt/contentful-client';

const options = {
  managementToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN,
  spaceId: process.env.CONTENTFUL_SPACE_ID,
  environmentId: process.env.CONTENTFUL_ENVIRONMENT_ID ?? 'master',
};

const client = getManagementClient(options);
const spaces = await getSpaces(options);
const environment = await getEnvironment(options);
```

## API

- `getManagementClient(options)`: create or reuse a Contentful Management API
  plain client.
- `getSpaces(options)`: fetch all accessible spaces.
- `getSpace(options)`: fetch a single space by `spaceId`.
- `getEnvironments(options)`: fetch all environments for a space.
- `getEnvironment(options)`: fetch and validate one environment by
  `environmentId`.
- `getApiKey(options)`: fetch the first delivery API key for a space.
- `getPreviewApiKey(options)`: fetch the first preview API key for a space.
- `getOrganizations(options)`: fetch accessible organizations.
- `getWebhooks(options)`: fetch webhooks for a space.
- `addWebhook(options, id, data)`: get an existing webhook or create one with a
  deterministic ID.
- `deleteWebhook(options, id)`: delete a webhook by ID.

`resetClient()` is exported for tests that need to clear the cached management
client instance.

[npm-url]: https://www.npmjs.com/package/@jungvonmatt/contentful-client
[npm-image]: https://img.shields.io/npm/v/@jungvonmatt/contentful-client.svg
