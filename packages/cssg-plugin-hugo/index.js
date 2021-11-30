import mergeOptionsModule from 'merge-options';

import { snakeCaseKeys } from '@jungvonmatt/contentful-ssg/lib/object';
import mm from 'micromatch';
import { existsSync } from 'fs';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';

const mergeOptions = mergeOptionsModule.bind({ ignoreUndefined: true });

export const TYPE_CONTENT = 'content';
export const TYPE_DATA = 'data';

export const STRATEGY_DIRECTORY = 'directory';
export const STRATEGY_FILENAME = 'filename';

const defaultOptions = {
  typeIdSettings: 'd-settings',
  translationStrategy: STRATEGY_DIRECTORY,
  typeIdI18n: 'd-i18n',
  languageConfig: true,
  fieldIdHome: 'home',
  fieldIdSlug: 'slug',
  fieldIdParent: 'parent_page',
  typeConfig: {
    [TYPE_CONTENT]: ['page'],
  },
};

export default (args) => {
  const options = { ...defaultOptions, ...(args || {}) };

  const getSettingsHelper = (runtimeContext) => {
    let settings = {};
    if (options.typeIdSettings) {
      settings = Object.fromEntries(
        Array.from((runtimeContext?.localized ?? new Map()).entries()).map(
          ([locale, contentfulData]) => {
            const entryMap = contentfulData?.entryMap ?? new Map();
            const settingsEntries = Array.from(entryMap.values()).filter(
              (entry) => (entry?.sys?.contentType?.sys?.id ?? 'unknown') === options.typeIdSettings
            );
            const settingsFields = settingsEntries.map((entry) => entry?.fields ?? {});
            return [locale, mergeOptions(...settingsFields)];
          }
        )
      );
    }

    return (key, locale, defaultValue) => settings?.[locale]?.[key] ?? defaultValue;
  };

  const getEntryType = (transformContext) => {
    const { contentTypeId } = transformContext;
    const [type = TYPE_DATA] =
      Object.entries(options?.typeConfig ?? {}).find(([, pattern]) =>
        mm.isMatch(contentTypeId, pattern)
      ) || [];

    return type;
  };

  return {
    // Before hook
    async before(runtimeContext) {
      const { helper, converter, data, localized } = runtimeContext;
      const locales = data?.locales ?? [];

      // Initialize getSettings
      const getSettings = getSettingsHelper(runtimeContext);
      helper.getSettings = getSettings;
      // Write config toml according to locale settings in contentful
      if (options.languageConfig) {
        const rootDir = runtimeContext?.config?.rootDir ?? process.cwd();
        const dst = path.join(rootDir, 'config/_default/languages.toml');
        const languageConfig = Object.fromEntries(
          locales.map((locale) => {
            const { code, name: languageName } = locale;
            // Currently Hugo language internals lowercase language codes,
            // which can cause conflicts with settings like defaultContentLanguage
            // which are not lowercased
            // https://github.com/gohugoio/hugo/issues/7344
            const languageCode = code.toLowerCase();
            const [languageNameShort] = languageCode.split('-');

            const localeConfig = {
              languageCode,
              languageName,
              languageNameShort,
              weight: locale.default ? 1 : 2,
            };

            return [
              code,
              options.translationStrategy === 'directory'
                ? { contentDir: `content/${languageCode}`, ...localeConfig }
                : localeConfig,
            ];
          })
        );
        await writeFile(dst, converter.toml.stringify(languageConfig));
      }

      // Find section pages and add them to the runtimeconfig
      const enhancedLocalized = new Map(
        Array.from(localized.entries()).map(([localeCode, contentfulData]) => {
          const { entries } = contentfulData;
          const sectionIds = entries.reduce((nodes, entry) => {
            const id = entry?.fields?.[options.fieldIdParent]?.sys?.id;
            if (id) {
              nodes.add(id);
            }

            return nodes;
          }, new Set());
          return [localeCode, { ...contentfulData, sectionIds }];
        })
      );

      const i18n = Object.fromEntries(locales.map((locale) => [locale.code, {}]));

      return { ...runtimeContext, helper, localized: enhancedLocalized, i18n };
    },

    /**
     * Add path markdown files for entry links
     * @param transformContext
     * @param runtimeContext
     * @returns
     */
    async mapEntryLink(transformContext, runtimeContext, prev) {
      const directory = await runtimeContext.hooks.mapDirectory(transformContext);
      const filename = await runtimeContext.hooks.mapFilename(transformContext);

      return { ...prev, path: path.join(directory, filename) };
    },

    /**
     * Map directories
     * @param transformContext
     * @returns
     */
    async mapDirectory(transformContext) {
      const { contentTypeId, locale } = transformContext;
      const type = getEntryType(transformContext);

      if (type === TYPE_CONTENT) {
        return options.translationStrategy === STRATEGY_FILENAME ? '' : locale.code;
      }

      return options.translationStrategy === STRATEGY_FILENAME
        ? path.join('../data', contentTypeId)
        : path.join('../data', locale.code, contentTypeId);
    },

    /**
     * Map filenames data files to data, headless bundles to headless folder and pages in a
     * directory structure which matches the sitemap
     * @param transformContext
     * @param {RuntimeContext} runtimeContext
     * @returns
     */
    async mapFilename(transformContext, runtimeContext) {
      const { id, locale, entry, contentTypeId, utils } = transformContext;
      const { helper, localized, defaultLocale } = runtimeContext;
      const sectionIds = localized?.get(locale.code)?.sectionIds ?? new Set();

      const localeData =
        options.translationStrategy === STRATEGY_FILENAME
          ? localized.get(defaultLocale)
          : localized.get(locale.code);
      const collectEntryMap = localeData.entryMap;
      const collectEntry = collectEntryMap.get(entry.sys.id);

      const type = getEntryType(transformContext);

      const home = helper.getSettings(options.fieldIdHome, locale.code);
      const homeId = home?.sys?.id;

      if (homeId && entry?.sys?.id === homeId) {
        return options.translationStrategy === STRATEGY_FILENAME
          ? `/_index.${locale.code}.md`
          : `/_index.md`;
      }

      if (contentTypeId === options.typeIdSettings) {
        return options.translationStrategy === STRATEGY_FILENAME
          ? `../settings.${locale.code}.yaml`
          : '../settings.yaml';
      }

      if (type === TYPE_CONTENT && sectionIds.has(id)) {
        const slugs = utils.collectValues(`fields.${options.fieldIdSlug}`, {
          linkField: `fields.${options.fieldIdParent}`,
          entry: collectEntry,
          entryMap: collectEntryMap,
        });
        return options.translationStrategy === STRATEGY_FILENAME
          ? path.join(...(slugs || []).filter((v) => v), `_index.${locale.code}.md`)
          : path.join(...(slugs || []).filter((v) => v), `_index.md`);
      }

      if (type === TYPE_CONTENT) {
        const slugs = utils.collectParentValues(`fields.${options.fieldIdSlug}`, {
          linkField: `fields.${options.fieldIdParent}`,
          entry: collectEntry,
          entryMap: collectEntryMap,
        });

        return options.translationStrategy === STRATEGY_FILENAME
          ? path.join(
              ...(slugs || []).filter((v) => v),
              `${collectEntry?.fields?.[options.fieldIdSlug] ?? 'unknown'}.${locale.code}.md`
            )
          : path.join(
              ...(slugs || []).filter((v) => v),
              `${collectEntry?.fields?.[options.fieldIdSlug] ?? 'unknown'}.md`
            );
      }

      return options.translationStrategy === STRATEGY_FILENAME
        ? `${id}.${locale.code}.yaml`
        : `${id}.yaml`;
    },

    async transform(transformContext, runtimeContext) {
      const { content, id, contentTypeId, locale } = transformContext;

      const type = getEntryType(transformContext);

      // Automatically store dictionary entries in i18n/[locale].json
      // See https://gohugo.io/content-management/multilingual/#query-basic-translation
      if (options.typeIdI18n && contentTypeId === options.typeIdI18n) {
        const { key, other, one } = content;
        const translations = one ? { one, other } : { other };

        runtimeContext.i18n[locale.code][key] = translations;

        // Dont't write i-18n objects to the content folder
        return undefined;
      }

      if (type === TYPE_CONTENT) {
        return {
          ...snakeCaseKeys({
            ...content,
          }),
          translationKey: id,
        };
      }

      return snakeCaseKeys(content);
    },

    async after(runtimeContext) {
      const contentDir = runtimeContext.config.directory;
      const { toml } = runtimeContext.converter;
      const i18n = runtimeContext?.i18n ?? {};

      await Promise.all(
        Object.entries(i18n).map(async ([localeCode, translations]) => {
          const dictionaryPath = path.join(contentDir, `../i18n/${localeCode}.toml`);
          const oldContent = existsSync(dictionaryPath)
            ? toml.parse(await readFile(dictionaryPath, 'utf8'))
            : {};

          return writeFile(dictionaryPath, toml.stringify({ ...oldContent, ...translations }));
        })
      );
    },
  };
};
