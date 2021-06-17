const { stringify: stringifyYaml, parse: parseYaml } = require('./yaml');
const matter = require('gray-matter');

/**
 * Convert object to markdown
 * @param {Object} obj Source object
 * @returns {String} Markdown representation of source object
 */
const stringify = (obj, content = '') => {
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
const parse = (string) => {
  const data = matter(string, {
    engines: {
      yaml: (string) => parseYaml(string),
    },
  });
  return data;
};

module.exports.stringify = stringify;
module.exports.parse = parse;
