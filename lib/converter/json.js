/**
 * Convert object to json
 * @param {Object} obj Source object
 * @returns {String} JSON representation of source object
 */
const stringifyJson = (obj) => {
  return JSON.stringify(obj, null, '  ');
};

/**
 * parse json to object
 * @param {String} string JSON string
 * @returns {Object} parsed object
 */
const parseJson = (string) => {
  return JSON.parse(string);
};

module.exports.stringifyJson = stringifyJson;
module.exports.parseJson = parseJson;
