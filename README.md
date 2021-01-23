[![NPM version][npm-image]][npm-url] [![Build Status][ci-image]][ci-url] [![dependencies Status][depstat-image]][depstat-url] [![devDependencies Status][devdepstat-image]][devdepstat-url] [![Coverage][coveralls-image]][coveralls-url]

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

<!-- prettier-ignore -->
#### Configuration values

| Name               | Type                 | Default       | Description                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------ | -------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| accessToken        | `String`             | `undefined`   | Content Delivery API - access token                                                                                                                                                                                                                                                                                                                                                 |
| previewAccessToken | `String`             | `undefined`   | Content Preview API - access token                                                                                                                                                                                                                                                                                                                                                  |
| spaceId            | `String`             | `undefined`   | Contentful Space id                                                                                                                                                                                                                                                                                                                                                                 |
| environmentId      | `String`             | `'master'`    | Contentful Environment id                                                                                                                                                                                                                                                                                                                                                           |
| format             | `String`             | `'yaml'`      | File format (currently yaml is the only supported format)                                                                                                                                                                                                                                                                                                                           |
| directory          | `String`             | `'./content'` | Base directory for content files.                                                                                                                                                                                                                                                                                                                                                   |
| typeConfig         | `Object`             | `undefined'`  | Pass a map with e.g. grow's blueprint config ({<contenttypeid>: {$path: '...', $view: '...'}})                                                                                                                                                                                                                                                                                      |
| preset             | `String`             | `undefined'`  | Pass `grow` to enable generator specific addons                                                                                                                                                                                                                                                                                                                                     |
| transform          | `Function`           | `undefined`   | Pass `function(content, { entry, contentType, locale, helper, ... }){...}` to modify the stored object                                                                                                                                                                                                                                                                              |
| mapDirectory       | `Function`           | `undefined`   | Pass `function(contentType, { locale, helper })` to customize the directory per content-type relative to the base directory.                                                                                                                                                                                                                                                        |
| mapFilename        | `Function`           | `undefined`   | Pass `function(data, { locale, contentType, entry, format, helper })` to customize the filename per entry                                                                                                                                                                                                                                                                           |
| mapAssetLink       | `Function`           | `undefined`   | Pass `function(asset){...}` to customize how asset links are stored                                                                                                                                                                                                                                                                                                                 |
| mapEntryLink       | `Function`           | `undefined`   | Pass `function(entry){...}` to customize how entry links are stored                                                                                                                                                                                                                                                                                                                 |
| richTextRenderer   | `Object`\|`Function` | `{}`          | We use the contentful [`rich-text-html-renderer`](https://github.com/contentful/rich-text/tree/master/packages/rich-text-html-renderer) to render the html.<br/> You can pass a [configuration object](https://github.com/contentful/rich-text/tree/master/packages/rich-text-html-renderer#usage)<br/> or you can pass `function(document){...}` to use your own richtext renderer |

#### Helper functions

###### collectValues

Get values from linked pages to e.g. build an url out of parent slugs.

```js
{
  transform: (content, options) => {
    const { helper } = options;
    const slugs = helper.collectValues('fields.slug', {
      linkField: 'fields.parentPage',
    });

    return { ...content, url: '/' + slugs.join('/') };
  };
}
```

_contentful-ssg.config.js_

###### collectParentValues

The same as collectValues just without the value from the current entry

### fetch

Fetch all content entries and store them as yaml in the configured directory

```bash
npx cssg fetch
```

## Example configuration

```js
const path = require('path');

module.exports = {
  spaceId: '...',
  environmentId: '...',
  accessToken: '...',
  previewAccessToken: '...',
  directory: 'content',
  preset: 'grow',
  mapDirectory: (contentType) => {
    switch (contentType.substr(0, 2)) {
      case 't-':
        return contentType;
      case 'o-':
        return path.join('partials/organisms', contentType);
      case 'm-':
        return path.join('partials/molecules', contentType);
      case 'a-':
        return path.join('partials/atoms', contentType);
      default:
        return path.join('partials', contentType);
    }
  },
  typeConfig: {
    't-home': {
      view: '/views/t-home.html',
      path: '/{locale}/',
    },
    't-article': {
      view: '/views/t-article.html',
      path: '/{locale}/{category}/{slug}/',
    },
  },
};
```

![Demo](https://github.com/jungvonmatt/contentful-ssg/blob/main/demo.gif?raw=true)

## Can I contribute?

Of course. We appreciate all of our [contributors](https://github.com/jungvonmatt/contentful-migrations/graphs/contributors) and
welcome contributions to improve the project further. If you're uncertain whether an addition should be made, feel
free to open up an issue and we can discuss it.

[npm-url]: https://www.npmjs.com/package/@jungvonmatt/contentful-ssg
[npm-image]: https://img.shields.io/npm/v/@jungvonmatt/contentful-ssg.svg
[ci-url]: https://github.com/jungvonmatt/contentful-ssg/actions?workflow=Tests
[ci-image]: https://github.com/jungvonmatt/contentful-ssg/workflows/Tests/badge.svg
[depstat-url]: https://david-dm.org/jungvonmatt/contentful-ssg
[depstat-image]: https://img.shields.io/david/jungvonmatt/contentful-ssg.svg
[devdepstat-url]: https://david-dm.org/jungvonmatt/contentful-ssg?type=dev
[devdepstat-image]: https://img.shields.io/david/dev/jungvonmatt/contentful-ssg.svg
[coveralls-url]: https://coveralls.io/github/jungvonmatt/contentful-ssg?branch=main
[coveralls-image]: https://coveralls.io/repos/github/jungvonmatt/contentful-ssg/badge.svg?branch=main
