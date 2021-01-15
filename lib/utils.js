const chalk = require('chalk');
const inquirer = require('inquirer');

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
    // Group initialization
    if (!acc[value[key]]) {
      acc[value[key]] = [];
    }

    // Grouping
    acc[value[key]].push(value);

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

module.exports.groupBy = groupBy;
module.exports.removeEmpty = removeEmpty;
module.exports.confirm = confirm;
module.exports.omitKeys = omitKeys;
module.exports.log = { info, error };
