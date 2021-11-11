import matter from 'gray-matter';
import {stringify as stringifyYaml, parse as parseYaml} from './yaml.js';

/**
 * Convert object to markdown
 * @param {Object} obj Source object
 * @returns {String} Markdown representation of source object
 */
export const stringify = (obj, content = '') => {
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
export const parse = string => {
  const data = matter(string, {
    engines: {
      yaml: string => parseYaml(string) as Record<string, unknown>,
    },
  });
  return data;
};
