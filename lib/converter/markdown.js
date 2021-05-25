import { convert as convertYaml } from './yaml.js';

/**
 * Convert object to markdown
 * @param {Object} obj Source object
 * @returns {String} Markdown representation of source object
 */
export const convert = (object) => {
  let frontMatter = '';
  frontMatter += `---\n`;
  frontMatter += convertYaml(object);
  frontMatter += `---\n`;
  return frontMatter;
};
