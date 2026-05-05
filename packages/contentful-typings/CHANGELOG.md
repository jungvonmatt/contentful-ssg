# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [5.0.0](https://github.com/jungvonmatt/contentful-ssg/compare/v4.1.2...v5.0.0) (2026-05-05)

* Migrate vitest (#84) ([3e38739](https://github.com/jungvonmatt/contentful-ssg/commit/3e38739cd8419fa6e514eccaad1464d3fdebd98b)), closes [#84](https://github.com/jungvonmatt/contentful-ssg/issues/84)
* Bump dependencies (#83) ([a195ac0](https://github.com/jungvonmatt/contentful-ssg/commit/a195ac095e6376fe10b8c25ae009b314752dc455)), closes [#83](https://github.com/jungvonmatt/contentful-ssg/issues/83)

### BREAKING CHANGES

* drop Node 20 support, require Node >=22

* chore!: replace eslint+prettier with oxlint+oxfmt

- Add oxlint, oxlint-tsgolint, oxfmt as devDependencies
- Create .oxlintrc.json with type-aware linting enabled (>50 TS rules)
- Create .oxfmtrc.json (drop-in prettier replacement: singleQuote, printWidth=100)
- Replace prettier programmatic API in cssg cli.ts init command with oxfmt
- Update lint scripts in all packages to oxlint --type-aware --fix
- Add format / format:check root scripts using oxfmt
- Switch lint-staged from prettier to oxfmt + oxlint --fix
- Remove eslint, prettier, all xo configs, typescript-eslint, all eslint-plugin-*
- Delete .eslintrc.cjs files, .eslintignore, .prettierrc
- Apply oxfmt across the codebase (formatting changes only, no logic)

Type-aware linting now flags real issues (no-floating-promises,
no-misused-promises, await-thenable, switch-exhaustiveness-check,
unbound-method) as warnings; addressing them is left for follow-up.
* lint and format scripts changed; contributors must
re-run pnpm install. The .prettierrc is replaced by .oxfmtrc.json.

* style: apply oxfmt to remaining files

* fix: address oxlint type-aware warnings

- contentful-config: remove unused AwaitedCollectionItem type alias
- contentful-ssg/lib/config: prefix unused configFile with underscore
- contentful-ssg/lib/contentful: assign client/managementClient to
  module-scoped vars (no-unassigned-vars); replace reduce-with-spread
  in getFieldSettings with for-of (no-accumulating-spread)
- contentful-ssg/lib/array: replace for-await-of over sync iterable
  with Promise.all (await-thenable)
- contentful-ssg/lib/ui: drop redundant Boolean() wrapper
* drop Node 20 support, require Node >=22

* chore!: replace eslint+prettier with oxlint+oxfmt

- Add oxlint, oxlint-tsgolint, oxfmt as devDependencies
- Create .oxlintrc.json with type-aware linting enabled (>50 TS rules)
- Create .oxfmtrc.json (drop-in prettier replacement: singleQuote, printWidth=100)
- Replace prettier programmatic API in cssg cli.ts init command with oxfmt
- Update lint scripts in all packages to oxlint --type-aware --fix
- Add format / format:check root scripts using oxfmt
- Switch lint-staged from prettier to oxfmt + oxlint --fix
- Remove eslint, prettier, all xo configs, typescript-eslint, all eslint-plugin-*
- Delete .eslintrc.cjs files, .eslintignore, .prettierrc
- Apply oxfmt across the codebase (formatting changes only, no logic)

Type-aware linting now flags real issues (no-floating-promises,
no-misused-promises, await-thenable, switch-exhaustiveness-check,
unbound-method) as warnings; addressing them is left for follow-up.
* lint and format scripts changed; contributors must
re-run pnpm install. The .prettierrc is replaced by .oxfmtrc.json.

* style: apply oxfmt to remaining files

* fix: address oxlint type-aware warnings

- contentful-config: remove unused AwaitedCollectionItem type alias
- contentful-ssg/lib/config: prefix unused configFile with underscore
- contentful-ssg/lib/contentful: assign client/managementClient to
  module-scoped vars (no-unassigned-vars); replace reduce-with-spread
  in getFieldSettings with for-of (no-accumulating-spread)
- contentful-ssg/lib/array: replace for-await-of over sync iterable
  with Promise.all (await-thenable)
- contentful-ssg/lib/ui: drop redundant Boolean() wrapper

## [4.1.2](https://github.com/jungvonmatt/contentful-ssg/compare/v4.1.1...v4.1.2) (2026-02-12)

### Bug Fixes

- use workspace versions for internal deps ([38e767b](https://github.com/jungvonmatt/contentful-ssg/commit/38e767b171c9d082a31c2455c6ca3798d2f88d45))

## [4.1.1](https://github.com/jungvonmatt/contentful-ssg/compare/v4.1.0...v4.1.1) (2026-02-11)

**Note:** Version bump only for package @jungvonmatt/contentful-typings

# [4.1.0](https://github.com/jungvonmatt/contentful-ssg/compare/v4.0.3...v4.1.0) (2026-02-11)

**Note:** Version bump only for package @jungvonmatt/contentful-typings

## [4.0.3](https://github.com/jungvonmatt/contentful-ssg/compare/v4.0.2...v4.0.3) (2026-01-12)

**Note:** Version bump only for package @jungvonmatt/contentful-typings

## [4.0.2](https://github.com/jungvonmatt/contentful-ssg/compare/v4.0.1...v4.0.2) (2025-09-04)

### Bug Fixes

- **config:** removes dotenv call from libs interfering with config loader ([f1cb5e7](https://github.com/jungvonmatt/contentful-ssg/commit/f1cb5e7448b1f62304568ec452d3a4e817ac1b58))

## [4.0.1](https://github.com/jungvonmatt/contentful-ssg/compare/v4.0.0...v4.0.1) (2025-09-03)

### Bug Fixes

- **typings:** log space/environment info when generating types ([66360f5](https://github.com/jungvonmatt/contentful-ssg/commit/66360f5fcd88740548cb62779c6e72fdbd5b4ca6))

# [4.0.0](https://github.com/jungvonmatt/contentful-ssg/compare/v3.0.6...v4.0.0) (2025-08-18)

**Note:** Version bump only for package @jungvonmatt/contentful-typings

## [3.0.6](https://github.com/jungvonmatt/contentful-ssg/compare/v3.0.5...v3.0.6) (2025-06-29)

**Note:** Version bump only for package @jungvonmatt/contentful-typings

## [3.0.5](https://github.com/jungvonmatt/contentful-ssg/compare/v3.0.4...v3.0.5) (2025-06-27)

**Note:** Version bump only for package @jungvonmatt/contentful-typings

## [3.0.4](https://github.com/jungvonmatt/contentful-ssg/compare/v3.0.3...v3.0.4) (2025-06-23)

**Note:** Version bump only for package @jungvonmatt/contentful-typings

## [3.0.3](https://github.com/jungvonmatt/contentful-ssg/compare/v3.0.2...v3.0.3) (2025-06-17)

**Note:** Version bump only for package @jungvonmatt/contentful-typings

## [3.0.2](https://github.com/jungvonmatt/contentful-ssg/compare/v3.0.1...v3.0.2) (2025-06-15)

**Note:** Version bump only for package @jungvonmatt/contentful-typings

## [3.0.1](https://github.com/jungvonmatt/contentful-ssg/compare/v3.0.0...v3.0.1) (2025-06-11)

**Note:** Version bump only for package @jungvonmatt/contentful-typings

# [3.0.0](https://github.com/jungvonmatt/contentful-ssg/compare/v2.0.1...v3.0.0) (2025-06-10)

### Features

- **config:** allow loading config from external config file ([#77](https://github.com/jungvonmatt/contentful-ssg/issues/77)) ([0935142](https://github.com/jungvonmatt/contentful-ssg/commit/0935142332efe611244f359c0f44498c1cb8570b))

## [2.0.1](https://github.com/jungvonmatt/contentful-ssg/compare/v2.0.0...v2.0.1) (2025-04-24)

**Note:** Version bump only for package @jungvonmatt/contentful-typings

# [2.0.0](https://github.com/jungvonmatt/contentful-ssg/compare/v1.14.3...v2.0.0) (2025-01-24)

**Note:** Version bump only for package @jungvonmatt/contentful-typings

## [1.14.2](https://github.com/jungvonmatt/contentful-ssg/compare/v1.14.1...v1.14.2) (2024-06-01)

**Note:** Version bump only for package @jungvonmatt/contentful-typings

## [1.14.1](https://github.com/jungvonmatt/contentful-ssg/compare/v1.14.0...v1.14.1) (2024-04-08)

### Bug Fixes

- **contentful-typings:** adds missing exit-hook dependency ([c9b911f](https://github.com/jungvonmatt/contentful-ssg/commit/c9b911fda3cc0407106d2534785a3b087d3d8b1f))

# [1.14.0](https://github.com/jungvonmatt/contentful-ssg/compare/v1.13.0...v1.14.0) (2024-02-03)

**Note:** Version bump only for package @jungvonmatt/contentful-typings

# [1.13.0](https://github.com/jungvonmatt/contentful-ssg/compare/v1.12.6...v1.13.0) (2023-05-12)

### Features

- **contentful-typings:** adapt new contentful skeleton types ([#61](https://github.com/jungvonmatt/contentful-ssg/issues/61)) ([3ea21a6](https://github.com/jungvonmatt/contentful-ssg/commit/3ea21a6c2bff7aeb9c9f01365afcc4d3653d573b))

## [1.13.1](https://github.com/jungvonmatt/contentful-ssg/compare/v1.13.0...v1.13.1) (2023-05-12)

**Note:** Version bump only for package @jungvonmatt/contentful-typings

# [1.13.0](https://github.com/jungvonmatt/contentful-ssg/compare/v1.12.6...v1.13.0) (2023-05-12)

### Features

- **contentful-typings:** adapt new contentful skeleton types ([#61](https://github.com/jungvonmatt/contentful-ssg/issues/61)) ([3ea21a6](https://github.com/jungvonmatt/contentful-ssg/commit/3ea21a6c2bff7aeb9c9f01365afcc4d3653d573b))

## [1.12.6](https://github.com/jungvonmatt/contentful-ssg/compare/v1.12.5...v1.12.6) (2023-03-13)

**Note:** Version bump only for package @jungvonmatt/contentful-typings

## [1.12.5](https://github.com/jungvonmatt/contentful-ssg/compare/v1.12.4...v1.12.5) (2023-03-09)

### Bug Fixes

- **contentful-typings:** fix renderers ([#58](https://github.com/jungvonmatt/contentful-ssg/issues/58)) ([47b18a7](https://github.com/jungvonmatt/contentful-ssg/commit/47b18a7080d7b32529d9d12d9da8f7b8a8bcf2b6))

## [1.12.4](https://github.com/jungvonmatt/contentful-ssg/compare/v1.12.3...v1.12.4) (2023-03-08)

**Note:** Version bump only for package @jungvonmatt/contentful-typings

## [1.12.3](https://github.com/jungvonmatt/contentful-ssg/compare/v1.12.2...v1.12.3) (2023-03-06)

**Note:** Version bump only for package @jungvonmatt/contentful-typings

## [1.12.2](https://github.com/jungvonmatt/contentful-ssg/compare/v1.12.1...v1.12.2) (2023-03-06)

### Bug Fixes

- **contentful-typings:** adds shebang to cli & min node version ([4423318](https://github.com/jungvonmatt/contentful-ssg/commit/4423318cdf162984e0dc8238327193c2cb7ec2b5))

## [1.12.1](https://github.com/jungvonmatt/contentful-ssg/compare/v1.12.0...v1.12.1) (2023-03-06)

### Bug Fixes

- **contentful-typings:** changes bin name in package.json ([b357df4](https://github.com/jungvonmatt/contentful-ssg/commit/b357df430249b88f7a166082632f7a21e58955e2))

# [1.12.0](https://github.com/jungvonmatt/contentful-ssg/compare/v1.11.3...v1.12.0) (2023-03-06)

### Features

- **contentful-typings:** generate typescript definitions from contentful ([#56](https://github.com/jungvonmatt/contentful-ssg/issues/56)) ([12e5263](https://github.com/jungvonmatt/contentful-ssg/commit/12e5263f9e2101597bef5a99a2c9977ad590c62b))
