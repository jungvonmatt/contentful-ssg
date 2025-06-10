# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [3.0.0](https://github.com/jungvonmatt/contentful-ssg/compare/v2.0.1...v3.0.0) (2025-06-10)

### Features

- **config:** allow loading config from external config file ([#77](https://github.com/jungvonmatt/contentful-ssg/issues/77)) ([0935142](https://github.com/jungvonmatt/contentful-ssg/commit/0935142332efe611244f359c0f44498c1cb8570b))

## [2.0.1](https://github.com/jungvonmatt/contentful-ssg/compare/v2.0.0...v2.0.1) (2025-04-24)

### Bug Fixes

- **dependencies:** update dependencies to fix vulnerabilities ([#76](https://github.com/jungvonmatt/contentful-ssg/issues/76)) ([e72e409](https://github.com/jungvonmatt/contentful-ssg/commit/e72e409f0d3df1487a8f136cfdd8209270706ef5))

# [2.0.0](https://github.com/jungvonmatt/contentful-ssg/compare/v1.14.3...v2.0.0) (2025-01-24)

### Bug Fixes

- **cli:** removed tunnel due to sec issues with localtunnel ([f93fb0d](https://github.com/jungvonmatt/contentful-ssg/commit/f93fb0d3e529d5f2f3f72a4090e69338219eaa2e))

### BREAKING CHANGES

- **cli:** watch mode only works with poll mode

## [1.14.3](https://github.com/jungvonmatt/contentful-ssg/compare/v1.14.2...v1.14.3) (2024-06-24)

### Bug Fixes

- remove deprecated custom lang param ([#75](https://github.com/jungvonmatt/contentful-ssg/issues/75)) ([a2bd437](https://github.com/jungvonmatt/contentful-ssg/commit/a2bd4373c0035b25bb81bf8bb212ce9f570030c0)), closes [#62](https://github.com/jungvonmatt/contentful-ssg/issues/62)

## [1.14.2](https://github.com/jungvonmatt/contentful-ssg/compare/v1.14.1...v1.14.2) (2024-06-01)

### Bug Fixes

- **chore:** install missing tar dependency ([8aba017](https://github.com/jungvonmatt/contentful-ssg/commit/8aba017c376fb1d93709644cd3b16c3177a45a0d))
- **chore:** revert: use lerna@8.1.2 while waiting for a fix ([997598a](https://github.com/jungvonmatt/contentful-ssg/commit/997598ace3f1d6131c4d06d13051017e5b2fcf45)), closes [lerna/lerna#4005](https://github.com/lerna/lerna/issues/4005)
- **sec:** patch localtunnel ([#74](https://github.com/jungvonmatt/contentful-ssg/issues/74)) ([640e7e5](https://github.com/jungvonmatt/contentful-ssg/commit/640e7e578f3772bfe81f1500accfc1685b449a30))

## [1.14.1](https://github.com/jungvonmatt/contentful-ssg/compare/v1.14.0...v1.14.1) (2024-04-08)

### Bug Fixes

- **contentful-typings:** adds missing exit-hook dependency ([c9b911f](https://github.com/jungvonmatt/contentful-ssg/commit/c9b911fda3cc0407106d2534785a3b087d3d8b1f))

# [1.14.0](https://github.com/jungvonmatt/contentful-ssg/compare/v1.13.0...v1.14.0) (2024-02-03)

**Note:** Version bump only for package @jungvonmatt/contentful-ssg-project

# [1.13.0](https://github.com/jungvonmatt/contentful-ssg/compare/v1.12.6...v1.13.0) (2023-05-12)

### Features

- **contentful-typings:** adapt new contentful skeleton types ([#61](https://github.com/jungvonmatt/contentful-ssg/issues/61)) ([3ea21a6](https://github.com/jungvonmatt/contentful-ssg/commit/3ea21a6c2bff7aeb9c9f01365afcc4d3653d573b))

## [1.13.1](https://github.com/jungvonmatt/contentful-ssg/compare/v1.13.0...v1.13.1) (2023-05-12)

**Note:** Version bump only for package @jungvonmatt/contentful-ssg-project

# [1.13.0](https://github.com/jungvonmatt/contentful-ssg/compare/v1.12.6...v1.13.0) (2023-05-12)

### Features

- **contentful-typings:** adapt new contentful skeleton types ([#61](https://github.com/jungvonmatt/contentful-ssg/issues/61)) ([3ea21a6](https://github.com/jungvonmatt/contentful-ssg/commit/3ea21a6c2bff7aeb9c9f01365afcc4d3653d573b))

## [1.12.6](https://github.com/jungvonmatt/contentful-ssg/compare/v1.12.5...v1.12.6) (2023-03-13)

**Note:** Version bump only for package @jungvonmatt/contentful-ssg-project

## [1.12.5](https://github.com/jungvonmatt/contentful-ssg/compare/v1.12.4...v1.12.5) (2023-03-09)

### Bug Fixes

- **contentful-typings:** fix renderers ([#58](https://github.com/jungvonmatt/contentful-ssg/issues/58)) ([47b18a7](https://github.com/jungvonmatt/contentful-ssg/commit/47b18a7080d7b32529d9d12d9da8f7b8a8bcf2b6))

## [1.12.4](https://github.com/jungvonmatt/contentful-ssg/compare/v1.12.3...v1.12.4) (2023-03-08)

**Note:** Version bump only for package @jungvonmatt/contentful-ssg-project

## [1.12.3](https://github.com/jungvonmatt/contentful-ssg/compare/v1.12.2...v1.12.3) (2023-03-06)

### Bug Fixes

- **contentful-ssg:** adds missing pirates dependency ([d8778fa](https://github.com/jungvonmatt/contentful-ssg/commit/d8778faa02f3ca2f29d449b624bb78f81025f839))

## [1.12.2](https://github.com/jungvonmatt/contentful-ssg/compare/v1.12.1...v1.12.2) (2023-03-06)

### Bug Fixes

- **contentful-typings:** adds shebang to cli & min node version ([4423318](https://github.com/jungvonmatt/contentful-ssg/commit/4423318cdf162984e0dc8238327193c2cb7ec2b5))

## [1.12.1](https://github.com/jungvonmatt/contentful-ssg/compare/v1.12.0...v1.12.1) (2023-03-06)

### Bug Fixes

- **contentful-typings:** changes bin name in package.json ([b357df4](https://github.com/jungvonmatt/contentful-ssg/commit/b357df430249b88f7a166082632f7a21e58955e2))

# [1.12.0](https://github.com/jungvonmatt/contentful-ssg/compare/v1.11.3...v1.12.0) (2023-03-06)

### Features

- **contentful-typings:** generate typescript definitions from contentful ([#56](https://github.com/jungvonmatt/contentful-ssg/issues/56)) ([12e5263](https://github.com/jungvonmatt/contentful-ssg/commit/12e5263f9e2101597bef5a99a2c9977ad590c62b))

## [1.11.3](https://github.com/jungvonmatt/contentful-ssg/compare/v1.11.2...v1.11.3) (2023-02-16)

### Bug Fixes

- **deps:** moves @swc/core to dependencies ([2158577](https://github.com/jungvonmatt/contentful-ssg/commit/2158577ba35024e4443d4366c9b7341adcbaef13))

## [1.11.2](https://github.com/jungvonmatt/contentful-ssg/compare/v1.11.1...v1.11.2) (2023-02-16)

### Bug Fixes

- **core:** adds custom config importer ([ffd6e4e](https://github.com/jungvonmatt/contentful-ssg/commit/ffd6e4e1e068811ff8a2a1b3662e447d118b4c42))

## [1.11.1](https://github.com/jungvonmatt/contentful-ssg/compare/v1.11.0...v1.11.1) (2023-02-14)

### Bug Fixes

- **core:** fix ERR_PACKAGE_PATH_NOT_EXPORTED from [@swc-node](https://github.com/swc-node) ([0c1b224](https://github.com/jungvonmatt/contentful-ssg/commit/0c1b2240331b28d4ced315354ac66d7c1b790546))

# [1.11.0](https://github.com/jungvonmatt/contentful-ssg/compare/v1.10.0...v1.11.0) (2022-09-19)

### Features

- **cli:** adds sync flag to fetch command ([#53](https://github.com/jungvonmatt/contentful-ssg/issues/53)) ([8a1f353](https://github.com/jungvonmatt/contentful-ssg/commit/8a1f35368c3942ac5302be303d900af15e0c9fe4))
- **contentful:** allow custom queries when fetching entries from contentful ([#54](https://github.com/jungvonmatt/contentful-ssg/issues/54)) ([17089c2](https://github.com/jungvonmatt/contentful-ssg/commit/17089c2ab8af425429abcc00d5d58b7e1c06b019))

# [1.10.0](https://github.com/jungvonmatt/contentful-ssg/compare/v1.9.0...v1.10.0) (2022-09-15)

### Features

- **asset-config:** allow reference field configs & configs by naming convention ([#51](https://github.com/jungvonmatt/contentful-ssg/issues/51)) ([9fc0275](https://github.com/jungvonmatt/contentful-ssg/commit/9fc0275757d3dd87322d79882a443d1fbbbd0852))
- **cli:** adds poll alternative to watch mode ([#50](https://github.com/jungvonmatt/contentful-ssg/issues/50)) ([626b70f](https://github.com/jungvonmatt/contentful-ssg/commit/626b70fca6a2b9debfffb90030a752f7d515131b))

# [1.9.0](https://github.com/jungvonmatt/contentful-ssg/compare/v1.8.2...v1.9.0) (2022-06-30)

### Features

- **watch:** serialize watch state on subsequent runs ([#49](https://github.com/jungvonmatt/contentful-ssg/issues/49)) ([48ec401](https://github.com/jungvonmatt/contentful-ssg/commit/48ec4010733a3d46ce34a3703198d635b8f432d0))

## [1.8.2](https://github.com/jungvonmatt/contentful-ssg/compare/v1.8.1...v1.8.2) (2022-06-23)

### Bug Fixes

- adds compile dependency to lint ([75a8eea](https://github.com/jungvonmatt/contentful-ssg/commit/75a8eea6f8cb4f72dfa20bd0e88ecac9f3b44f6e))

## [1.8.1](https://github.com/jungvonmatt/contentful-ssg/compare/v1.8.0...v1.8.1) (2022-06-23)

### Bug Fixes

- adds files config to package.json ([ddfea54](https://github.com/jungvonmatt/contentful-ssg/commit/ddfea540bd8133b8238626cc46e209fdc19a7a97))
- **dependencies:** bump faker-js ([9cade0b](https://github.com/jungvonmatt/contentful-ssg/commit/9cade0b3ff7d047e66402abe7f1f6193896235bd))
- **dependencies:** bump turbo ([0d3f012](https://github.com/jungvonmatt/contentful-ssg/commit/0d3f01243573d86f5ac0d16be4bcea9d7362e20d))
- **dependencies:** removes unused dependency ([8aed859](https://github.com/jungvonmatt/contentful-ssg/commit/8aed859ad1aedbb0a26642c93a5f9314f457edc7))

# [1.8.0](https://github.com/jungvonmatt/contentful-ssg/compare/v1.7.4...v1.8.0) (2022-06-21)

### Bug Fixes

- bump package-lock ([4835bf6](https://github.com/jungvonmatt/contentful-ssg/commit/4835bf67deee0c48b35808193dc559d5e45161bf))
- **cssg-plugin-assets:** fix linter issues ([f8c641c](https://github.com/jungvonmatt/contentful-ssg/commit/f8c641cf77561ca4fe40472935773053ff1bd8fc))

# [1.8.0-alpha.6](https://github.com/jungvonmatt/contentful-ssg/compare/v1.8.0-alpha.5...v1.8.0-alpha.6) (2022-06-07)

**Note:** Version bump only for package @jungvonmatt/contentful-ssg-project

# [1.8.0-alpha.5](https://github.com/jungvonmatt/contentful-ssg/compare/v1.8.0-alpha.4...v1.8.0-alpha.5) (2022-06-02)

### Bug Fixes

- **watcher:** use url from environment variable ([425ed41](https://github.com/jungvonmatt/contentful-ssg/commit/425ed41ae6cbe3ba135a25266918998199d470cd))

# [1.8.0-alpha.4](https://github.com/jungvonmatt/contentful-ssg/compare/v1.8.0-alpha.2...v1.8.0-alpha.4) (2022-06-02)

### Bug Fixes

- **contentful:** prefer sha1 over md5 ([825c007](https://github.com/jungvonmatt/contentful-ssg/commit/825c007131abe78b9003abb6985ca4fe480441b3))
- **sonar:** fix coverage stats ([a1f2538](https://github.com/jungvonmatt/contentful-ssg/commit/a1f2538b892029f36ab4af57e9ca311b12320b58))
- **watcher:** allow url & port to be set via environment variable ([4afa533](https://github.com/jungvonmatt/contentful-ssg/commit/4afa53344a6a8093700f8b9119a069011ea72a72))

# [1.8.0-alpha.3](https://github.com/jungvonmatt/contentful-ssg/compare/v1.8.0-alpha.2...v1.8.0-alpha.3) (2022-06-02)

### Bug Fixes

- **contentful:** prefer sha1 over md5 ([825c007](https://github.com/jungvonmatt/contentful-ssg/commit/825c007131abe78b9003abb6985ca4fe480441b3))
- **sonar:** fix coverage stats ([a1f2538](https://github.com/jungvonmatt/contentful-ssg/commit/a1f2538b892029f36ab4af57e9ca311b12320b58))
- **watcher:** allow url & port to be set via environment variable ([4afa533](https://github.com/jungvonmatt/contentful-ssg/commit/4afa53344a6a8093700f8b9119a069011ea72a72))

# [1.8.0-alpha.2](https://github.com/jungvonmatt/contentful-ssg/compare/v1.8.0-alpha.1...v1.8.0-alpha.2) (2022-05-25)

### Bug Fixes

- **sonar:** adds cobertura coverage reporter ([491d0fe](https://github.com/jungvonmatt/contentful-ssg/commit/491d0fe20d659be96367c6db9a444f8fcb943390))
- **test:** adds missing coverage reporters ([9560eca](https://github.com/jungvonmatt/contentful-ssg/commit/9560eca36bfd0dab9d11e9d4d144fa16513501f4))
- **test:** without crypto ([1faef20](https://github.com/jungvonmatt/contentful-ssg/commit/1faef206b810212b7b3ec02633f5ae9a759b71fb))
- **watcher:** adds option to overwrite watch port ([cc9f890](https://github.com/jungvonmatt/contentful-ssg/commit/cc9f890601b96fb8795cf5e8cdbdd99290ba2351))
- **watch:** use crypto for webhook id ([36f4506](https://github.com/jungvonmatt/contentful-ssg/commit/36f45068b2aee82a8af0c88c1b7fc1e0d6133cb3))

# [1.8.0-alpha.1](https://github.com/jungvonmatt/contentful-ssg/compare/v1.8.0-alpha.0...v1.8.0-alpha.1) (2022-05-24)

### Bug Fixes

- tweak turbo.json ([eefc0b0](https://github.com/jungvonmatt/contentful-ssg/commit/eefc0b0d96a5a8034ed53a9d531aeaba23ca25f4))

# [1.8.0-alpha.0](https://github.com/jungvonmatt/contentful-ssg/compare/v1.7.4...v1.8.0-alpha.0) (2022-05-24)

### Bug Fixes

- bumps fs-extra ([42cb100](https://github.com/jungvonmatt/contentful-ssg/commit/42cb100df8d47ca11bfa0834cf7610d9cdbe2931))
- **cssg-plugin-assets:** adds contentful-ssg devdependency ([0cb688f](https://github.com/jungvonmatt/contentful-ssg/commit/0cb688f29a26308016b6a24a4408bb66d4ac6ef4))
- **watcher:** fix port when url is passed ([9316e62](https://github.com/jungvonmatt/contentful-ssg/commit/9316e6256354fae88074e305f5d16f86d4c2b0c2))

## [1.7.4](https://github.com/jungvonmatt/contentful-ssg/compare/v1.7.3...v1.7.4) (2022-05-18)

### Bug Fixes

- **hugo-menu:** handle pagerefs for link content types ([#45](https://github.com/jungvonmatt/contentful-ssg/issues/45)) ([9023115](https://github.com/jungvonmatt/contentful-ssg/commit/902311525fb3cb1dcba9f32efa2f26744feff50a))
- **types:** export ignore type directly from package ([7fbea44](https://github.com/jungvonmatt/contentful-ssg/commit/7fbea4469a110839a14315add6cd546402a45ed3))

## [1.7.3](https://github.com/jungvonmatt/contentful-ssg/compare/v1.7.2...v1.7.3) (2022-05-02)

### Bug Fixes

- **observable:** uses ReplaySubject for transforms ([89c6318](https://github.com/jungvonmatt/contentful-ssg/commit/89c6318cebbf74f4db3f126403a7ef07e8e76fbe))

## [1.7.2](https://github.com/jungvonmatt/contentful-ssg/compare/v1.7.1...v1.7.2) (2022-04-28)

**Note:** Version bump only for package @jungvonmatt/contentful-ssg-project

## [1.7.1](https://github.com/jungvonmatt/contentful-ssg/compare/v1.7.0...v1.7.1) (2022-04-27)

### Bug Fixes

- **tests:** adds sonar reporter ([10cd59d](https://github.com/jungvonmatt/contentful-ssg/commit/10cd59d0ae6747df4010007d40e35a0d43f3bfff))

# [1.7.0](https://github.com/jungvonmatt/contentful-ssg/compare/v1.6.1...v1.7.0) (2022-04-26)

### Features

- **utils:** adds waitFor util ([#39](https://github.com/jungvonmatt/contentful-ssg/issues/39)) ([0840ecd](https://github.com/jungvonmatt/contentful-ssg/commit/0840ecde90a3e08cebde144dafabb720c2e2124f))

## [1.6.1](https://github.com/jungvonmatt/contentful-ssg/compare/v1.6.0...v1.6.1) (2022-04-05)

**Note:** Version bump only for package @jungvonmatt/contentful-ssg-project

# [1.6.0](https://github.com/jungvonmatt/contentful-ssg/compare/v1.5.2...v1.6.0) (2022-03-28)

### Features

- **asset-sizes:** allow function passed in sizes array ([cbf3b28](https://github.com/jungvonmatt/contentful-ssg/commit/cbf3b2863f51925ff16b0fa869bf444b3bc1959a))

## [1.5.2](https://github.com/jungvonmatt/contentful-ssg/compare/v1.5.1...v1.5.2) (2022-03-23)

### Bug Fixes

- **menu:** use submenu as default value for fieldIdMenu ([e7a8b55](https://github.com/jungvonmatt/contentful-ssg/commit/e7a8b55a61cb3d5284561b318d0bf5b2a92a835e))

## [1.5.1](https://github.com/jungvonmatt/contentful-ssg/compare/v1.5.0...v1.5.1) (2022-02-23)

### Bug Fixes

- **hugo-menu:** apply pageRef to child entries, too ([69c74a8](https://github.com/jungvonmatt/contentful-ssg/commit/69c74a8eef8fe6a98d1f17710818c2a87093873c))

# [1.5.0](https://github.com/jungvonmatt/contentful-ssg/compare/v1.4.12...v1.5.0) (2022-02-23)

### Features

- **hugo-menu:** adds pageRef to menu entries ([6fe89a9](https://github.com/jungvonmatt/contentful-ssg/commit/6fe89a9c1d36a617e1ddb3cd5f1d27b96f4fab5f))

## [1.4.12](https://github.com/jungvonmatt/contentful-ssg/compare/v1.4.11...v1.4.12) (2022-02-23)

### Bug Fixes

- fix syntax error ([53ac989](https://github.com/jungvonmatt/contentful-ssg/commit/53ac989b9ba92b5c8ccd8759c77b17cf6dcebd22))

## [1.4.11](https://github.com/jungvonmatt/contentful-ssg/compare/v1.4.10...v1.4.11) (2022-02-23)

### Bug Fixes

- **hugo-menu:** makes menu roots configurable ([ac10c2f](https://github.com/jungvonmatt/contentful-ssg/commit/ac10c2f73646016d3ac69fd96f8a2ebca2247043))

## [1.4.10](https://github.com/jungvonmatt/contentful-ssg/compare/v1.4.9...v1.4.10) (2022-02-22)

### Bug Fixes

- **hugo-locales:** Lowercase ISO locale codes to work with hugo ([088cb0b](https://github.com/jungvonmatt/contentful-ssg/commit/088cb0b871e3d93fb75641a5c031e61011838cda))

## [1.4.9](https://github.com/jungvonmatt/contentful-ssg/compare/v1.4.8...v1.4.9) (2022-02-11)

### Bug Fixes

- exit with error code on errors ([#37](https://github.com/jungvonmatt/contentful-ssg/issues/37)) ([0b1f056](https://github.com/jungvonmatt/contentful-ssg/commit/0b1f0568197019fb0c494a32b43dbfa93150f1f7))

## [1.4.8](https://github.com/jungvonmatt/contentful-ssg/compare/v1.4.7...v1.4.8) (2022-02-09)

### Bug Fixes

- ensure preview mode can be activated in config ([#35](https://github.com/jungvonmatt/contentful-ssg/issues/35)) ([ea9fca5](https://github.com/jungvonmatt/contentful-ssg/commit/ea9fca5e18745ac2740d0c1bea1e0370a1ec17de))

## [1.4.7](https://github.com/jungvonmatt/contentful-ssg/compare/v1.4.6...v1.4.7) (2022-02-07)

### Bug Fixes

- 🐛 Consider contentful megapixel limitations on avif ([3ad6291](https://github.com/jungvonmatt/contentful-ssg/commit/3ad6291f666a9d004106be5b664bdc0c71243e30))

## [1.4.6](https://github.com/jungvonmatt/contentful-ssg/compare/v1.4.5...v1.4.6) (2022-02-01)

### Bug Fixes

- 🐛 Fixes rounding error when computing widths ([3cc1288](https://github.com/jungvonmatt/contentful-ssg/commit/3cc12884f7a75f9aa8bc321dbbb1b8d407709f0d))

## [1.4.5](https://github.com/jungvonmatt/contentful-ssg/compare/v1.4.4...v1.4.5) (2022-01-31)

**Note:** Version bump only for package @jungvonmatt/contentful-ssg-project

## [1.4.4](https://github.com/jungvonmatt/contentful-ssg/compare/v1.4.3...v1.4.4) (2022-01-24)

### Bug Fixes

- 🐛 Fix menu sort ([589f341](https://github.com/jungvonmatt/contentful-ssg/commit/589f341ecedbad7fcaaae43b360fa06a73a404c6))

## [1.4.3](https://github.com/jungvonmatt/contentful-ssg/compare/v1.4.2...v1.4.3) (2022-01-24)

### Bug Fixes

- 🐛 Don't deep merge settings ([298c15e](https://github.com/jungvonmatt/contentful-ssg/commit/298c15ed3c80dc222b42909db610c41e977a9110))

## [1.4.2](https://github.com/jungvonmatt/contentful-ssg/compare/v1.4.1...v1.4.2) (2022-01-20)

### Bug Fixes

- 🐛 Don't ask for delivery & preview token ([10a9a74](https://github.com/jungvonmatt/contentful-ssg/commit/10a9a74f24fecca9d8866d39e2ca9095e9a4d638))
- 🐛 lint ([22c8b38](https://github.com/jungvonmatt/contentful-ssg/commit/22c8b38fbe1f62e20a597545808181fc488d04c6))

## [1.4.1](https://github.com/jungvonmatt/contentful-ssg/compare/v1.4.0...v1.4.1) (2022-01-20)

**Note:** Version bump only for package @jungvonmatt/contentful-ssg-project

# [1.4.0](https://github.com/jungvonmatt/contentful-ssg/compare/v1.3.2...v1.4.0) (2022-01-19)

### Features

- 🎸 Adds new contentful-fakes package ([bb67694](https://github.com/jungvonmatt/contentful-ssg/commit/bb676946532281864c6355f294e984f792f9cfa3))

## [1.3.2](https://github.com/jungvonmatt/contentful-ssg/compare/v1.3.1...v1.3.2) (2022-01-14)

**Note:** Version bump only for package @jungvonmatt/contentful-ssg-project

## [1.3.1](https://github.com/jungvonmatt/contentful-ssg/compare/v1.3.0...v1.3.1) (2022-01-13)

### Bug Fixes

- 🐛 Change order of webp & avif ([e725a33](https://github.com/jungvonmatt/contentful-ssg/commit/e725a33ce516e4dd0e243c71323561ae20d87f81))

# [1.3.0](https://github.com/jungvonmatt/contentful-ssg/compare/v1.2.0...v1.3.0) (2022-01-10)

### Features

- 🎸 Consider menu reference in page node when building menu ([42499a4](https://github.com/jungvonmatt/contentful-ssg/commit/42499a4efb2f25275d8ea4fb74f72461aa441ba0))

# [1.2.0](https://github.com/jungvonmatt/contentful-ssg/compare/v1.1.1...v1.2.0) (2021-12-21)

### Features

- 🎸 Generates hugo's menu.toml ([27e95a3](https://github.com/jungvonmatt/contentful-ssg/commit/27e95a33452b1aa5158ee89070889383cee4b6c5))

## [1.1.1](https://github.com/jungvonmatt/contentful-ssg/compare/v1.1.0...v1.1.1) (2021-12-16)

### Bug Fixes

- 🐛 Generate correct ratio urls for assets ([eca9064](https://github.com/jungvonmatt/contentful-ssg/commit/eca9064b3060336811acae696c477f824a6bef2f))

# [1.1.0](https://github.com/jungvonmatt/contentful-ssg/compare/v1.0.6...v1.1.0) (2021-12-02)

### Bug Fixes

- 🐛 Adds <rootDir>/data to managed directories ([d67de2b](https://github.com/jungvonmatt/contentful-ssg/commit/d67de2b4a78771076e5fd1d4e7beec0c1fb65a7d))
- 🐛 Removes prepare-commit-msg hopok ([f94d691](https://github.com/jungvonmatt/contentful-ssg/commit/f94d691d1d6e158d9cef913f73df9051f4e3bd42))

### Features

- 🎸 Adds config hook for plugins ([fcdce82](https://github.com/jungvonmatt/contentful-ssg/commit/fcdce82af6b02d6e479efd6f677edabfa7f6d282))

## [1.0.6](https://github.com/jungvonmatt/contentful-ssg/compare/v1.0.5...v1.0.6) (2021-12-02)

### Bug Fixes

- 🐛 Manage files inside 'data' directory (hugo) ([0282afa](https://github.com/jungvonmatt/contentful-ssg/commit/0282afad065d8f47d17cf5d450aea73e2d6b2850))

## [1.0.5](https://github.com/jungvonmatt/contentful-ssg/compare/v1.0.4...v1.0.5) (2021-11-30)

**Note:** Version bump only for package @jungvonmatt/contentful-ssg-project

## [1.0.4](https://github.com/jungvonmatt/contentful-ssg/compare/v1.0.3...v1.0.4) (2021-11-29)

**Note:** Version bump only for package @jungvonmatt/contentful-ssg-project

## [1.0.3](https://github.com/jungvonmatt/contentful-ssg/compare/v1.0.2...v1.0.3) (2021-11-29)

**Note:** Version bump only for package @jungvonmatt/contentful-ssg-project

## [1.0.2](https://github.com/jungvonmatt/contentful-ssg/compare/v1.0.1...v1.0.2) (2021-11-29)

**Note:** Version bump only for package @jungvonmatt/contentful-ssg-project

## [1.0.1](https://github.com/jungvonmatt/contentful-ssg/compare/v1.0.0...v1.0.1) (2021-11-25)

**Note:** Version bump only for package @jungvonmatt/contentful-ssg-project

# [1.0.0](https://github.com/jungvonmatt/contentful-ssg/compare/v1.0.0-alpha.0...v1.0.0) (2021-11-25)

**Note:** Version bump only for package @jungvonmatt/contentful-ssg-project

# [1.0.0-alpha.0](https://github.com/jungvonmatt/contentful-ssg/compare/v0.17.3...v1.0.0-alpha.0) (2021-11-25)

**Note:** Version bump only for package @jungvonmatt/contentful-ssg-project
