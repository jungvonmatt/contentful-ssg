# JvM Contentful export for static site generators


[![Build Status][ci-image]][ci-url] [![Coverage][coveralls-image]][coveralls-url] [![Sonarcloud Status][sonarcloud-image]][sonarcloud-url]

Fast and highly and customizable Contentful exporter for static site generators.

![gif](https://github.com/jungvonmatt/contentful-ssg/blob/main/demo.gif?raw=true)

## Packages

#### CLI 
- [`contentful-ssg`](packages/contentful-ssg)\
  [![NPM version][contentful-ssg-npm-image]][contentful-ssg-npm-url]

#### Plugins

- [`cssg-plugin-grow`](packages/cssg-plugin-grow)\
  [![NPM version][cssg-plugin-grow-npm-image]][cssg-plugin-grow-npm-url]\
  Plugin to use `contentful-ssg` with the [`grow`](https://grow.io/) static site generator.

- [`cssg-plugin-hugo`](packages/cssg-plugin-hugo)\
  [![NPM version][cssg-plugin-hugo-npm-image]][cssg-plugin-hugo-npm-url]\
  Plugin to use `contentful-ssg` with the [`hugo`](https://gohugo.io/) static site generator.

- [`cssg-plugin-assets`](packages/cssg-plugin-assets)\
  [![NPM version][cssg-plugin-assets-npm-image]][cssg-plugin-assets-npm-url]\
  Plugin to generate asset data to be used in `<picture>` / `<img srcset="...">` utilizing the [contentful image api](https://www.contentful.com/developers/docs/references/images-api/) with support for downloading assets to bypass the contentful cdn on production sites.

## Get involved

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?maxAge=31557600)](http://makeapullrequest.com)

We appreciate any help on our repositories. For more details about how to
contribute, see our [CONTRIBUTING.md](CONTRIBUTING.md)
document.

## Contributors
<a href="https://github.com/jungvonmatt/contentful-ssg/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=jungvonmatt/contentful-ssg" />
</a>


## You found a bug or want to propose a feature?

File an issue here on GitHub: [![File an issue](https://img.shields.io/badge/-Create%20Issue-6cc644.svg?logo=github&maxAge=31557600)](https://github.com/jungvonmatt/contentful-ssg/issues/new).\
Make sure to remove any credential from your code before sharing it.

## License

This repository is published under the [MIT](LICENSE) license.

[contentful-ssg-npm-url]: https://www.npmjs.com/package/@jungvonmatt/contentful-ssg
[contentful-ssg-npm-image]: https://img.shields.io/npm/v/@jungvonmatt/contentful-ssg.svg
[cssg-plugin-grow-npm-url]: https://www.npmjs.com/package/@jungvonmatt/cssg-plugin-grow
[cssg-plugin-grow-npm-image]: https://img.shields.io/npm/v/@jungvonmatt/cssg-plugin-grow.svg
[cssg-plugin-hugo-npm-url]: https://www.npmjs.com/package/@jungvonmatt/cssg-plugin-hugo
[cssg-plugin-hugo-npm-image]: https://img.shields.io/npm/v/@jungvonmatt/cssg-plugin-hugo.svg
[cssg-plugin-assets-npm-url]: https://www.npmjs.com/package/@jungvonmatt/cssg-plugin-assets
[cssg-plugin-assets-npm-image]: https://img.shields.io/npm/v/@jungvonmatt/cssg-plugin-assets.svg
[ci-url]: https://github.com/jungvonmatt/contentful-ssg/actions?workflow=Tests
[ci-image]: https://github.com/jungvonmatt/contentful-ssg/workflows/Tests/badge.svg
[coveralls-url]: https://coveralls.io/github/jungvonmatt/contentful-ssg?branch=main
[coveralls-image]: https://img.shields.io/coveralls/github/jungvonmatt/contentful-ssg/main.svg
[sonarcloud-url]: https://sonarcloud.io/dashboard?id=jungvonmatt_contentful-ssg
[sonarcloud-image]: https://sonarcloud.io/api/project_badges/measure?project=jungvonmatt_contentful-ssg&metric=alert_status

