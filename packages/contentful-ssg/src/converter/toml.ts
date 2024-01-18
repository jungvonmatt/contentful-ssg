import TOML, { type JsonMap } from '@iarna/toml';
import { type KeyValueMap } from '../types';

/**
 * Convert object to toml
 * @param {Object} obj Source object
 * @returns {String} toml representation of source object
 */
export const stringify = <T = KeyValueMap>(obj: T): string =>
  TOML.stringify(obj as unknown as JsonMap);

/**
 * Parse toml to object
 * @param {String} string toml string
 * @returns {Object} parsed object
 */
export const parse = <T = KeyValueMap>(string: string): T => TOML.parse(string) as unknown as T;
