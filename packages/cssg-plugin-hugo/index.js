
import mergeOptionsModule from 'merge-options';

import {snakeCaseKeys} from '@jungvonmatt/contentful-ssg/helper/object';
import mm from 'micromatch';
import {existsSync} from 'fs';
import {writeFile, readFile} from 'fs/promises';
import path from 'path';

const mergeOptions = mergeOptionsModule.bind({ ignoreUndefined: true });

export const TYPE_PAGE = 'page';
export const TYPE_DATA = 'data';
export const TYPE_HEADLESS = 'headless';

const defaultOptions = {
  typeIdSettings: 'd-settings',
  typeIdI18n: 'd-i18n',
  languageConfig: true,
  fieldIdHome: 'home',
  fieldIdSlug: 'slug',
  fieldIdParent: 'parent_page',
  typeConfig:  {
    [TYPE_PAGE]: ['page'],
    [TYPE_DATA]: ['d-*'],
  },
}

export default (args) => {
  const options = {...defaultOptions, ...(args || {})}

  const getSettingsHelper = (runtimeContext) => {
    let settings = {};
    if (options.typeIdSettings) {
      settings = Object.fromEntries(Array.from((runtimeContext?.localized ?? new Map()).entries()).map(([locale, contentfulData]) => {
        const entryMap = contentfulData?.entryMap ?? new Map();
        const settingsEntries = (Array.from(entryMap.values())).filter(entry => (entry?.sys?.contentType?.sys?.id ?? 'unknown') === options.typeIdSettings);
        const settingsFields = settingsEntries.map(entry => entry?.fields ?? {});
        return [locale, mergeOptions(...settingsFields)];
      }));
    }

    return  (key, locale, defaultValue) => settings?.[locale]?.[key] ?? defaultValue;
  }

  const getEntryType = (transformContext) => {
    const {contentTypeId} = transformContext;
    const [type = TYPE_HEADLESS] = Object.entries(options?.typeConfig ?? {}).find(([,pattern]) => mm.isMatch(contentTypeId, pattern)) || [];

    return type;
  }



  return {
    // Before hook
    async before(runtimeContext) {
      const {helper,converter, data, localized} = runtimeContext;
      const locales = data?.locales ?? [];

      // initialize getSettings
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
            return [
              code,
              {
                contentDir: `content/${languageCode}`,
                languageCode,
                languageName,
                languageNameShort,
                weight: locale.default ? 1 : 2,
              },
            ];
          })
        );
        await writeFile(
          dst,
          converter.toml.stringify(languageConfig)
        );
      }

      // Find section pages and add them to the runtimeconfig
      const enhancedLocalized = new Map(Array.from(localized.entries()).map(([localeCode, contentfulData]) => {
        const {entries} = contentfulData;
        const sectionIds = entries.reduce((nodes, entry) => {
          const id = entry?.fields?.[options.fieldIdParent]?.sys?.id;
          if (id) {
            nodes.add(id);
          }

          return nodes;
        }, new Set());
        return [localeCode, {...contentfulData, sectionIds}];
      }));

      const result = {...runtimeContext, helper, localized: enhancedLocalized};

      return result;
    },

    /**
     * Add path markdown files for entry links
     * @param transformContext
     * @param runtimeContext
     * @returns
     */
    async mapEntryLink(
      transformContext,
      runtimeContext,
      prev
    ) {
      const directory = await runtimeContext.hooks.mapDirectory(transformContext);
      const filename = await runtimeContext.hooks.mapFilename(transformContext);

      return {...prev, path: path.join(directory,filename)};
    },

    /**
     * Map directories
     * @param transformContext
     * @returns
     */
    async mapDirectory(transformContext) {
      const {contentTypeId, locale} = transformContext;
      const type = getEntryType(transformContext);

      if (type === TYPE_DATA) {
        return '../data';
      }

      if (contentTypeId === TYPE_PAGE) {
        return locale.code;
      }

      return path.join('headless', contentTypeId);
    },

    /**
     * Map filenames data files to data, headless bundles to headless folder and pages in a
     * directory structure which matches the sitemap
     * @param transformContext
     * @param runtimeContext
     * @returns
     */
    async mapFilename(transformContext, runtimeContext) {
      const {id, locale,  entry, contentTypeId, utils} = transformContext;
      const {helper, localized} = runtimeContext;
      const sectionIds = localized?.get(locale.code)?.sectionIds ?? new Set();

      const type = getEntryType(transformContext);

      const home = helper.getSettings(options.fieldIdHome, locale.code);
      const homeId = home?.sys?.id;

     if (homeId && entry?.sys?.id === homeId) {
        return `/_index.md`;
     }

      if (contentTypeId === options.typeIdSettings) {
        return path.join(locale.code, `settings.json`);
      }

      if (type === TYPE_DATA) {
        return path.join(locale.code, contentTypeId, `${id}.json`);
      }

      if (type === TYPE_PAGE && sectionIds.has(id)) {
        const slugs = utils.collectValues(`fields.${options.fieldIdSlug}`, {
          linkField: `fields.${options.fieldIdParent}`,
          entry,
        });
        return path.join(...(slugs || []), `_index.md`)
      }

      if (type === TYPE_PAGE) {
        const slugs = utils.collectParentValues(`fields.${options.fieldIdSlug}`, {
          linkField: `fields.${options.fieldIdParent}`,
          entry
        });

        return path.join(...(slugs || []), `${entry?.fields?.[options.fieldIdSlug] ?? 'unknown'}.md`)
      }

      return path.join(id, `index.${locale.code}.md`);
    },

    async transform(transformContext, runtimeContext) {
      const {content, id, contentTypeId, locale} = transformContext;
      const contentDir = runtimeContext.config.directory;
      const toml = runtimeContext.converter.toml;
      const type = getEntryType(transformContext);

      // Automatically store dictionary entries in i18n/[locale].json
      // See https://gohugo.io/content-management/multilingual/#query-basic-translation
      if (options.typeIdI18n && contentTypeId === options.typeIdI18n) {
        const { key, other, one } = content;
        const translations = one ? { one, other } : { other };

        const dictionaryPath = path.join(contentDir, `../i18n/${locale.code}.toml`);
        const oldContent = existsSync(dictionaryPath) ? toml.parse(await readFile(dictionaryPath, 'utf8')) : {};
        await writeFile(
          dictionaryPath,
          toml.stringify({ ...oldContent, [key]: translations }, undefined, '  ')
        );

        // dont't write i-18n objects to the content folder
        return undefined;
      }

      if (type === TYPE_PAGE) {
        return {...snakeCaseKeys({
          ...content,

        }), translationKey: id};
      }

      if (type === TYPE_HEADLESS) {
        return snakeCaseKeys({
          ...content,
          headless: true,
        });
      }

      return snakeCaseKeys(content);
    }
  };
};



