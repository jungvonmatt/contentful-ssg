import { snakeCaseKeys } from '@jungvonmatt/contentful-ssg/lib/object';
import mm from 'micromatch';
import { existsSync } from 'fs';
import { outputFile } from 'fs-extra';
import { readFile } from 'fs/promises';
import path from 'path';

export const TYPE_CONTENT = 'content';
export const TYPE_DATA = 'data';

export const STRATEGY_DIRECTORY = 'directory';
export const STRATEGY_FILENAME = 'filename';

const defaultOptions = {
  typeIdSettings: 'd-settings',
  translationStrategy: STRATEGY_DIRECTORY,
  typeIdI18n: 'd-i18n',
  languageConfig: true,
  menuDepth: 0,
  autoSubMenu: false,
  typeIdMenu: 'c-menu',
  fieldIdHome: 'home',
  fieldIdSlug: 'slug',
  fieldIdParent: 'parent_page',
  fieldIdMenu: 'menu',
  fieldIdMenuEntries: 'entries',
  fieldIdMenuHide: 'hide_in_menu',
  fieldIdMenuPos: 'menu_pos',
  typeConfig: {
    [TYPE_CONTENT]: ['page'],
  },
};

// Currently Hugo language internals lowercase language codes,
// which can cause conflicts with settings like defaultContentLanguage
// which are not lowercased
// See https://github.com/gohugoio/hugo/issues/7344
// https://gohugo.io/content-management/multilingual/#configure-languages
const hugoLocaleCode = locale => locale.code.toLowerCase();

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
            const settingsFields = settingsEntries
              .map((entry) => entry?.fields ?? {})
              .reduce((result, fields) => ({ ...result, ...fields }), {});

            return [locale, settingsFields];
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

  const buildMenu = async (transformContext, depth = 0) => {
    const { entry, entryMap } = transformContext;
    const entries = entry.fields?.[options.fieldIdMenuEntries] ?? [];
    const nodes = entries
      .filter((node) => node?.sys?.id && node?.sys?.contentType?.sys?.id)
      .map((node, index) => ({
        identifier: node.sys.id,
        weight: (index + 1) * 10,
        params: {
          id: node.sys.id,
          // eslint-disable-next-line camelcase
          content_type: node.sys.contentType.sys.id,
        },
      }));

    // Resolve page entry
    const resolvePageEntry = async (entry) => {
      const id = entry?.sys?.id ?? 0;
      const node = entryMap.get(id);
      const contentType = node?.sys?.contentType?.sys?.id ?? '';
      const pageId = node?.fields?.link_to_entry?.sys?.id;
      if (contentType === 'page') {
        return node;
      }

      if (pageId) {
        return entryMap.get(pageId);
      }

      if (typeof options.resolvePage === 'function') {
        return options.resolvePage(entry, entryMap);
      }
    };

    const getChildnodesManual = async (entry, depth, ids = []) => {
      const id = entry?.sys?.id ?? 0;
      const page = await resolvePageEntry(entry);
      const contentType = page?.sys?.contentType?.sys?.id ?? '';
      const menuId = page?.fields?.[options.fieldIdMenu]?.sys?.id;

      if (
        !id ||
        !contentType ||
        !menuId ||
        !entryMap.has(menuId) ||
        ids.includes(id) ||
        depth <= 0
      ) {
        return [];
      }

      const menu = entryMap.get(menuId);
      const subentries = menu?.fields?.[options.fieldIdMenuEntries] ?? [];

      const collected = await Promise.all(
        subentries.flatMap((node) => getChildnodesManual(node, depth - 1, [...ids, id]))
      );

      return [
        ...subentries
          .filter((node) => node?.sys?.id && node?.sys?.contentType?.sys?.id)
          .map((node, index) => ({
            identifier: node.sys.id,
            parent: id,
            weight: (index + 1) * 10,
            params: {
              id: node.sys.id,
              // eslint-disable-next-line camelcase
              content_type: node.sys.contentType.sys.id,
            },
          })),
        ...collected,
      ];
    };

    const getChildnodesRecursive = async (entry, depth) => {
      const id = entry?.sys?.id ?? 0;
      const page = await resolvePageEntry(id);
      const contentType = page?.sys?.contentType?.sys?.id ?? '';

      if (!id || !contentType || depth <= 0) {
        return [];
      }

      const childnodes = [...entryMap.values()].filter(
        (entry) => (entry?.fields?.[options.fieldIdParent]?.sys?.id ?? '') === id
      );

      // Filter childnodes based on hide_in_menu field
      const filtered = childnodes.filter(
        (entry) => !(entry?.fields?.[options.fieldIdMenuHide] ?? false)
      );

      // Sort based on menuPos field
      const sorted = [...filtered].sort(
        (a, b) =>
          (a?.fields?.[options.fieldIdMenuPos] ?? Number.MAX_SAFE_INTEGER) -
          (b?.fields?.[options.fieldIdMenuPos] ?? Number.MAX_SAFE_INTEGER)
      );

      return Array.from(
        await Promise.allSettled([
          ...sorted
            .filter((node) => node?.sys?.id && node?.sys?.contentType?.sys?.id)
            .map((node, index) => ({
              identifier: node.sys.id,
              parent: id,
              weight: (index + 1) * 10,
              params: {
                id: node.sys.id,
                // eslint-disable-next-line camelcase
                content_type: node.sys.contentType.sys.id,
              },
            })),
          ...sorted.flatMap((node) => getChildnodesRecursive(node, depth - 1)),
        ])
      )
        .map((a) => a.value)
        .filter((v) => v);
    };

    // When autoSubMenu parameter is set, we collect child pages automatically
    // Otherwise we look for dedicated menu entries in page nodes
    const childentries = options.autoSubMenu
      ? await Promise.all(entries.flatMap((node) => getChildnodesRecursive(node, depth)))
      : await Promise.all(entries.flatMap((node) => getChildnodesManual(node, depth)));

    return [...nodes, ...childentries].flat(Infinity).filter((v) => v);
  };

  return {
    config(prev) {
      const { managedDirectories } = prev || {};

      return { ...prev, managedDirectories: [...(managedDirectories || []), 'data'] };
    },

    // Before hook
    async before(runtimeContext) {
      const { helper, converter, data, localized } = runtimeContext;
      const locales = data?.locales ?? [];

      // Initialize getSettings
      const getSettings = getSettingsHelper(runtimeContext);
      helper.getSettings = getSettings;
      // Write config yaml according to locale settings in contentful
      if (options.languageConfig) {
        const rootDir = runtimeContext?.config?.rootDir ?? process.cwd();
        const mainConfigFile = path.join(rootDir, 'config/_default/config.yaml');
        const mainConfig =  converter.yaml.parse(await readFile(mainConfigFile));
        const defaultLocale = locales.find(locale => locale.default);
        if (defaultLocale && mainConfig.languageCode) {
          mainConfig.languageCode = hugoLocaleCode(defaultLocale);
        }

        if (defaultLocale && mainConfig.defaultContentLanguage) {
          mainConfig.defaultContentLanguage = hugoLocaleCode(defaultLocale);
        }

        await outputFile(mainConfigFile, converter.yaml.stringify(mainConfig));

        const dst = path.join(rootDir, 'config/_default/languages.yaml');
        const languageConfig = Object.fromEntries(
          locales.map((locale) => {
            const { code, name: languageName } = locale;

            const languageCode = code;
            const [languageNameShort] = languageCode.split('-');

            const localeConfig = {
              languageCode,
              languageName,
              languageNameShort,
              weight: locale.default ? 1 : 2,
            };

            return [
              hugoLocaleCode(locale),
              options.translationStrategy === 'directory'
                ? { contentDir: `content/${hugoLocaleCode(locale)}`, ...localeConfig }
                : localeConfig,
            ];
          })
        );
        await outputFile(dst, converter.yaml.stringify(languageConfig));
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

      const i18n = Object.fromEntries(locales.map((locale) => [hugoLocaleCode(locale), {}]));
      const menus = Object.fromEntries(locales.map((locale) => [hugoLocaleCode(locale), {}]));

      return { ...runtimeContext, helper, localized: enhancedLocalized, i18n, menus };
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
        return options.translationStrategy === STRATEGY_FILENAME ? '' : hugoLocaleCode(locale);
      }

      return options.translationStrategy === STRATEGY_FILENAME
        ? path.join('../data', contentTypeId)
        : path.join('../data', hugoLocaleCode(locale), contentTypeId);
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
          ? `/_index.${hugoLocaleCode(locale)}.md`
          : `/_index.md`;
      }

      if (contentTypeId === options.typeIdSettings) {
        return options.translationStrategy === STRATEGY_FILENAME
          ? `../settings.${hugoLocaleCode(locale)}.yaml`
          : '../settings.yaml';
      }

      if (type === TYPE_CONTENT && sectionIds.has(id)) {
        const slugs = utils.collectValues(`fields.${options.fieldIdSlug}`, {
          linkField: `fields.${options.fieldIdParent}`,
          entry: collectEntry,
          entryMap: collectEntryMap,
        });
        return options.translationStrategy === STRATEGY_FILENAME
          ? path.join(...(slugs || []).filter((v) => v), `_index.${hugoLocaleCode(locale)}.md`)
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
              `${collectEntry?.fields?.[options.fieldIdSlug] ?? 'unknown'}.${hugoLocaleCode(locale)}.md`
            )
          : path.join(
              ...(slugs || []).filter((v) => v),
              `${collectEntry?.fields?.[options.fieldIdSlug] ?? 'unknown'}.md`
            );
      }

      return options.translationStrategy === STRATEGY_FILENAME
        ? `${id}.${hugoLocaleCode(locale)}.yaml`
        : `${id}.yaml`;
    },

    async transform(transformContext, runtimeContext) {
      const { content, id, contentTypeId, locale, entry } = transformContext;

      const type = getEntryType(transformContext);

      // Automatically store dictionary entries in i18n/[locale].json
      // See https://gohugo.io/content-management/multilingual/#query-basic-translation
      if (options.typeIdI18n && contentTypeId === options.typeIdI18n) {
        const { key, other, one } = content;
        const translations = one ? { one, other } : { other };

        runtimeContext.i18n[hugoLocaleCode(locale)][key] = translations;

        // Dont't write i-18n objects to the content folder
        return undefined;
      }

      // Automatically build hugo menus
      // See https://gohugo.io/content-management/menus/
      if (options.typeIdMenu && contentTypeId === options.typeIdMenu) {
        const { name = 'main' } = entry.fields;
        const menu = await buildMenu(transformContext, options.menuDepth);

        runtimeContext.menus[hugoLocaleCode(locale)][name] = menu;
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
      const { yaml } = runtimeContext.converter;
      const i18n = runtimeContext?.i18n ?? {};

      await Promise.all(
        Object.entries(i18n).map(async ([localeCode, translations]) => {
          const dictionaryPath = path.join(contentDir, `../i18n/${localeCode}.yaml`);
          const oldContent = existsSync(dictionaryPath)
            ? yaml.parse(await readFile(dictionaryPath, 'utf8'))
            : {};

          return outputFile(dictionaryPath, yaml.stringify({ ...oldContent, ...translations }));
        })
      );

      const menus = runtimeContext?.menus ?? {};
      await Promise.all(
        Object.entries(menus).map(([localeCode, menuData]) => {
          const file = `config/_default/menus.${localeCode}.yaml`;
          const data = yaml.stringify(menuData);
          return outputFile(file, data);
        })
      );
    },
  };
};
