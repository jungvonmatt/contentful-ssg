[![NPM version][npm-image]][npm-url] [![Build Status][ci-image]][ci-url] [![Coverage][coveralls-image]][coveralls-url]

# JvM Contentful export for static site generators

Export contentful entries to filesystem (md/yaml) for static site generators (hugo/grow/...)

Automatically removes all files from the configured output directory that are not part of the exported entries.
When a `.gitignore` file is found only ignored files are removed.

## Getting started

### Install

```bash
npm install --save-dev @jungvonmatt/contentful-ssg
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

| Name               | Type                                                                  | Default       | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------ | --------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| accessToken        | `string`                                                              | `undefined`   | Content Delivery API - access token                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| previewAccessToken | `string`                                                              | `undefined`   | Content Preview API - access token                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| spaceId            | `string`                                                              | `undefined`   | Contentful Space id                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| environmentId      | `string`                                                              | `'master'`    | Contentful Environment id                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| format             | `string`\|`function`\|`object`                                        | `'yaml'`      | File format ( `yaml`, `toml`, `md`, `json`) You can add a function returning the format or you can add a mapping object like `{yaml: [glob pattern]}` ([pattern](https://github.com/micromatch/micromatch) should match the directory)                                                                                                                                                                                                                                     |
| plugins            | `[string]`\|`[[string, options]]`\|`[{resolve:'string', options:{}}]` | `[]`          | Add plugins to contentful-ssg. See [Plugins](#plugins) |
| directory          | `string`                                                              | `'./content'` | Base directory for content files.                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| validate           | `function`                                                            | `undefined`   | Pass `function(transformContext, runtimeContext){...}` to validate an entry. Return `false` to skip the entry completely. Without a validate function entries with a missing required field are skipped.                                                                                                                                                                                                                                                                   |
| transform          | `function`                                                            | `undefined`   | Pass `function(transformContext, runtimeContext){...}` to modify the stored object. Return `undefined` to skip the entry completely. (no file will be written)                                                                                                                                                                                                                                                                                                             |
| mapDirectory       | `function`                                                            | `undefined`   | Pass `function(transformContext, runtimeContext, defaultValue){...}` to customize the directory per content-type relative to the base directory.                                                                                                                                                                                                                                                                                                                           |
| mapFilename        | `function`                                                            | `undefined`   | Pass `function(transformContext, runtimeContext, defaultValue){...}` to customize the filename per entry                                                                                                                                                                                                                                                                                                                                                                   |
| mapAssetLink       | `function`                                                            | `undefined`   | Pass `function(transformContext, runtimeContext, defaultValue){...}` to customize how asset links are stored                                                                                                                                                                                                                                                                                                                                                               |
| mapEntryLink       | `function`                                                            | `undefined`   | Pass `function(transformContext, runtimeContext, defaultValue){...}` to customize how entry links are stored                                                                                                                                                                                                                                                                                                                                                               |
| mapMetaFields      | `function`                                                            | `undefined`   | Pass `function(transformContext, runtimeContext, defaultValue){...}` to customize the meta fields per entry                                                                                                                                                                                                                                                                                                                                                                |
| richTextRenderer   | `boolean`\|`object`\|`function`                                       | `{}`          | We use the contentful [`rich-text-html-renderer`](https://github.com/contentful/rich-text/tree/master/packages/rich-text-html-renderer) to render the html.<br/> You can pass a [configuration object](https://github.com/contentful/rich-text/tree/master/packages/rich-text-html-renderer#usage)<br/> or you can pass `function(document){...}` to use your own richtext renderer or you can turn it off by passing `false` to get a mirrored version of the JSON output |
| before             | `function`                                                            | `undefined`   | Runs `function(runtimeContext){...}` before processing the content right after pulling data from contentful                                                                                                                                                                                                                                                                                                                                                                |
| after              | `function`                                                            | `undefined`   | Runs `function(runtimeContext){...}` after processing the content right before the cleanup                                                                                                                                                                                                                                                                                                                                                                                 |

### Plugins

You can add plugins to contentful-ssg by adding the package name or a local path to the plugins array of your configuration.

```js
plugins: ['my-plugin-package', './plugins/my-local-plugin]
```

All plugins can have options specified by wrapping the name and an options object in an array inside your config or by using a more verbose object notation.

For specifying no options, these are all equivalent:
```js
{
  "plugins": ["my-plugin", ["my-plugin"], ["my-plugin", {}], {resolve: "my-plugin", options: {}}]
}
```

To specify an option, pass an object with the keys as the option names.
```js
{
  "plugins": [
    [
      "my-plugin-a",
      {
        "option": "value"
      }
    ],
    {
      resolve: "my-plugin-b",
      options: {
        "option": "value"
      }
    }
  ]
}
```

### Runtime Hooks

**before**

```js
import
(runtimeContext) => {
  // Do things before processing the localized contentful entries
  // The return value should be an object which is merged with the runtime context.
  return { key: 'test' };
}
```

**after**

```js
(runtimeContext) => {
  // Do things after processing the localized contentful entries before cleanup
  // We have access to values added to the context in the before hook
  console.log(runtimeContext.key); // -> 'test'
};
```

### Transform Hooks

**transform**

```js
(transformContext, runtimeContext) => {
  const { content } = transformContext;
  // modify content and
  // return object
  return content;
};
```

**mapFilename**

```js
(transformContext, runtimeContext, defaultValue) => {
  // customize the filename on entry level
  // return string
  return defaultValue;
};
```

**mapDirectory**

```js
(transformContext, runtimeContext, defaultValue) => {
  // customize the directory on entry level
  // return string
  return defaultValue;
};
```

**mapAssetLink**

```js
(transformContext, runtimeContext, defaultValue) => {
  const {asset} = transformContext;
  // customize the asset representation in front matter
  // return object
  return { ...defaultValue, ... };
}
```

**mapEntryLink**

```js
(transformContext, runtimeContext, defaultValue) => {
  const {entry} = transformContext;
  // customize how the entry is added to your front matter
  // return object
  return { ...defaultValue, ... };
}
```

**mapMetaFields**

```js
(transformContext, runtimeContext, defaultValue) => {
  const {entry} = transformContext;
  // customize how the sys meta data is added to your front matter
  // return object
  return { ...defaultValue, ... };
}
```

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

###### collectParentValues

The same as collectValues just without the value from the current entry

###### waitFor

Wait for specific entry to be transformed.
Be aware that this can lead to dead ends when you're awaiting something which
itself is waiting for the current entry to be transformed.

```js
{
  transform: (context) => {
    const { utils } = context;
    try {
      const linkedContext = await utils.waitFor('<contentful-id>');

      if (linkedContext.error) {
        // Transform of linked entry failed
      }

      if (linkedContext.content) {
        // Do something usefull with the transformed data
        // which you can't do with context.entryMap.get('<contentful-id>')
      }

    } catch (error) {
      // Entry isn't available
    }

    return { ...content };
  };
}
```

### fetch

Fetch all content entries and store them as yaml in the configured directory

```bash
npx cssg fetch
```

To see all available command line options call
```bash
npx cssg help fetch
```

## Example configuration

### Grow

See [`cssg-plugin-grow`](../cssg-plugin-grow)

### Hugo

See [`cssg-plugin-hugo`](../cssg-plugin-hugo)

[npm-url]: https://www.npmjs.com/package/@jungvonmatt/contentful-ssg
[npm-image]: https://img.shields.io/npm/v/@jungvonmatt/contentful-ssg.svg
[ci-url]: https://github.com/jungvonmatt/contentful-ssg/actions?workflow=Tests
[ci-image]: https://github.com/jungvonmatt/contentful-ssg/workflows/Tests/badge.svg
[coveralls-url]: https://coveralls.io/github/jungvonmatt/contentful-ssg?branch=main
[coveralls-image]: https://coveralls.io/repos/github/jungvonmatt/contentful-ssg/badge.svg?branch=main
