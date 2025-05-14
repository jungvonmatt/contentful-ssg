[![NPM version][npm-image]][npm-url]

# JvM Contentful fake data generator

Generate fake data files based on your Contentful content models

## Getting started

### Install

```bash
npm install --save-dev @jungvonmatt/contentful-fakes
```

## Commands

### help

```bash
npx contentful-fakes help [command]
```

### create

Fetch all content entries and store them as yaml in the configured directory

```bash
npx contentful-fakes create [options]
```

#### options

```
  -c, --content-type` `<content-type...>  Specify content-types
  -e, --extension <extension>           Specify output format (default: "yaml")
  -o, --output-directory <directory>    Specify output directory (default: "data")
  --config <configuration file>         Use this configuration, overriding other config options if present
```

[npm-url]: https://www.npmjs.com/package/@jungvonmatt/contentful-fakes
[npm-image]: https://img.shields.io/npm/v/@jungvonmatt/contentful-fakes.svg
