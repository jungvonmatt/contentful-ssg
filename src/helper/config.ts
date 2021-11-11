/* eslint-disable complexity */
import type {ContentfulConfig, PluginInfo, Hooks, Config, InitialConfig, KeyValueMap} from '../types.js';
import { createRequire } from 'module';
import {isAbsolute, resolve} from 'path';
import {cosmiconfig} from 'cosmiconfig';
import TypeScriptLoader from '@endemolshinegroup/cosmiconfig-typescript-loader';
import mergeOptionsModule from 'merge-options';
import {removeEmpty} from './object.js';

//

// load.use([json, typescript, rc]);

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const mergeOptions = mergeOptionsModule.bind({ignoreUndefined: true});

const resolvePlugin = async (plugin: string | PluginInfo): Promise<Hooks> => {
  const pluginName = typeof plugin === 'string' ? plugin : plugin.resolve;
  const pluginOptions = typeof plugin === 'string' ? {} : plugin.options || {};
  const require = createRequire(import.meta.url);
  const resolvedPath = require.resolve(pluginName);

  const module = await import(resolvedPath) as Hooks | ((...args: unknown[]) => Hooks);

  return typeof module === 'function' ? module(pluginOptions || {}) : module || {};
};

const loadConfig = async (moduleName:string): Promise<KeyValueMap> => {
  const explorer = cosmiconfig(moduleName, {
    searchPlaces: [
      'package.json',
      `.${moduleName}rc`,
      `.${moduleName}rc.json`,
      `.${moduleName}rc.yaml`,
      `.${moduleName}rc.yml`,
      `.${moduleName}rc.ts`,
      `.${moduleName}rc.js`,
      `${moduleName}.config.ts`,
      `${moduleName}.config.js`,
    ],
    loaders: {
      '.ts': TypeScriptLoader,
    },
  });

  const result = await explorer.search();

  return result?.config ?? {};
}

/**
 * Get configuration
 * @param {Object} args
 */
export const getConfig = async (args?: Partial<InitialConfig>): Promise<Config> => {
  const defaultOptions: InitialConfig = {
    environmentId: 'master',
    host: 'api.contentful.com',
    directory: resolve(process.cwd(), 'content'),
    plugins: [],
  };

  const environmentOptions: ContentfulConfig = removeEmpty({
    spaceId: process.env.CONTENTFUL_SPACE_ID || '',
    environmentId: process.env.CONTENTFUL_ENVIRONMENT_ID || '',
    managementToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN || '',
    previewAccessToken: process.env.CONTENTFUL_PREVIEW_TOKEN || '',
    accessToken: process.env.CONTENTFUL_DELIVERY_TOKEN || '',
  });
  let contentfulCliOptions: Partial<ContentfulConfig> = {};

  try {
    // Get configuration from contentful rc file (created by the contentful cli command)
    const contentfulConfig = await loadConfig('contentful');
    const {managementToken, activeSpaceId, activeEnvironmentId, host} = contentfulConfig;
    contentfulCliOptions = removeEmpty({
      spaceId: activeSpaceId,
      managementToken,
      environmentId: activeEnvironmentId,
      host,
    });
  } catch (error: unknown) {
    if (typeof error === 'string') {
      console.log('Error (Contentful):', error);
    } else if (error instanceof Error) {
      console.log('Error (Contentful):', error.message);
    } else {
      console.log(error);
    }
  }

  let configFileOptions: Partial<InitialConfig> = {};
  try {
    // Get configuration from contentful-ssg rc file
    const configFileOptions = await loadConfig('contentful-ssg');
    if (configFileOptions.directory && !isAbsolute(configFileOptions.directory)) {
      configFileOptions.directory = resolve(process.cwd(), configFileOptions.directory);
    }
  } catch (error: unknown) {
    if (typeof error === 'string') {
      console.log('Error:', error);
    } else if (error instanceof Error) {
      console.log('Error:', error.message);
    } else {
      console.log(error);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const result = mergeOptions(defaultOptions, contentfulCliOptions, environmentOptions, configFileOptions, args || {}) as InitialConfig;
  const plugins = await Promise.all((result.plugins || []).map(async plugin => resolvePlugin(plugin as string | PluginInfo)));

  return {...result, plugins};
};

