const chalk = require('chalk');
const inquirer = require('inquirer');

const info = (str) => console.log(chalk.cyan(str));
const error = (error) => {
  const { message, fileName, lineNumber, stack } = error;
  console.error(chalk.red('\nError:'), message);
  // console.log(JSON.stringify(error));
  if (fileName && lineNumber) {
    console.log(fileName, lineNumber);
  } else if (stack) {
    console.log(stack);
  }
};

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

const removeEmpty = (obj) =>
  Object.fromEntries(
    Object.entries(obj)
      .filter(([_, v]) => v !== null && v !== undefined)
      .map(([k, v]) => [k, v === Object(v) ? removeEmpty(v) : v])
  );

const omitKeys = (obj, keys) => Object.fromEntries(Object.entries(obj).filter(([key]) => !keys.includes(key)));

module.exports.groupBy = groupBy;
module.exports.removeEmpty = removeEmpty;
module.exports.confirm = confirm;
module.exports.omitKeys = omitKeys;
module.exports.log = { info, error };
