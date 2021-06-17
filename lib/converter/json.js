/**
 * Convert object to json
 * @param {Object} obj Source object
 * @returns {String} JSON representation of source object
 */
const stringify = (obj) => {
  return JSON.stringify(obj, null, '  ');
};

/**
 * parse json to object
 * @param {String} string JSON string
 * @returns {Object} parsed object
 */
const parse = (string) => {
  return JSON.parse(string);
};

module.exports.stringify = stringify;
module.exports.parse = parse;
