[![NPM version][npm-image]][npm-url]

# JvM Contentful typings generator

Generate typescript definitions based on your Contentful content models.

## Getting started

### Install

```bash
npm install --save-dev @jungvonmatt/contentful-typings
```

## Commands

### help

```bash
npx contentful-typings help [command]
```

### generate

Fetch all content entries and store them as yaml in the configured directory

```bash
npx contentful-typings generate [options]
```

#### options

```
  -o, --output <filepath>  Specify output file (default: "@types/contentful.d.ts")
```

[npm-url]: https://www.npmjs.com/package/@jungvonmatt/contentful-typings
[npm-image]: https://img.shields.io/npm/v/@jungvonmatt/contentful-typings.svg
