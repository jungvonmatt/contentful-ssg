const BUILD_INS = ['category', 'date', 'dates', 'hidden', 'slug', 'title'];

const transform = (config) => async (content, { contentType }) => {
  const { pageTypes = [], dateField = 'updated_at' } = config || {};

  return Object.fromEntries(
    Object.entries(content).map(([key, value]) => {
      if (BUILD_INS.includes(key) && pageTypes.includes(contentType)) {
        return [`$${key}`, value];
      }

      if (key === dateField) {
        return ['$date', new Date(value).toISOString()];
      }

      return [key, value];
    })
  );
};

const mapFilename = async (data, { locale, contentType, entry, format }) => {
  const [, code = locale.code] = /^([^_-]+)/.exec(locale.code) || [];
  const localeAddon = locale.default ? '' : `@${code.toLowerCase()}`;
  return `${id}${localeAddon}.${format}`;
};

module.exports.mapFilename = mapFilename;
module.exports.transform = transform;
