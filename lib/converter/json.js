/**
 * Convert object to JSON
 * @param {Object} obj Source object
 * @returns {String} JSON representation of source object
 */
export const convert = (object) => {
  return JSON.stringify(object, undefined, '  ');
};
