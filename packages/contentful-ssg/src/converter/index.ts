import { type KeyValueMap } from '../types.js';
import { stringify as stringifyJson, parse as parseJson } from './json.js';
import { stringify as stringifyMarkdown, parse as parseMarkdown } from './markdown.js';
import { stringify as stringifyToml, parse as parseToml } from './toml.js';
import { stringify as stringifyYaml, parse as parseYaml } from './yaml.js';

export const TYPE_JSON = 'json';
export const TYPE_YAML = 'yaml';
export const TYPE_MARKDOWN = 'markdown';
export const TYPE_TOML = 'toml';

/**
 * Stringify object to destination format
 * @param {Object} obj Source object
 * @param {String} format Destination format
 * @returns {String}
 */
export const stringify = <T = KeyValueMap>(obj: T, format = 'yaml') => {
  switch (format) {
    case 'yml':
    case TYPE_YAML:
      return stringifyYaml(obj);
    case 'md':
    case TYPE_MARKDOWN:
      return stringifyMarkdown(obj);
    case TYPE_JSON:
      return stringifyJson(obj);
    case TYPE_TOML:
      return stringifyToml(obj);
    default:
      throw new Error(`Format ${JSON.stringify(format)} is not supported`);
  }
};

/**
 * Parse string to object
 * @param {String} string Source object
 * @param {String} format Destination format
 * @returns {Object}
 */
export const parse = (str: string, format = 'yaml') => {
  switch (format) {
    case 'yml':
    case TYPE_YAML:
      return parseYaml(str);
    case 'md':
    case TYPE_MARKDOWN: {
      const { data } = parseMarkdown(str);
      return data as KeyValueMap;
    }

    case TYPE_JSON:
      return parseJson(str);
    case TYPE_TOML:
      return parseToml(str);
    default:
      throw new Error(`Format "${format}" is not supported`);
  }
};
