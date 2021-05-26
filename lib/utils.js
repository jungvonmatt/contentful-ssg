import chalk from 'chalk';
import dlv from 'dlv';
import inquirer from 'inquirer';
import path from 'path';
import { snakeCase } from 'snake-case';

/**
 * Log info
 * @param {String} str Info text
 */
const info = (string) => console.log(chalk.cyan(string));

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
export const confirm = async (message, defaultValue) => {
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
export const groupBy = (array, key) =>
  array.reduce((accumulator, value) => {
    const k = dlv(value, key);
    // Group initialization
    if (!accumulator[k]) {
      accumulator[k] = [];
    }

    // Grouping
    accumulator[k].push(value);

    return accumulator;
  }, {});

/**
 * Recursive remove empty items (null,undefined) from object
 * @param {Object} obj Source object
 * @returns {Object} Cleaned object
 */
export const removeEmpty = (object) => {
  if (Array.isArray(object)) {
    return object.filter((v) => v !== null && v !== undefined).map((v) => (v === Object(v) ? removeEmpty(v) : v));
  }
  return Object.fromEntries(
    Object.entries(object)
      .filter(([_, v]) => v !== null && v !== undefined)
      .map(([k, v]) => [k, v === Object(v) ? removeEmpty(v) : v])
  );
};

/**
 * Omit values by key from object
 * @param {*} obj
 * @param {*} keys
 */
export const omitKeys = (object, ...keys) =>
  Object.fromEntries(Object.entries(object).filter(([key]) => !keys.includes(key)));

/**
 * Convert keys in object to shake_case
 * @param {Object} obj
 * @returns {Object}
 */
export const snakeCaseKeys = (object) => {
  if (Array.isArray(object)) {
    return object.map((item) => snakeCaseKeys(item));
  }

  if (Object.prototype.toString.call(object) === '[object Object]') {
    return Object.fromEntries(
      Object.entries(object).map(([key, value]) => {
        return [snakeCase(key), snakeCaseKeys(value)];
      })
    );
  }

  return object;
};

/**
 *
 * @param {Object} config
 * @returns {String}
 */
export const getContentTypeDirectory = async (config) => {
  const { directory, mapDirectory, locale, contentType } = config || {};
  if (typeof mapDirectory === 'function') {
    const customDirectory = await mapDirectory(contentType, { locale });
    return path.join(directory, customDirectory);
  }

  return path.join(directory, contentType);
};

/**
 * Recursively collect values
 */
export const collect = (item, data, options) => {
  const { getId, getNextId, getValue, reverse } = options;
  const value = getValue(item);
  const nextId = getNextId(item);

  const parent = nextId && data.find((item) => getId(item) === nextId);

  if (parent) {
    return reverse ? [...collect(parent, data, options), value] : [value, ...collect(parent, data, options)];
  }

  return [value];
};

export const log = { info, error };
