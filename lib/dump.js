const path = require('path');
const fs = require('fs-extra');
const { getContent, getContentTypeId, getContentId } = require('./contentful');
const { mapAsync } = require('./array');
const { groupBy } = require('./utils');
const yaml = require('./strategy/yaml');
const markdown = require('./strategy/markdown');
const { localizeEntry } = require('./transform/localize');
const { mapEntry } = require('./transform/mapper');

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

  const { format = 'yaml', directory, transform } = config;
  const content = await getContent(config);
  const { entries, locales, assets } = content;

  const { code: defauleLocale } = locales.find((locale) => locale.default);

  // loop locales
  const stats = await mapAsync(locales, async (locale) => {
    const translatedAssets = assets.map((asset) => localizeEntry(asset, locale.code, content));

    // loop enrtries
    const contentStats = await mapAsync(entries, async (entry) => {
      const options = { ...content, ...config };
      const id = getContentId(entry);
      const contentType = getContentTypeId(entry);
      const localized = await localizeEntry(entry, locale.code, options);
      const mapped = await mapEntry(localized, { ...options, assets: translatedAssets });

      if (mapped) {
        const data = typeof transform === 'function' ? await transform(mapped, entry) : mapped;
        const content = await convert(data, format);
        const localeAddon = locale.default ? '' : `@${locale.code}`;
        const filename = `${id}${localeAddon}.${format}`;
        let filepath = path.join(directory, getContentTypeId(entry), filename);

        if (typeof directory === 'function') {
          filepath = await directory({ locale, contentType, entry, format });
        }

        await fs.outputFile(filepath, content);
        return { id, contentType, status: STATUS_SUCCES };
      }

      return { id, contentType, status: STATUS_ERROR };
    });

    return [locale.code, groupBy(contentStats, 'contentType')];
  });

  outputStats(stats, defauleLocale);
  console.log('\n---------------------------------------------');
};

module.exports.dump = dump;
