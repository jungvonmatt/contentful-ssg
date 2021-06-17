const TOML = require('@iarna/toml');

/**
 * Convert object to toml
 * @param {Object} obj Source object
 * @returns {String} toml representation of source object
 */
const stringifyToml = (obj) => {
  return TOML.stringify(obj);
};

/**
 * parse toml to object
 * @param {String} string toml string
 * @returns {Object} parsed object
 */
const parseToml = (string) => {
  return TOML.parse(string);
};

module.exports.stringifyToml = stringifyToml;
module.exports.parseToml = parseToml;
