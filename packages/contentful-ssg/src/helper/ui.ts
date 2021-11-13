import type {QuestionCollection} from 'inquirer';
import type {ContentfulConfig, Config} from '../types.js';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import {getApiKey, getEnvironments, getPreviewApiKey, getSpaces} from './contentful.js';

/**
 * Log info
 * @param {String} str Info text
 */
export const logInfo = (str: string) => {
  console.log(chalk.cyan(str));
};

/**
 * Log error
 * @param {Error} error Error object
 */
export const logError = (error: Error) => {
  const {
    message, stack,
  } = error;
  console.error(chalk.red('\nError:'), message);
  if (stack) {
    console.log(stack);
  }
};

/**
 * Render confirm message to the console
 * @param {String} message Error object
 * @param {Boolean} defaultValue Error object
 * @returns {Boolean} Confirm value
 */
export const confirm = async (message: string, defaultValue?: boolean) => {
  const question: QuestionCollection<{value: boolean}> = [
    {
      type: 'confirm',
      name: 'value',
      message,
      default: Boolean(defaultValue),
    },
  ];
  const answers = await inquirer.prompt(question);

  return Boolean(answers.value);
};

type Questions = QuestionCollection<Config>;

const getPromts = (data: Partial<Config>): Questions => [
  {
    type: 'list',
    name: 'spaceId',
    message: 'Space ID',
    choices: async answers => {
      const spaces = await getSpaces({...data, ...answers} as ContentfulConfig);
      return spaces.map(space => ({
        name: `${space.name} (${space.sys.id})`,
        value: space.sys.id,
      }));
    },
    default() {
      return data.spaceId;
    },
  },
  {
    type: 'list',
    name: 'environmentId',
    message: 'Environment Id',
    choices: async answers => {
      const environments = await getEnvironments({...data, ...answers} as ContentfulConfig);
      return environments.map(environment => environment.sys.id);
    },
    default() {
      return data.environmentId;
    },
  },
  {
    type: 'input',
    name: 'accessToken',
    message: 'Content Delivery API - access token',
    when(answers) {
      return Boolean(answers.spaceId) || Boolean(data.spaceId);
    },
    async default(answers) {
      return data.accessToken || getApiKey({...data, ...answers});
    },
  },
  {
    type: 'input',
    name: 'previewAccessToken',
    message: 'Content Preview API - access token',
    when(answers) {
      return Boolean(answers.spaceId) || Boolean(data.spaceId);
    },
    async default(answers) {
      return data.previewAccessToken || getPreviewApiKey({...data, ...answers});
    },
  },
];

/**
 * Ask all promts and use values in data as default
 * @param {Object} data Data to check
 * @returns {Object} Object with the answers
 */
export const askAll = async (data: Partial<Config> = {}): Promise<Config> => {
  console.log('Please verify the following options');
  const answers = await inquirer.prompt(getPromts(data));
  answers.directory = path.resolve(process.cwd(), answers.directory || data.directory);

  return {...data, ...answers};
};

/**
 * Ask missing promts in data
 * @param {Object} data Data to check
 * @returns {Object} Object with the answers
 */
export const askMissing = async (data: Partial<Config> = {}): Promise<Config> => {
  const missing = Array.prototype.filter.call(getPromts(data), ({name}) => !data[name]) as Questions;
  const answers = await inquirer.prompt(missing);

  return {...data, ...answers};
};
