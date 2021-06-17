const TOML = require('@iarna/toml');

/**
 * Convert object to toml
 * @param {Object} obj Source object
 * @returns {String} toml representation of source object
 */
const stringify = (obj) => {
  return TOML.stringify(obj);
};

/**
 * parse toml to object
 * @param {String} string toml string
 * @returns {Object} parsed object
 */
const parse = (string) => {
  return TOML.parse(string);
};

module.exports.stringify = stringify;
module.exports.parse = parse;
