// import { cosmiconfig } from 'cosmiconfig';
import load from '@proload/core';
import json from '@proload/plugin-json';
import rc from '@proload/plugin-rc';
import typescript from '@proload/plugin-typescript';
import inquirer from 'inquirer';
import mergeOptionsModule from 'merge-options';
import path from 'path';
import { getApiKey, getEnvironments, getPreviewApiKey, getSpaces } from './contentful.js';
import { removeEmpty } from './utils.js';

load.use([json, typescript, rc]);
// load.use([typescript]);

const mergeOptions = mergeOptionsModule.bind({ ignoreUndefined: true });
/**
 * Get configuration
 * @param {Object} args
 */
export const getConfig = async (arguments_) => {
  const defaultOptions = {
    environmentId: 'master',
    host: 'api.contentful.com',
    directory: path.resolve(process.cwd(), 'content'),
  };

  const environmentOptions = removeEmpty({
    spaceId: process.env.CONTENTFUL_SPACE_ID,
    environmentId: process.env.CONTENTFUL_ENVIRONMENT_ID,
    managementToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN,
    previewAccessToken: process.env.CONTENTFUL_PREVIEW_TOKEN,
    accessToken: process.env.CONTENTFUL_DELIVERY_TOKEN,
  });
  let contentfulCliOptions = {};
  try {
    // get configuration from contentful rc file (created by the contentful cli command)
    // const explorer = cosmiconfig('contentful');
    // const explorerResult = await explorer.search();
    const explorerResult = await load('contentful', {
      accept(fileName) {
        return fileName.startsWith('.contentfulrc');
      },
    });
    if (explorerResult !== null) {
      const { value } = explorerResult || {};
      const { managementToken, activeSpaceId, activeEnvironmentId, host } = value || {};
      contentfulCliOptions = removeEmpty({
        spaceId: activeSpaceId,
        managementToken: managementToken,
        environmentId: activeEnvironmentId,
        host,
      });
    }
  } catch (error) {
    console.log('Error (Contentful):', error.message);
    console.log(error);
  }

  let configFileOptions = {};
  try {
    // get configuration from contentful-ssg rc file
    // const explorer = cosmiconfig('contentful-ssg');
    // const explorerResult = await explorer.search();
    const explorerResult = await load('contentful-ssg');
    if (explorerResult !== null) {
      const { value, filePath } = explorerResult || {};

      configFileOptions = {
        directory: path.resolve(path.dirname(filePath || ''), arguments_.directory || 'content'),
        ...(value || {}),
      };

      if (configFileOptions.directory && !path.isAbsolute(configFileOptions.directory)) {
        configFileOptions.directory = path.resolve(path.dirname(filePath || ''), configFileOptions.directory);
      }
    }
  } catch (error) {
    console.log('Error:', error.message);
  }

  return mergeOptions(defaultOptions, contentfulCliOptions, environmentOptions, configFileOptions, arguments_ || {});
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
export const askAll = async (data = {}) => {
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
export const askMissing = async (data = {}) => {
  const missingPromts = getPromts(data).filter(({ name }) => !data[name]);
  const answers = await inquirer.prompt(missingPromts);

  return { ...data, ...answers };
};
