import matter from 'gray-matter';
import { KeyValueMap } from '../types.js';
import { stringify as stringifyYaml, parse as parseYaml } from './yaml.js';

/**
 * Convert object to markdown
 * @param {Object} obj Source object
 * @returns {String} Markdown representation of source object
 */
export const stringify = <T = KeyValueMap>(obj: T, content = ''): string => {
  let frontMatter = '';
  frontMatter += '---\n';
  frontMatter += stringifyYaml(obj);
  frontMatter += `---\n${content}`;
  return frontMatter;
};

/**
 * Parse json to object
 * @param {String} string JSON string
 * @returns {Object} parsed object
 */
export const parse = <T = KeyValueMap>(string: string): T => {
  const data = matter(string, {
    engines: {
      yaml: (string) => parseYaml(string),
    },
  });
  return data as unknown as T;
};
