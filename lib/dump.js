const path = require('path');
const Listr = require('listr');
const chalk = require('chalk');
const ignore = require('ignore');
const findUp = require('find-up');
const UpdaterRenderer = require('listr-update-renderer');
const fs = require('fs-extra');
const { getContent, getContentTypeId, getContentId, getFieldSettings, convertToMap } = require('./contentful');
const { mapAsync, forEachAsync } = require('./array');
const { groupBy, snakeCaseKeys, getContentTypeDirectory } = require('./utils');
const yaml = require('./converter/yaml');
const markdown = require('./converter/markdown');
const { localizeEntry } = require('./transform/localize');
const { mapEntry } = require('./transform/mapper');
const { mapBuildInFields, addBlueprints, mapGrowLink } = require('./transform/grow');
const globby = require('globby');

const STATUS_SUCCES = 'success';
const STATUS_ERROR = 'error';

/**
 * Convert object to destination format
 * @param {Object} obj Source object
 * @param {String} format Destination format
 * @returns {String}
 */
const convert = (obj, format = 'yaml') => {
  switch (format) {
    case 'yaml':
    case 'yml':
      return yaml.convert(obj);
    case 'md':
    case 'markdown':
      return markdown.convert(obj);
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

  let tmp = data[locale];
  if (!tmp) {
    tmp = Object.values(data)[0];
  }
  console.log('    -----------');
  const cnt = Object.entries(tmp)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([ct, cnt]) => {
      console.log(`  ${chalk.green('✔')} ${ct} - ${chalk.cyan(cnt)} item${cnt === 1 ? 's' : ''}`);
      return cnt;
    });

  console.log(`\n  Saved ${chalk.cyan(cnt.reduce((acc, num) => acc + num, 0))} entries`);
};

/**
 * Dump contentful objects to files
 * @param {Object} config
 */
const dump = async (config) => {
  const tasks = new Listr(
    [
      {
        title: 'Setup',
        task: async (ctx) => {
          // Todo: unify preset functions
          const { preset } = config;
          ctx.config = config;
          // use grow link mapper
          if (preset === 'grow' && !config.mapEntryLink) {
            ctx.config.mapEntryLink = mapGrowLink;
          }

          const gitignore = await findUp('.gitignore');

          if (gitignore) {
            ctx.igBase = gitignore ? path.dirname(gitignore) : process.cwd();
            const ignorePatterns = await fs.readFile(gitignore);
            ctx.ig = ignore().add(ignorePatterns.toString());
          }
        },
      },
      {
        title: 'Pulling data from contentful',
        task: async (ctx) => {
          const content = await getContent(ctx.config);
          const { locales, contentTypes } = content;

          const fieldSettings = getFieldSettings(contentTypes);
          const { code: defauleLocale } = locales.find((locale) => locale.default);

          ctx.defauleLocale = defauleLocale;

          ctx.data = {
            ...content,
            fieldSettings,
          };
        },
      },
      {
        title: 'Localize data',
        task: async (ctx) => {
          const { locales, entries, assets, contentTypes, fieldSettings } = ctx.data;
          ctx.localized = new Map();
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

                ctx.localized.set(locale.code, {
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
        task: async (ctx) => {
          const { locales = [] } = ctx.data;
          const { directory, format = 'yaml' } = ctx.config;

          // create set of existing files
          const existingFiles = await globby(`${directory}/**/*.${format}`);
          ctx.existing = new Set(existingFiles);

          ctx.stats = [];

          return new Listr(
            locales.map((locale) => ({
              title: `${locale.code}`,
              task: async () => {
                const { locales, contentTypes, fieldSettings } = ctx.data;
                const { format = 'yaml', preset, mapFilename, transform } = ctx.config;
                const { entries = [], assets = [], assetMap, entryMap } = ctx.localized.get(locale.code) || {};

                const contentStats = await mapAsync(entries, async (entry) => {
                  const id = getContentId(entry);
                  const contentType = getContentTypeId(entry);
                  const options = {
                    ...ctx.config,
                    ...ctx.data,
                    entry,
                    entries: entryMap,
                    assets: assetMap,
                    locale,
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

                    const content = await convert(data, format);

                    const file =
                      typeof mapFilename === 'function'
                        ? await mapFilename(data, options)
                        : `${id}${localeAddon}.${format}`;

                    const dir = await getContentTypeDirectory(options);
                    const filepath = path.join(dir, file);
                    let skip = false;
                    if (fs.existsSync(filepath)) {
                      const oldContent = await fs.readFile(filepath);
                      skip = content == oldContent;
                    }

                    if (!skip) {
                      await fs.outputFile(path.join(dir, file), content);
                    }
                    if (ctx.existing.has(path.resolve(filepath))) {
                      ctx.existing.delete(path.resolve(filepath));
                    }

                    return { id, contentType, status: STATUS_SUCCES };
                  }

                  return { id, contentType, status: STATUS_ERROR };
                });

                // add blueprints
                if (preset === 'grow') {
                  await addBlueprints({ ...config, locale });
                }

                ctx.stats.push([locale.code, groupBy(contentStats, 'contentType')]);
              },
            })),
            { concurrent: true }
          );
        },
      },
      {
        title: 'Cleanup',
        skip: (ctx) => ctx.existing.length === 0,
        task: async (ctx) => {
          await forEachAsync([...ctx.existing], (file) => {
            if (!ctx.ig || ctx.ig.ignores(path.relative(ctx.igBase, file))) {
              fs.remove(file);
              ctx.existing.delete(file);
            }
          });
        },
      },
    ],
    { collapse: true, renderer: UpdaterRenderer }
  );

  try {
    const ctx = await tasks.run();
    outputStats(ctx.stats, ctx.defauleLocale);
  } catch (error) {
    console.error(error);
  }

  console.log('\n---------------------------------------------');
};

module.exports.dump = dump;
