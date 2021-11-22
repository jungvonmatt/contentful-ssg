[![NPM version][npm-image]][npm-url] [![Build Status][ci-image]][ci-url] [![dependencies Status][depstat-image]][depstat-url] [![devDependencies Status][devdepstat-image]][devdepstat-url] [![Coverage][coveralls-image]][coveralls-url]

# JvM Contentful export for static site generators

Export contentful entries to filesystem (md/yaml) for static site generators (hugo/grow/...)

Automatically removes all files from the configured output directory that are not part of the exported entries.
When a `.gitignore` file is found only ignored files are removed.

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

Initializes contentful-ssg and stores the config values in the `contentful-ssg.config.js` file.

Contentful SSG ships with built in typescript support. Add `--typescript` to generate a typescript configuration file.

```bash
npx cssg init --typescript
```

<!-- prettier-ignore -->
#### Configuration values

| Name               | Type                            | Default       | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------ | ------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| accessToken        | `String`                        | `undefined`   | Content Delivery API - access token                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| previewAccessToken | `String`                        | `undefined`   | Content Preview API - access token                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| spaceId            | `String`                        | `undefined`   | Contentful Space id                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| environmentId      | `String`                        | `'master'`    | Contentful Environment id                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| format             | `String`\|`Function`\|`Object`  | `'yaml'`      | File format ( `yaml`, `toml`, `md`, `json`) You can add a function returning the format or you can add a mapping object like `{yaml: [glob pattern]}` ([pattern](https://github.com/micromatch/micromatch) should match the directory)                                                                                                                                                                                                                                     |
| directory          | `String`                        | `'./content'` | Base directory for content files.                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| validate           | `Function`                      | `undefined`   | Pass `function(transformContext, runtimeContext){...}` to validate an entry. Return a 'falsy' value to skip the entry completely. Without a validate function entries with a missing required field are skipped.                                                                                                                                                                                                     |
| transform          | `Function`                      | `undefined`   | Pass `function(transformContext, runtimeContext, prev){...}` to modify the stored object. Return `undefined` to skip the entry completely. (no file will be written)                                                                                                                                                                                                                                                                                         |
| mapDirectory       | `Function`                      | `undefined`   | Pass `function(transformContext, runtimeContext, prev){...}` to customize the directory per content-type relative to the base directory.                                                                                                                                                                                                                                                                                                                                               |
| mapFilename        | `Function`                      | `undefined`   | Pass `function(transformContext, runtimeContext, prev){...}` to customize the filename per entry                                                                                                                                                                                                                                                                                                                                                                  |
| mapAssetLink       | `Function`                      | `undefined`   | Pass `function(transformContext, runtimeContext, prev){...}` to customize how asset links are stored                                                                                                                                                                                                                                                                                                                                                                                                        |
| mapEntryLink       | `Function`                      | `undefined`   | Pass `function(transformContext, runtimeContext, prev){...}` to customize how entry links are stored                                                                                                                                                                                                                                                                                                                                                                                                        |
| mapMetaFields      | `Function`                      | `undefined`   | Pass `function(transformContext, runtimeContext, prev){...}` to customize the meta fields per entry                                                                                                                                                                                                                                                                                                                                                           |
| richTextRenderer   | `Boolean`\|`Object`\|`Function` | `{}`          | We use the contentful [`rich-text-html-renderer`](https://github.com/contentful/rich-text/tree/master/packages/rich-text-html-renderer) to render the html.<br/> You can pass a [configuration object](https://github.com/contentful/rich-text/tree/master/packages/rich-text-html-renderer#usage)<br/> or you can pass `function(document){...}` to use your own richtext renderer or you can turn it off by passing `false` to get a mirrored version of the JSON output |
| before             | `Function`                      | `undefined`   | Runs `function(runtimeContext){...}` before processing the content right after pulling data from contentful                                                                                                                                                                                                                                                                                                                                                                       |
| after              | `Function`                      | `undefined`   | Runs `function(runtimeContext){...}` after processing the content right before the cleanup                                                                                                                                                                                                                                                                                                                                                                                        |



#### Typedoc
See the types documnentation for more insights on the hook parameters: [typedoc](https://github.com/jungvonmatt/contentful-ssg/blob/main/packages/contentful-ssg/docs/index.html)

#### Helper functions

###### collectValues

Get values from linked pages to e.g. build an url out of parent slugs.

```js
{
  transform: (context) => {
    const { utils } = context;
    const slugs = utils.collectValues('fields.slug', {
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

### Grow

See [`cssg-plugin-grow`](https://github.com/jungvonmatt/contentful-ssg/tree/main/packages/cssg-plugin-grow`)


### Hugo

See [`cssg-plugin-hugo`](https://github.com/jungvonmatt/contentful-ssg/tree/main/packages/cssg-plugin-hugo`)
```


## Can I contribute?

Of course. We appreciate all of our [contributors](https://github.com/jungvonmatt/contentful-ssg/graphs/contributors) and
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
