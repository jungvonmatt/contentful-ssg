# cssg-plugin-hugo

Provides support for the [hugo](https://gohugo.io/) static site generator.

This plugin adds provides some opinionated settings/features when using the for the use of the hugo static site generator.

**Multilingual Mode**

This plugin automatically generates a `/config/_default/languages.toml` file for you based on youtr locale configuration in contentful.
Your content is organized using different content directories for each of the languages. See https://gohugo.io/content-management/multilingual/#translation-by-content-directory

**Translation of Strings**

When you provide a content type for string translations, the content is automatically collected and stored as translations present in i18n/ at the root of your project.
See https://gohugo.io/content-management/multilingual/#translation-of-strings.

The configured translations can then be used using the [`i18n`](https://gohugo.io/functions/i18n/) function.

```go
{{ i18n "translation_id" }}
```

<details>
    <summary>Contentful migration for `d-i18n`</summary>
    <p>

```js

module.exports = function (migration) {
  const dI18n = migration
    .createContentType('d-i18n')
    .name('Data: i18n')
    .description('Key value store for i18n')
    .displayField('key');

  dI18n
    .createField('key')
    .name('Key')
    .type('Symbol')
    .localized(false)
    .required(true)
    .validations([
      {
        unique: true,
      },
    ])
    .disabled(false)
    .omitted(false);

  dI18n
    .createField('other')
    .name('Value')
    .type('Symbol')
    .localized(true)
    .required(true)
    .validations([])
    .disabled(false)
    .omitted(false);

  dI18n
    .createField('one')
    .name('Singular value')
    .type('Symbol')
    .localized(true)
    .required(false)
    .validations([])
    .disabled(false)
    .omitted(false);

  dI18n.changeFieldControl('key', 'builtin', 'singleLine', {});
  dI18n.changeFieldControl('other', 'builtin', 'singleLine', {});
  dI18n.changeFieldControl('one', 'builtin', 'singleLine', {
    helpText: 'Optionally pass a dedicated singular value',
  });
};
```
</p>
</details>

**Content Organization**

Your content will be organised according to hugo's best practices inside the `content` directory at the root of your project. See https://gohugo.io/content-management/organization/
In order for this to work properly it is required to provide a `slug` field in your content tyopes describing pages as well as a reference to the parent entry.
It's also required to have a settings content type in contentful which holds a reference to the home page.
This way we can compute the folder structure inside `/content` to utilize the full potential of hugos [content sections](https://gohugo.io/content-management/sections/).

**Naming Convention**
All keys in frontmatter besides internal ones like `translationKey` are automatically converted to `snake_case` to prevent issues with hugo storing all `.Params` as lowercase.

> Page-level .Params are only accessible in lowercase.

See https://gohugo.io/variables/page/#page-level-params and https://discourse.gohugo.io/t/config-params-should-be-all-lowercase-or-not/5051

**Contentful References**

All reference fields are extended by the path to the associated markdown file so you can easily load the content:

```go
{{ with .Params.reference_field }}
  {{ $page := .Site.GetPage(.path) }}
{{ end }}
```


## Install

`npm install @jungvonmatt/cssg-plugin-hugo`

## How to use

```js
// In your contentful-ssg.config.js
plugins: [
  {
    resolve: `@jungvonmatt/cssg-plugin-hugo`,
    options: {
      // Add any options here
    },
  },
];
```

## Options

| Name           | Type      | Default                           | Description                                                                                                                                                                                                                                                                                                                                     |
| -------------- | --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| typeIdSettings | `string`  | `'d-settings'`                    | The id of the settings content type.                                                                                                                                                                                                                                                                                                            |
| typeIdI18n     | `string`  | `'d-i18n'`                        | The id of the i18n content type for the translation of strings.                                                                                                                                                                                                                                                                                                                |
| fieldIdHome    | `string`  | `'home'`                          | The id of reference field to the home page in the settings content type.                                                                                                                                                                                                                                                                        |
| fieldIdSlug    | `string`  | `'slug'`                          | The id of the slug field in page content types.                                                                                                                                                                                                                                                                                                 |
| fieldIdParent  | `string`  | `'parent_page'`                   | The id of the parent page reference field in page content types.                                                                                                                                                                                                                                                                                |
| languageConfig | `boolean` | `true`                            | Auto-generate the hugo language config based on your locale configuration in contentful.                                                                                                                                                                                                                                                        |
| typeConfig     | `object`  | `{ page: ['page'], data: ['d-*']} | Pass a map with entry types (`data`, `map`) pointing to one or more glob patterns matching the content type ids.\ Data types will be stored inside the `/data/` directory. \ pages types will be stored inside `/content/<locale>/`.\ All content types that do not match are considered headless and will be stored inside `/content/headless` |

Example:

```js
// In your contentful-ssg.config.js
plugins: [
  {
    resolve: `@jungvonmatt/cssg-plugin-hugo`,
    options: {
      typeIdSettings: 'd-settings',
      typeIdI18n: 'd-i18n',
      languageConfig: true,
      fieldIdHome: 'home',
      fieldIdSlug: 'slug',
      fieldIdParent: 'parent_page',
      typeConfig: {
        page: ['page'],
        data: ['d-*'],
      },
    },
  },
];
```
