const { stringifyJson, parseJson } = require('./json.js');
const { stringifyMarkdown, parseMarkdown } = require('./markdown.js');
const { stringifyToml, parseToml } = require('./toml.js');
const { stringifyYaml, parseYaml } = require('./yaml.js');

const JSON = 'json';
const YAML = 'yaml';
const MARKDOWN = 'markdown';
const TOML = 'toml';

/**
 * stringify object to destination format
 * @param {Object} obj Source object
 * @param {String} format Destination format
 * @returns {String}
 */
const stringify = (obj, format = 'yaml') => {
  switch (format) {
    case 'yml':
    case YAML:
      return stringifyYaml(obj);
    case 'md':
    case MARKDOWN:
      return stringifyMarkdown(obj);
    case JSON:
      return stringifyJson(obj);
    case TOML:
      return stringifyToml(obj);
    default:
      throw new Error(`Format "${format}" is not supported`);
  }
};

/**
 * parse string to object
 * @param {String} string Source object
 * @param {String} format Destination format
 * @returns {Object}
 */
const parse = (str, format = 'yaml') => {
  switch (format) {
    case 'yml':
    case YAML:
      return parseYaml(str);
    case 'md':
    case MARKDOWN:
      const { data } = parseMarkdown(str);
      return data;
    case JSON:
      return parseJson(str);
    case TOML:
      return parseToml(str);
    default:
      throw new Error(`Format "${format}" is not supported`);
  }
};

module.exports.parse = parse;
module.exports.stringify = stringify;
module.exports.JSON = JSON;
module.exports.YAML = YAML;
module.exports.MARKDOWN = MARKDOWN;
module.exports.TOML = TOML;
