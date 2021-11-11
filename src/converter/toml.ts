import TOML from '@iarna/toml';

/**
 * Convert object to toml
 * @param {Object} obj Source object
 * @returns {String} toml representation of source object
 */
export const stringify = obj => TOML.stringify(obj);

/**
 * Parse toml to object
 * @param {String} string toml string
 * @returns {Object} parsed object
 */
export const parse = string => TOML.parse(string);
