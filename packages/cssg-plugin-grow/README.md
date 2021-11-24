# cssg-plugin-grow

Provides support for the [grow](https://grow.io/) static site generator.

This plugin handles some common configuration requirements when using the grow static site generator.

- Prepends a `$` in the yaml front matter to 'special' internal fields like slug, title, date, etc. (`slug -> $slug`) so they will be processed by grow.
- Writes blueprint.yml files for the content-types configured in the `typeConfig` setting.
- Resolves links to other entries using grow's yaml constructors. See https://grow.dev/reference/documents/#constructors

## Install

`npm install @jungvonmatt/cssg-plugin-grow`

## How to use

```js
// In your contentful-ssg.config.js
plugins: [
  {
    resolve: `@jungvonmatt/cssg-plugin-grow`,
    options: {
      // Add any options here
    },
  },
];
```

## Options

| Name       | Type     | Default     | Description                                                                                    |
| ---------- | -------- | ----------- | ---------------------------------------------------------------------------------------------- |
| typeConfig | `Object` | `undefined` | Pass a map with e.g. grow's blueprint config ({<contenttypeid>: {$path: '...', $view: '...'}}) |

For example, to mark the content types `t-category` and `t-article` as documents which require a blueprint config:

```js
// In your contentful-ssg.config.js
plugins: [
  {
    resolve: `@jungvonmatt/cssg-plugin-grow`,
    options: {
      typeConfig: {
        't-category': {
          view: '/views/t-category.html',
          path: '/{locale}/{slug}/',
        },
        't-article': {
          view: '/views/t-article.html',
          path: '/{locale}/{slug}/',
        },
      },
    },
  },
];
```
