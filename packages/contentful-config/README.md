[![NPM version][npm-image]][npm-url]

# JvM Contentful config loader

Tool for loading and managing Contentful configurations with support for environment variables and interactive prompts.\
Based on [`@jungvonmatt/config-loader`](https://github.com/jungvonmatt/config-loader) and [`c12`](https://github.com/unjs/c12)

## Getting started

### Install

```bash
npm install @jungvonmatt/contentful-config
```

## Usage

### Basic Example

```js
import { loadContentfulConfig } from '@jungvonmatt/contentful-config';

// Load configuration from multiple sources:
// - contentful-cli configuration file (~/.contentfulrc.json)
// - environment variables (CONTENTFUL_SPACE_ID, etc.)
// - project configuration files (myapp.config.js, .myapprc, etc.)
const { config } = await loadContentfulConfig('myapp');

console.log(config.spaceId); // Contentful Space ID
console.log(config.environmentId); // Contentful Environment ID (defaults to 'master')
console.log(config.accessToken); // Content Delivery API Token
console.log(config.previewAccessToken); // Content Preview API Token
console.log(config.managementToken); // Content Management API Token
```

### With Required Values

```js
import { loadContentfulConfig } from '@jungvonmatt/contentful-config';

// If required values are not found in configuration files or
// environment variables, an interactive prompt will be displayed
const { config } = await loadContentfulConfig('myapp', {
  required: ['spaceId', 'accessToken']
});

// The configuration now contains all required values,
// either from existing sources or user input
```

## CLI

The package includes a CLI tool to generate `.env`-compatible configuration files.

### Usage

```bash
contentful-config [options]
```

### Options

| Option | Description |
| --- | --- |
| `-n, --name <name>` | Config name (default: `contentful`) |
| `-o, --output <file>` | Write output to a file instead of stdout |
| `-r, --required <keys>` | Required config keys, comma-separated or repeated (default: `spaceId,environmentId,accessToken,previewAccessToken`) |
| `-h, --help` | Show help message |

### Examples

```bash
# Print .env config to stdout
contentful-config

# Write to a .env file (merges with existing content)
contentful-config -o .env

# Use a custom config name
contentful-config -n myapp -o .env

# Specify custom required keys
contentful-config -r spaceId,accessToken

# Or repeat the flag
contentful-config -r spaceId -r accessToken -r environmentId
```

### Behavior

- **Login check**: If no Contentful management token is found, the CLI automatically runs `contentful login` to authenticate.
- **Interactive prompts**: All required keys are prompted interactively, with existing values pre-filled as defaults.
- **File merging**: When using `-o`, existing file content is preserved. Matching keys are updated in place, new keys are appended. Comments and unrelated entries remain untouched.
- **Output**: The following environment variables are generated:

| Config Key | Environment Variable |
| --- | --- |
| `spaceId` | `CONTENTFUL_SPACE_ID` |
| `environmentId` | `CONTENTFUL_ENVIRONMENT_ID` |
| `accessToken` | `CONTENTFUL_DELIVERY_ACCESS_TOKEN` |
| `previewAccessToken` | `CONTENTFUL_PREVIEW_ACCESS_TOKEN` |
| `host` | `CONTENTFUL_HOST` |

> **Note:** The management token is intentionally excluded from the output as it is read from the Contentful CLI config file.

[npm-url]: https://www.npmjs.com/package/@jungvonmatt/contentful-config
[npm-image]: https://img.shields.io/npm/v/@jungvonmatt/contentful-config.svg
