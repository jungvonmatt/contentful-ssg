[![Build Status][ci-image]][ci-url]
# JvM Contentful export for static site generators
Export contentful entries to filesystem (md/yaml) for static site generators (hugo/grow/...)

## Getting started

### Install

```bash
npm i @jungvonmatt/contentful-ssg
```

## Commands

### help

```bash
npx cssg help [command]
```

### init

```bash
npx cssg init
```

Initializes migrations and stores the config values in the `contentful-ssg.config.js` file.

#### Configuration values

| Name               | Default        | Description                                           |
| ------------------ | -------------- | ------------------------------------------------------|
| accessToken        | `undefined`    | Content Delivery API - access token.                  |
| previewAccessToken | `undefined`    | Content Preview API - access token                    |
| spaceId            | `undefined`    | Contentful Space id                                   |
| environmentId      | 'master'       | Contentful Environment id                             |
| directory          | './content'    | Directory where the migration files are stored        |


### fetch

Fetch all content entries and store them as yaml in the configured directory

```bash
npx cssg fetch
```

## Can I contribute?

Of course. We appreciate all of our [contributors](https://github.com/jungvonmatt/contentful-migrations/graphs/contributors) and
welcome contributions to improve the project further. If you're uncertain whether an addition should be made, feel
free to open up an issue and we can discuss it.



[ci-url]: https://github.com/jungvonmatt/contentful-ssg/actions?workflow=Tests
[ci-image]: https://github.com/jungvonmatt/contentful-ssg/workflows/Tests/badge.svg
[depstat-url]: https://david-dm.org/jungvonmatt/contentful-ssg
[depstat-image]: https://img.shields.io/david/jungvonmatt/contentful-ssg.svg
[devdepstat-url]: https://david-dm.org/jungvonmatt/contentful-ssg?type=dev
[devdepstat-image]: https://img.shields.io/david/dev/jungvonmatt/contentful-ssg.svg