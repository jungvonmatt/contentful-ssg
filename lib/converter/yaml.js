const yaml = require('js-yaml');

const schema = yaml.DEFAULT_SCHEMA.extend(require('js-yaml-js-types').all);

/**
 * Convert object to yaml
 * @param {Object} obj Source object
 * @returns {String} Yaml representation of source object
 */
const convert = (obj) => {
  return yaml.dump(obj, { schema });
};

module.exports.convert = convert;
