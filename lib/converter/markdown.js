const yaml = require('js-yaml');

/**
 * Convert object to markdown
 * @param {Object} obj Source object
 * @returns {String} Markdown representation of source object
 */
const convert = (obj) => {
  let frontMatter = '';
  frontMatter += `---\n`;
  frontMatter += yaml.dump(obj);
  frontMatter += `---\n`;
  return frontMatter;
};

module.exports.convert = convert;
