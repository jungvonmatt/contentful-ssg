[![NPM version][npm-image]][npm-url]

# JvM Contentful typings generator

Generate typescript definitions based on your Contentful content models.
It's mainly a wrapper around [`cf-content-types-generator`](https://www.npmjs.com/package/cf-content-types-generator)

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
  -o, --output <filepath>         Specify output file (default: "@types/contentful.d.ts")
  -l, --localized                 Add localized types
  -d, --jsdoc                     Add JSDoc comments
  -g, --typeguard                 Add type guards
  --config <configuration file>   Use this configuration, overriding other config options if present
  --cwd <directory>               Working directory. Defaults to process.cwd()
  -h, --help                      display help for command
```

[npm-url]: https://www.npmjs.com/package/@jungvonmatt/contentful-typings
[npm-image]: https://img.shields.io/npm/v/@jungvonmatt/contentful-typings.svg
