# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [5.0.1](https://github.com/jungvonmatt/contentful-ssg/compare/v5.0.0...v5.0.1) (2026-05-05)

**Note:** Version bump only for package @jungvonmatt/contentful-config

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

- expose organization id in config-cli ([497d739](https://github.com/jungvonmatt/contentful-ssg/commit/497d7397347d38a996c3ff1e0dcc8cc77684878f))

## [4.1.1](https://github.com/jungvonmatt/contentful-ssg/compare/v4.1.0...v4.1.1) (2026-02-11)

### Bug Fixes

- rename env name for tokens ([0af9c42](https://github.com/jungvonmatt/contentful-ssg/commit/0af9c42da7902bfcd07c7ee50f3d5c4d11205f45))

# [4.1.0](https://github.com/jungvonmatt/contentful-ssg/compare/v4.0.3...v4.1.0) (2026-02-11)

### Features

- adds contentful-config cli ([85fbaf9](https://github.com/jungvonmatt/contentful-ssg/commit/85fbaf9a96f1f078bcd14f257adcf6876f7ce0d3))

## [4.0.3](https://github.com/jungvonmatt/contentful-ssg/compare/v4.0.2...v4.0.3) (2026-01-12)

### Bug Fixes

- removes invalid bin config in package.json ([edc10dc](https://github.com/jungvonmatt/contentful-ssg/commit/edc10dcf87956c4dc313b4f3f44237f58933eae6))

## [4.0.1](https://github.com/jungvonmatt/contentful-ssg/compare/v4.0.0...v4.0.1) (2025-09-03)

### Bug Fixes

- **config:** bump dependencies ([109bd94](https://github.com/jungvonmatt/contentful-ssg/commit/109bd94026cb8368408000495194274a2c813d56))

# [4.0.0](https://github.com/jungvonmatt/contentful-ssg/compare/v3.0.6...v4.0.0) (2025-08-18)

**Note:** Version bump only for package @jungvonmatt/contentful-config

## [3.0.6](https://github.com/jungvonmatt/contentful-ssg/compare/v3.0.5...v3.0.6) (2025-06-29)

### Bug Fixes

- **config:** disable skip on async select due to bug in enquirer ([45a2932](https://github.com/jungvonmatt/contentful-ssg/commit/45a29327a8091f948f7aeee3143d80f9645fe1e5))

## [3.0.5](https://github.com/jungvonmatt/contentful-ssg/compare/v3.0.4...v3.0.5) (2025-06-27)

### Bug Fixes

- **config:** bump @jungvonmatt/config-loader ([20639d2](https://github.com/jungvonmatt/contentful-ssg/commit/20639d216f278c849e4cdc69d26a5da5dbcdeae9))

## [3.0.3](https://github.com/jungvonmatt/contentful-ssg/compare/v3.0.2...v3.0.3) (2025-06-17)

**Note:** Version bump only for package @jungvonmatt/contentful-config

## [3.0.2](https://github.com/jungvonmatt/contentful-ssg/compare/v3.0.1...v3.0.2) (2025-06-15)

**Note:** Version bump only for package @jungvonmatt/contentful-config

## [3.0.1](https://github.com/jungvonmatt/contentful-ssg/compare/v3.0.0...v3.0.1) (2025-06-11)

### Bug Fixes

- **contentful-config:** handle prompts && default cwd to closest package.json dir if available ([b6247b6](https://github.com/jungvonmatt/contentful-ssg/commit/b6247b60c748e31466e872145a2e439765801d12))
- **lint:** run lint:fix ([a631d97](https://github.com/jungvonmatt/contentful-ssg/commit/a631d97d99f630b729424fd2dde55a00b2a6b752))

# [3.0.0](https://github.com/jungvonmatt/contentful-ssg/compare/v2.0.1...v3.0.0) (2025-06-10)

### Features

- **config:** allow loading config from external config file ([#77](https://github.com/jungvonmatt/contentful-ssg/issues/77)) ([0935142](https://github.com/jungvonmatt/contentful-ssg/commit/0935142332efe611244f359c0f44498c1cb8570b))
