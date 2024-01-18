import { type KeyValueMap } from '../types';

/**
 * Convert object to json
 * @param {Object} obj Source object
 * @returns {String} JSON representation of source object
 */
export const stringify = <T = KeyValueMap>(obj: T): string => JSON.stringify(obj, null, '  ');

/**
 * Parse json to object
 * @param {String} string JSON string
 * @returns {Object} parsed object
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-return
export const parse = <T = KeyValueMap>(string: string): T => JSON.parse(string);
