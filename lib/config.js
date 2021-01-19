const path = require('path');
const inquirer = require('inquirer');
const mergeOptions = require('merge-options').bind({ ignoreUndefined: true });
const { cosmiconfig } = require('cosmiconfig');
const { removeEmpty } = require('./utils');
const { getSpaces, getEnvironments, getApiKey, getPreviewApiKey } = require('./contentful');

/**
 * Get configuration
 * @param {Object} args
 */
const getConfig = async (args) => {
  const defaultOptions = {
    environmentId: 'master',
    host: 'api.contentful.com',
    directory: path.resolve(process.cwd(), 'content'),
  };

  const environmentOptions = removeEmpty({
    spaceId: process.env.CONTENTFUL_SPACE_ID,
    managementToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN,
    environmentId: process.env.CONTENTFUL_ENVIRONMENT,
  });
  let contentfulCliOptions = {};
  try {
    // get configuration from contentful rc file (created by the contentful cli command)
    const explorer = cosmiconfig('contentful');
    const explorerResult = await explorer.search();
    if (explorerResult !== null) {
      const { config } = explorerResult || {};
      const { managementToken, activeSpaceId, activeEnvironmentId, host } = config || {};
      contentfulCliOptions = removeEmpty({
        spaceId: activeSpaceId,
        managementToken: managementToken,
        environmentId: activeEnvironmentId,
        host,
      });
    }
  } catch (error) {
    console.log('Error:', error.message);
    console.log(error);
  }

  let configFileOptions = {};
  try {
    // get configuration from migrations rc file
    const explorer = cosmiconfig('contentful-ssg');
    const explorerResult = await explorer.search();
    if (explorerResult !== null) {
      const { config, filepath } = explorerResult || {};

      configFileOptions = {
        directory: path.resolve(path.dirname(filepath || ''), args.directory || 'content'),
        ...(config || {}),
      };

      if (configFileOptions.directory && !path.isAbsolute(configFileOptions.directory)) {
        configFileOptions.directory = path.resolve(path.dirname(filepath || ''), configFileOptions.directory);
      }
    }
  } catch (error) {
    console.log('Error:', error.message);
  }

  return mergeOptions(defaultOptions, contentfulCliOptions, environmentOptions, configFileOptions, args || {});
};

const getPromts = (data) => {
  return [
    {
      type: 'list',
      name: 'spaceId',
      message: 'Space ID',
      choices: async (answers) => {
        const spaces = await getSpaces({ ...data, ...answers });
        return spaces.map((space) => ({
          name: `${space.name} (${space.sys.id})`,
          value: space.sys.id,
        }));
      },
      default: function () {
        return data.spaceId;
      },
    },
    {
      type: 'list',
      name: 'environmentId',
      message: 'Environment Id',
      choices: async (answers) => {
        const environments = await getEnvironments({ ...data, ...answers });
        return environments.map((environment) => environment.sys.id);
      },
      default: function () {
        return data.environmentId;
      },
    },
    {
      type: 'input',
      name: 'accessToken',
      message: 'Content Delivery API - access token',
      when: function (answers) {
        return Boolean(answers.spaceId) || Boolean(data.spaceId);
      },
      default: async function (answers) {
        return data.accessToken || (await getApiKey({ ...data, ...answers }));
      },
    },
    {
      type: 'input',
      name: 'previewAccessToken',
      message: 'Content Preview API - access token',
      when: function (answers) {
        return Boolean(answers.spaceId) || Boolean(data.spaceId);
      },
      default: async function (answers) {
        return data.previewAccessToken || (await getPreviewApiKey({ ...data, ...answers }));
      },
    },
  ];
};

/**
 * Ask all promts and use values in data as default
 * @param {Object} data Data to check
 * @returns {Object} Object with the answers
 */
const askAll = async (data = {}) => {
  console.log('Please verify the following options');
  const answers = await inquirer.prompt(getPromts(data));
  answers.directory = path.resolve(process.cwd(), answers.directory || data.directory);

  return { ...data, ...answers };
};

/**
 * Ask missing promts in data
 * @param {Object} data Data to check
 * @returns {Object} Object with the answers
 */
const askMissing = async (data = {}) => {
  const missingPromts = getPromts(data).filter(({ name }) => !data[name]);
  const answers = await inquirer.prompt(missingPromts);

  return { ...data, ...answers };
};

module.exports.getConfig = getConfig;
module.exports.askAll = askAll;
module.exports.askMissing = askMissing;
