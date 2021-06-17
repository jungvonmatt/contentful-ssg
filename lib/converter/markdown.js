const { stringifyYaml, parseYaml } = require('./yaml');
const matter = require('gray-matter');

/**
 * Convert object to markdown
 * @param {Object} obj Source object
 * @returns {String} Markdown representation of source object
 */
const stringifyMarkdown = (obj, content = '') => {
  let frontMatter = '';
  frontMatter += `---\n`;
  frontMatter += stringifyYaml(obj);
  frontMatter += `---\n${content}`;
  return frontMatter;
};

/**
 * parse json to object
 * @param {String} string JSON string
 * @returns {Object} parsed object
 */
const parseMarkdown = (string) => {
  const data = matter(string, {
    engines: {
      yaml: (string) => parseYaml(string),
    },
  });
  return data;
};

module.exports.stringifyMarkdown = stringifyMarkdown;
module.exports.parseMarkdown = parseMarkdown;
