import {register} from '@swc-node/register/register';
import {cosmiconfig, Loader} from 'cosmiconfig';
import mergeOptionsModule from 'merge-options';
import {createRequire} from 'module';
import {isAbsolute, resolve} from 'path';
import type {Config, ContentfulConfig, Hooks, InitialConfig, KeyValueMap, PluginInfo, PluginModule} from '../types.js';
import {removeEmpty} from './object.js';

const require = createRequire(import.meta.url);

const typescriptLoader: Loader = async (filePath: string): Promise<any> => {
  register({format: 'esm', extensions: ['.ts', '.tsx', '.mts']});
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
  const configModule = require(filePath);
  return (configModule.default || configModule);
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const mergeOptions = mergeOptionsModule.bind({ignoreUndefined: true});

const resolvePlugin = async (plugin: string | PluginInfo): Promise<Hooks> => {
  const pluginName = typeof plugin === 'string' ? plugin : plugin.resolve;
  const pluginOptions = typeof plugin === 'string' ? {} : plugin.options || {};
  const resolvedPath = require.resolve(pluginName);

  const pluginModule = await import(resolvedPath) as PluginModule;

  if (typeof pluginModule.default === 'function') {
    return pluginModule.default(pluginOptions || {});
  }

  return (pluginModule.default || {});
};

const loadConfig = async (moduleName: string): Promise<KeyValueMap> => {
  const explorer = cosmiconfig(moduleName, {
    searchPlaces: [
      'package.json',
      `.${moduleName}rc`,
      `.${moduleName}rc.json`,
      `.${moduleName}rc.yaml`,
      `.${moduleName}rc.yml`,
      `.${moduleName}rc.js`,
      `${moduleName}.config.ts`,
      `${moduleName}.config.js`,
    ],
    loaders: {
      '.ts': typescriptLoader,
    },
  });

  const result = await explorer.search();

  return (result?.config ?? {}) as KeyValueMap;
};

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
    spaceId: process.env.CONTENTFUL_SPACE_ID!,
    environmentId: process.env.CONTENTFUL_ENVIRONMENT_ID!,
    managementToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN!,
    previewAccessToken: process.env.CONTENTFUL_PREVIEW_TOKEN!,
    accessToken: process.env.CONTENTFUL_DELIVERY_TOKEN!,
  });
  let contentfulCliOptions: Partial<ContentfulConfig> = {};

  try {
    // Get configuration from contentful rc file (created by the contentful cli command)
    const contentfulConfig = await loadConfig('contentful');
    const {managementToken, activeSpaceId, activeEnvironmentId, host} = contentfulConfig;

    contentfulCliOptions = removeEmpty({
      spaceId: activeSpaceId as string,
      managementToken: managementToken as string,
      environmentId: activeEnvironmentId as string,
      host: host as string,
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
    configFileOptions = await loadConfig('contentful-ssg');
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

