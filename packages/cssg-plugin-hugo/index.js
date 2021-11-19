
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
  settingsType: 'd-settings',
  i18nType: 'd-i18n',
  defaultContentLanguageInSubdir: false,
  configTemplate: 'config/_default/_config.toml',
  typeConfig:  {
    [TYPE_PAGE]: ['page'],
    [TYPE_DATA]: ['d-*'],
  },

  fieldIds: {
    slug: 'slug',
    parent: 'parent_page'
  }
}

export default (args) => {
  const options = {...defaultOptions, ...(args || {})}

  const getSettingsHelper = (runtimeContext) => {
    let settings = {};
    if (options.settingsType) {
      settings = Object.fromEntries(Array.from((runtimeContext?.localized ?? new Map()).entries()).map(([locale, contentfulData]) => {
        const entryMap = contentfulData?.entryMap ?? new Map();
        const settingsEntries = (Array.from(entryMap.values())).filter(entry => (entry?.sys?.contentType?.sys?.id ?? 'unknown') === options.settingsType);
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
      const {helper,converter, data, localized, defaultLocale} = runtimeContext;
      const locales = data?.locales ?? [];

      // initialize getSettings
      const getSettings = getSettingsHelper(runtimeContext);
      helper.getSettings = getSettings;

      // Write config toml according to locale settings in contentful
      if (options.configTemplate) {
        const rootDir = runtimeContext?.config?.rootDir ?? process.cwd();
        const src = path.resolve(rootDir,options.configTemplate);
        const dst = path.join(rootDir, 'config/_default/config.toml');
        if (defaultLocale && existsSync(src)) {
          const config = converter.toml.parse(await readFile(src));
          const languageConfig = {
            languageCode: defaultLocale.code,
            defaultContentLanguage: defaultLocale.code,
            // Enbale to use locale subdir for default language
            defaultContentLanguageInSubdir: Boolean(options?.defaultContentLanguageInSubdir ?? false),
            languages: Object.fromEntries(
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
            ),
          };
          await writeFile(
            dst,
            converter.toml.stringify({
              ...config,
              ...languageConfig,
            })
          );
        }
      }

      // Find section pages
      const enhancedLocalized = new Map(Array.from(localized.entries()).map(([localeCode, contentfulData]) => {
        const {entries} = contentfulData;
        const sectionIds = entries.reduce((nodes, entry) => {
          const id = entry?.fields?.[options.fieldIds.parent]?.sys?.id;
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

    async mapFilename(transformContext, runtimeContext) {
      const {id, locale,  entry, contentTypeId, utils} = transformContext;
      const {helper, localized} = runtimeContext;
      const sectionIds = localized?.get(locale.code)?.sectionIds ?? new Set();

      const type = getEntryType(transformContext);

      const home = helper.getSettings('home', locale.code);
      const homeId = home?.sys?.id;

     if (homeId && entry?.sys?.id === homeId) {
        return `/_index.md`;
     }

      if (contentTypeId === options.settingsType) {
        return path.join(locale.code, `settings.json`);
      }

      if (type === TYPE_DATA) {
        return path.join(locale.code, contentTypeId, `${id}.json`);
      }


      if (type === TYPE_PAGE && sectionIds.has(id)) {
        const slugs = utils.collectValues(`fields.${options.fieldIds.slug}`, {
          linkField: `fields.${options.fieldIds.parent}`,
        });

        return path.join(...slugs, `_index.md`)
      }

      if (type === TYPE_PAGE) {
        const slugs = utils.collectParentValues(`fields.${options.fieldIds.slug}`, {
          linkField: `fields.${options.fieldIds.parent}`,
        });

        return path.join(...slugs, `${entry?.fields?.[options.fieldIds.slug] ?? 'unknown'}.md`)
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
      if (contentTypeId === 'd-i18n') {
        const { key, other, one } = content;
        const translations = one ? { one, other } : { other };

        const dictionaryPath = path.join(contentDir, `../i18n/${locale.code}.toml`);
        const oldContent = existsSync(dictionaryPath) ? toml.parse(await readFile(dictionaryPath, 'utf8')) : {};
        await writeFile(
          dictionaryPath,
          toml.stringify({ ...oldContent, [key]: translations }, undefined, '  ')
        );
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



