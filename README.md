# JvM Contentful export for static site generators

Fast and highly and customizable Contentful exporter for static site generators.

![gif](https://github.com/jungvonmatt/contentful-ssg/blob/main/demo.gif?raw=true)

## Packages

### Official

- [`contentful-ssg`](packages/contentful-ssg)\
  Core CLI library

#### Plugins

- [`cssg-plugin-grow`](packages/cssg-plugin-grow`)\
  Plugin to use `contentful-ssg` with the [`grow`](https://grow.io/) static site generator.

- [`cssg-plugin-hugo`](packages/cssg-plugin-hugo`)\
  Plugin to use `contentful-ssg` with the [`hugo`](https://gohugo.io/) static site generator.

- [`cssg-plugin-assets`](packages/cssg-plugin-assets`)\
  Plugin to generate asset data to be used in `<picture>` / `<img srcset="...">` utilizing the [contentful image api](https://www.contentful.com/developers/docs/references/images-api/) with support for downloading assets to bypass the contentful cdn on production sites.

## Get involved

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?maxAge=31557600)](http://makeapullrequest.com)

We appreciate any help on our repositories. For more details about how to
contribute, see our [CONTRIBUTING.md](CONTRIBUTING.md)
document.

## You found a bug or want to propose a feature?

- File an issue here on GitHub: [![File an issue](https://img.shields.io/badge/-Create%20Issue-6cc644.svg?logo=github&maxAge=31557600)](https://github.com/jungvonmatt/contentful-ssg/issues/new). Make sure to remove any credential from your code before sharing it.

## License

This repository is published under the [MIT](LICENSE) license.
