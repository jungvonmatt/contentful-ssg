import chalk from 'chalk';
import dlv from 'dlv';
import findUp from 'find-up';
import fs from 'fs-extra';
import globby from 'globby';
import ignore from 'ignore';
import Listr from 'listr';
import UpdaterRenderer from 'listr-update-renderer';
import mm from 'micromatch';
import path from 'path';
import { forEachAsync, mapAsync } from './array.js';
import { convertToMap, getContent, getContentId, getContentTypeId, getFieldSettings } from './contentful.js';
import { convert as convertJson } from './converter/json.js';
import { convert as convertMarkdown } from './converter/markdown.js';
import { convert as convertYaml } from './converter/yaml.js';
import { addBlueprints, mapBuildInFields, mapGrowLink } from './presets/grow.js';
import { localizeEntry } from './transform/localize.js';
import { mapEntry } from './transform/mapper.js';
import { collect, getContentTypeDirectory, groupBy, snakeCaseKeys } from './utils.js';

const STATUS_SUCCES = 'success';
const STATUS_ERROR = 'error';
const DEFAULT_FORMAT = 'yaml';

/**
 * Convert object to destination format
 * @param {Object} obj Source object
 * @param {String} format Destination format
 * @returns {String}
 */
const convert = (object, format = 'yaml') => {
  switch (format) {
    case 'yaml':
    case 'yml':
      return convertYaml(object);
    case 'md':
    case 'markdown':
      return convertMarkdown(object);
    case 'json':
      return convertJson(object);
    default:
      throw new Error(`Format "${format}" is not supported`);
  }
};

/**
 * Log dump stats
 * @param {Object} stats
 * @param {String} locale
 */
const outputStats = (stats, locale) => {
  const data = Object.fromEntries(
    stats.map(([locale, stats]) => {
      return [locale, Object.fromEntries(Object.entries(stats).map(([ct, list]) => [ct, list.length]))];
    })
  );

  let temporary = data[locale];
  if (!temporary) {
    temporary = Object.values(data)[0];
  }
  console.log('    -----------');
  const cnt = Object.entries(temporary)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([ct, cnt]) => {
      console.log(`  ${chalk.green('✔')} ${ct} - ${chalk.cyan(cnt)} item${cnt === 1 ? 's' : ''}`);
      return cnt;
    });

  console.log(`\n  Saved ${chalk.cyan(cnt.reduce((accumulator, number) => accumulator + number, 0))} entries`);
};

/**
 * Dump contentful objects to files
 * @param {Object} config
 */
export const dump = async (config) => {
  const tasks = new Listr(
    [
      {
        title: 'Setup',
        task: async (context) => {
          // Todo: unify preset functions
          const { preset, mapEntryLink } = config;
          context.config = config;
          // use grow link mapper
          if (preset === 'grow' && !mapEntryLink) {
            context.config.mapEntryLink = mapGrowLink;
          }

          const gitignore = await findUp('.gitignore');

          if (gitignore) {
            context.igBase = gitignore ? path.dirname(gitignore) : process.cwd();
            const ignorePatterns = await fs.readFile(gitignore);
            context.ig = ignore().add(ignorePatterns.toString());
          }
        },
      },
      {
        title: 'Pulling data from contentful',
        task: async (context) => {
          const content = await getContent(context.config);
          const { locales, contentTypes } = content;

          const fieldSettings = getFieldSettings(contentTypes);
          const { code: defauleLocale } = locales.find((locale) => locale.default);

          context.defauleLocale = defauleLocale;

          context.data = {
            ...content,
            fieldSettings,
          };
        },
      },
      {
        title: 'Localize data',
        task: async (context) => {
          const { locales, entries, assets, contentTypes, fieldSettings } = context.data;
          context.localized = new Map();
          return new Listr(
            locales.map((locale) => ({
              title: `${locale.code}`,
              task: async () => {
                const localizedAssets = await mapAsync(assets, async (asset) =>
                  localizeEntry(asset, locale.code, { locales, contentTypes, fieldSettings })
                );
                const localizedEntries = await mapAsync(entries, async (entry) =>
                  localizeEntry(entry, locale.code, { locales, contentTypes, fieldSettings })
                );

                context.localized.set(locale.code, {
                  assets: localizedAssets,
                  entries: localizedEntries,
                  assetMap: convertToMap(localizedAssets),
                  entryMap: convertToMap(localizedEntries),
                });
              },
            })),
            { concurrent: true }
          );
        },
      },
      {
        title: 'Writing files',
        task: async (context) => {
          const { locales = [] } = context.data;
          const { directory, format: defaultFormat = DEFAULT_FORMAT } = context.config;

          // create set of existing files
          const existingFiles = await globby(`${directory}/**/*.*`);
          context.existing = new Set(existingFiles);

          context.stats = [];

          return new Listr(
            locales.map((locale) => ({
              title: `${locale.code}`,
              task: async () => {
                const { locales, contentTypes, fieldSettings } = context.data;
                const { preset, mapFilename, transform } = context.config;
                const { entries = [], assets = [], assetMap, entryMap } = context.localized.get(locale.code) || {};

                const contentStats = await mapAsync(entries, async (entry) => {
                  const id = getContentId(entry);
                  const contentType = getContentTypeId(entry);

                  const collectValues = (key, options_) => {
                    const { getNextId, linkField, entry: _entry = entry } = options_ || {};
                    const parameters = {
                      getId: (item) => dlv(item, 'sys.id'),
                      getNextId: (item) => dlv(item, 'fields.parent.sys.id'),
                      getValue: (item) => dlv(item, key),
                      reverse: true,
                      ...(options_ || {}),
                    };

                    if (!getNextId && linkField) {
                      parameters.getNextId = (item) => dlv(item, `${linkField}.sys.id`);
                    }

                    return collect(_entry, entries, parameters);
                  };

                  const collectParentValues = (key, options_) => {
                    const { reverse = true } = options_ || {};
                    const values = collectValues(key, options_);
                    return reverse ? (values || []).slice(0, -1) : (values || []).slice(1);
                  };

                  const options = {
                    ...context.config,
                    ...context.data,
                    entry,
                    entries: entryMap,
                    assets: assetMap,
                    locale,
                    helper: { collectValues, collectParentValues },
                    contentType,
                  };

                  let data = await mapEntry(entry, options);

                  if (data) {
                    // use CLDR codes for locales (http://www.localeplanet.com/icu/)
                    const localeAddon = locale.default ? '' : `@${locale.code.replace('-', '_')}`;

                    if (preset === 'grow') {
                      // convert keys to snake_case
                      data = snakeCaseKeys(data);

                      data = await mapBuildInFields(data, options);
                    }

                    if (typeof transform === 'function') {
                      data = await transform(data, options);
                    }

                    const contentTypeDirectory = await getContentTypeDirectory(options);
                    let format;
                    if (typeof defaultFormat === 'string') {
                      format = defaultFormat;
                    } else if (typeof defaultFormat === 'function') {
                      format = defaultFormat({ ...options, contentTypeDirectory }) || DEFAULT_FORMAT;
                    } else {
                      format = (Object.entries(defaultFormat || {}).find(([, glob]) =>
                        mm.contains(contentTypeDirectory, glob)
                      ) || [DEFAULT_FORMAT])[0];
                    }

                    const content = await convert(data, format);

                    const file =
                      typeof mapFilename === 'function'
                        ? await mapFilename(data, options)
                        : `${id}${localeAddon}.${format}`;

                    const filepath = path.join(contentTypeDirectory, file);
                    let skip = false;
                    if (fs.existsSync(filepath)) {
                      const oldContent = await fs.readFile(filepath);
                      skip = content == oldContent;
                    }

                    if (!skip) {
                      await fs.outputFile(path.join(contentTypeDirectory, file), content);
                    }
                    if (context.existing.has(path.resolve(filepath))) {
                      context.existing.delete(path.resolve(filepath));
                    }

                    return { id, contentType, status: STATUS_SUCCES };
                  }

                  return { id, contentType, status: STATUS_ERROR };
                });

                // add blueprints
                if (preset === 'grow') {
                  const blueprints = await addBlueprints({ ...config, locale });
                  for (const file of blueprints) {
                    if (context.existing.has(path.resolve(file))) {
                      context.existing.delete(path.resolve(file));
                    }
                  }
                }

                context.stats.push([locale.code, groupBy(contentStats, 'contentType')]);
              },
            })),
            { concurrent: true }
          );
        },
      },
      {
        title: 'Cleanup',
        skip: (context) => context.existing.length === 0,
        task: async (context) => {
          await forEachAsync([...context.existing], (file) => {
            if (!context.ig || context.ig.ignores(path.relative(context.igBase, file))) {
              fs.remove(file);
              context.existing.delete(file);
            }
          });
        },
      },
    ],
    { collapse: true, renderer: UpdaterRenderer }
  );

  try {
    const context = await tasks.run();
    outputStats(context.stats, context.defauleLocale);
  } catch (error) {
    console.error(error);
  }

  console.log('\n---------------------------------------------');
};
