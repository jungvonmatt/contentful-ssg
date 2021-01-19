const yaml = require('js-yaml');
const { all } = require('js-yaml-js-types');

/**
 * Convert object to yaml
 * @param {Object} obj Source object
 * @returns {String} Yaml representation of source object
 */
const convert = (obj) => {
  const schema = yaml.DEFAULT_SCHEMA.extend(all);
  return yaml.dump(obj, { schema });
};

module.exports.convert = convert;
