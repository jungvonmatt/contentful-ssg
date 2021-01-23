const path = require('path');
const dlv = require('dlv');
const chalk = require('chalk');
const inquirer = require('inquirer');
const { snakeCase } = require('snake-case');

/**
 * Log info
 * @param {String} str Info text
 */
const info = (str) => console.log(chalk.cyan(str));

/**
 * Log error
 * @param {Error} error Error object
 */
const error = (error) => {
  const { message, fileName, lineNumber, stack } = error;
  console.error(chalk.red('\nError:'), message);
  if (fileName && lineNumber) {
    console.log(fileName, lineNumber);
  } else if (stack) {
    console.log(stack);
  }
};

/**
 * Render confirm message to the console
 * @param {String} message Error object
 * @param {Boolean} defaultValue Error object
 * @returns {Boolean} Confirm value
 */
const confirm = async (message, defaultValue) => {
  const { value } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'value',
      message,
      default: defaultValue,
    },
  ]);

  return value;
};

/**
 * Group list of objects by a common key
 * e.g.: [{a:'de',b:2},{a:'en',b:3}, {a:'de',b:5}] => {de: [{a:'de',b:2},{a:'de',b:5}], en: [{a:'en',b:3}]}
 * @param {Array} array Array of similar objects
 * @param {String} key Object key to group by
 * @returns {Object} Grouped Object
 */
const groupBy = (array, key) =>
  array.reduce((acc, value) => {
    const k = dlv(value, key);
    // Group initialization
    if (!acc[k]) {
      acc[k] = [];
    }

    // Grouping
    acc[k].push(value);

    return acc;
  }, {});

/**
 * Recursive remove empty items (null,undefined) from object
 * @param {Object} obj Source object
 * @returns {Object} Cleaned object
 */
const removeEmpty = (obj) => {
  if (Array.isArray(obj)) {
    return obj.filter((v) => v !== null && v !== undefined).map((v) => (v === Object(v) ? removeEmpty(v) : v));
  }
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([_, v]) => v !== null && v !== undefined)
      .map(([k, v]) => [k, v === Object(v) ? removeEmpty(v) : v])
  );
};

/**
 * Omit values by key from object
 * @param {*} obj
 * @param {*} keys
 */
const omitKeys = (obj, ...keys) => Object.fromEntries(Object.entries(obj).filter(([key]) => !keys.includes(key)));

/**
 * Convert keys in object to shake_case
 * @param {Object} obj
 * @returns {Object}
 */
const snakeCaseKeys = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map((item) => snakeCaseKeys(item));
  }

  if (Object.prototype.toString.call(obj) === '[object Object]') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => {
        return [snakeCase(key), snakeCaseKeys(value)];
      })
    );
  }

  return obj;
};

/**
 *
 * @param {Object} config
 * @returns {String}
 */
const getContentTypeDirectory = async (config) => {
  const { directory, mapDirectory, locale, contentType } = config || {};
  if (typeof mapDirectory === 'function') {
    const customDir = await mapDirectory(contentType, { locale });
    return path.join(directory, customDir);
  }

  return path.join(directory, contentType);
};

/**
 * Recursively collect values
 */
const collect = (item, data, options) => {
  const { getId, getNextId, getValue, reverse } = options;
  const value = getValue(item);
  const nextId = getNextId(item);

  const parent = nextId && data.find((item) => getId(item) === nextId);

  if (parent) {
    return reverse ? [...collect(parent, data, options), value] : [value, ...collect(parent, data, options)];
  }

  return [value];
};

module.exports.groupBy = groupBy;
module.exports.getContentTypeDirectory = getContentTypeDirectory;
module.exports.snakeCaseKeys = snakeCaseKeys;
module.exports.removeEmpty = removeEmpty;
module.exports.confirm = confirm;
module.exports.omitKeys = omitKeys;
module.exports.collect = collect;
module.exports.log = { info, error };
