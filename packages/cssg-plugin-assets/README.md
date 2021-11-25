# cssg-plugin-assets

Provides support multiple asset derivatives (sizes/ratios/formats) and offers the ability to download assets when they should not be served by the contentful cdn.

**Download**

Just add `download: true` to the plugin configuration and all assets will be stored inside your public folder. See [options](#options) for further customization options.

**Derivatives**

You can specify sizes and [mime types](https://www.contentful.com/developers/docs/references/images-api/#/reference/changing-formats) as well as custom ratios and [focus areas](https://www.contentful.com/developers/docs/references/images-api/#/reference/resizing-&-cropping/specify-focus-area) in the plugin config.

You can specify global defaults for ratios and focus areas, defaults per content-type and it's also possible to set the values for a specific field.

```js
  options: {
    sizes: [480, 960, 1280] // Generate these widths
    focusAreas: {
      default: 'face',                          // Use the largest face detected as focus area
    }
    ratios: {
      default: {square: 1/1, landscape: 16/9},  // Generates original ratio, square and landscape derivatives when nothing else is specified
      contentTypeId: {
        default: {rectangle: 4/3},              // contentTypeId.fields.anyFieldId is generated with original and rectangle derivatives
        fieldId: {square: 1/1},                 // contentTypeId.fields.fieldId is generated with original and square derivatives
      }
    },
  }
```

This plugin automatically generates src and srcSets for all combinations.

```yaml
mime_type: image/jpeg
url: >-
  //images.ctfassets.net/jnaeogay42m9/uS1BxbrBe5VHCBUBg3Xmj/d63b238897467d61b3824fc7bb898fb3/aj-McsNra2VRQQ-unsplash.jpg
title: image-1-16x9
description: ''
width: 3696
height: 2079
file_size: 550732
derivatives:
  original:
    width: 3696
    height: 2079
    sizes: '(max-width: 3696px) 100vw, 3696px'
    srcsets:
      - type: image/webp
        srcset: >-
          https://images.ctfassets.net/....webp 1280w
          https://images.ctfassets.net/....webp 960w
          https://images.ctfassets.net/....webp 480w
      - type: image/avif
        srcset: >-
          https://images.ctfassets.net/....avif 1280w
          https://images.ctfassets.net/....avif 960w
          https://images.ctfassets.net/....avif 480w
      - type: image/jpeg
        srcset: >-
          https://images.ctfassets.net/....jpg 1280w
          https://images.ctfassets.net/....jpg 960w
          https://images.ctfassets.net/....jpg 480w
    src: https://images.ctfassets.net/....jpg
  square:
    width: 2079
    height: 2079
    sizes: '(max-width: 2079px) 100vw, 2079px'
    srcsets: ...
```

## Install

`npm install @jungvonmatt/cssg-plugin-assets`

## How to use

```js
// In your contentful-ssg.config.js
plugins: [
  {
    resolve: `@jungvonmatt/cssg-plugin-assets`,
    options: {
      // Add any options here
    },
  },
];
```

## Options

sizes?: number[]; // Widths which should be generated
rootDir?: string; // Project root
assetBase?: string; //
assetFolder?: string; //
cacheFolder?: string; //
extraTypes?: MimeTypes[]; // Defaults to ['image/webp', 'image/avif'].
ratios?: RatioConfig; //
focusAreas?: FocusAreaConfig; //
}

| Name        | Type       | Default                        | Description                                                                                                                                                                  |
| ----------- | ---------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| download    | `boolean`  | `false`                        | Download assets to bypass the contentful cdn on your production site.                                                                                                        |
| sizes       | `number[]` | `[1920, 1280, 640, 320]`       | Widths which should be generated.                                                                                                                                            |
| rootDir     | `string`   | `process.cwd()`                | Project root. Only used alongside `download` option.                                                                                                                         |
| assetBase   | `string`   | `'/assets/cf'`                 | Base URI. Defaults to '/assets/cf'. Will be located in your asset folder. Only used alongside `download` option.                                                             |
| assetFolder | `string`   | `'static'`                     | Public folder relative to you project root. Usually something like 'public' or 'static' depending on your static site generator. Only used alongside `download` option.      |
| cacheFolder | `string`   | `'.cache'`                     | Folder where the downloaded assets should be cached. Only used alongside `download` option.                                                                                  |
| extraTypes  | `boolean`  | `['image/webp', 'image/avif']` | Additional mimetypes to create alongside the asset mime-type.                                                                                                                |
| ratios      | `object`   | `{}`                           | Configure ratios per content-type && field or add a default ratio config                                                                                                     |
| focusAreas  | `object`   | `{default: 'center'}`          | Specify [focus area](https://www.contentful.com/developers/docs/references/images-api/#/reference/resizing-&-cropping/specify-focus-area) which should be used for cropping. |

Example:

```js
// In your contentful-ssg.config.js
plugins: [
  {
    resolve: `@jungvonmatt/cssg-plugin-assets`,
    options: {
      download: true,
      sizes: [1920, 1280, 640, 320],
      rootDir: process.cwd(),
      assetBase: '/assets/cf',
      assetFolder: 'public',
      cacheFolder: '.cache',
      extraTypes: ['image/webp'],
      ratios: { default: { square: 1 / 1, portrait: 3 / 4, landscape: 16 / 9 } },
      focusAreas: { default: 'face' },
    },
  },
];
```
