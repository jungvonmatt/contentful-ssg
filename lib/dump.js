const path = require('path');
const fs = require('fs-extra');
const { getContent, getContentTypeId, getContentId } = require('./contentful');
const { mapAsync } = require('./array');
const { groupBy, snakeCaseKeys, getContentTypeDirectory } = require('./utils');
const yaml = require('./converter/yaml');
const markdown = require('./converter/markdown');
const { localizeEntry } = require('./transform/localize');
const { mapEntry } = require('./transform/mapper');
const { mapBuildInFields, addBlueprints, mapGrowLink } = require('./transform/grow');

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

  Object.entries(tmp)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([ct, cnt]) => console.log(`   ${ct} - ${cnt} item${cnt === 1 ? 's' : ''}`));
};

/**
 * Dump contentful objects to files
 * @param {Object} config
 */
const dump = async (config) => {
  console.log(`
---------------------------------------------
Pulling Published Data from Contentful...
---------------------------------------------
`);

  const { format = 'yaml', preset, mapFilename, transform } = config;
  const content = await getContent(config);
  const { entries, locales, assets, contentTypes } = content;

  const { code: defauleLocale } = locales.find((locale) => locale.default);

  // use grow link mapper
  if (preset === 'grow' && !config.mapEntryLink) {
    config.mapEntryLink = mapGrowLink;
  }

  // loop locales
  const stats = await mapAsync(locales, async (locale) => {
    // Localize assets & entries
    const localizedAssets = await mapAsync(assets, (asset) =>
      localizeEntry(asset, locale.code, { locales, contentTypes })
    );
    const localizedEntries = await mapAsync(entries, (entry) =>
      localizeEntry(entry, locale.code, { locales, contentTypes })
    );

    // loop enrtries
    const contentStats = await mapAsync(localizedEntries, async (entry) => {
      const id = getContentId(entry);
      const contentType = getContentTypeId(entry);
      const options = {
        ...content,
        ...config,
        entry,
        entries: localizedEntries,
        assets: localizedAssets,
        locale,
        contentType,
      };

      let data = await mapEntry(localized, options);

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
          typeof mapFilename === 'function' ? await mapFilename(data, options) : `${id}${localeAddon}.${format}`;

        const dir = await getContentTypeDirectory(options);

        await fs.outputFile(path.join(dir, file), content);
        return { id, contentType, status: STATUS_SUCCES };
      }

      return { id, contentType, status: STATUS_ERROR };
    });

    // add blueprints
    if (preset === 'grow') {
      await addBlueprints({ ...config, locale });
    }

    return [locale.code, groupBy(contentStats, 'contentType')];
  });

  outputStats(stats, defauleLocale);
  console.log('\n---------------------------------------------');
};

module.exports.dump = dump;
