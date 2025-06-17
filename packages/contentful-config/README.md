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

[npm-url]: https://www.npmjs.com/package/@jungvonmatt/contentful-config
[npm-image]: https://img.shields.io/npm/v/@jungvonmatt/contentful-config.svg
