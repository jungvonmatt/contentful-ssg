const yaml = require('js-yaml');

/**
 * Convert object to yaml
 * @param {Object} obj Source object
 * @returns {String} Yaml representation of source object
 */
const convert = (obj) => {
  return yaml.dump(obj);
};

module.exports.convert = convert;
