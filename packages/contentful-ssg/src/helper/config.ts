import path from 'path';
import { register } from '@swc-node/register/register';
import { cosmiconfig, Loader } from 'cosmiconfig';
import mergeOptionsModule from 'merge-options';
import { createRequire } from 'module';
import slash from 'slash';
import { isAbsolute, resolve } from 'path';
import type {
  Config,
  ContentfulConfig,
  Hooks,
  InitialConfig,
  KeyValueMap,
  PluginInfo,
  PluginModule,
} from '../types.js';
import { removeEmpty } from './object.js';
import type { CosmiconfigResult } from 'cosmiconfig/dist/types';
import chalk from 'chalk';

const require = createRequire(import.meta.url);

const typescriptLoader: Loader = async (filePath: string): Promise<any> => {
  register({ format: 'esm', extensions: ['.ts', '.tsx', '.mts'] });
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
  const configModule = require(filePath);
  return configModule.default || configModule;
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const mergeOptions = mergeOptionsModule.bind({ ignoreUndefined: true });

const resolvePlugin = async (plugin: string | PluginInfo, config: Partial<Config>): Promise<Hooks> => {
  const pluginName = typeof plugin === 'string' ? plugin : plugin.resolve;
  const pluginOptions = typeof plugin === 'string' ? {} : plugin.options || {};
  const {rootDir, verbose} = config;

  try {
    const requireSource = rootDir !== null ? createRequire(`${rootDir}/:internal:`) : require;

    // If the path is absolute, resolve the directory of the internal plugin,
    // otherwise resolve the directory containing the package.json
    const resolvedPath = slash(requireSource.resolve(pluginName));
    const pluginModule = (await import(resolvedPath)) as PluginModule;

    if (typeof pluginModule.default === 'function') {
      return pluginModule.default(pluginOptions || {});
    }

    return pluginModule.default || {};
  } catch (error: unknown) {
    if (verbose) {
      console.error(chalk.red(`Plugin "${pluginName} threw the following error:`))
      console.error(error);
    } else {
      console.error(chalk.red(
        `There was a problem loading plugin "${pluginName}". Perhaps you need to install its package?\nUse --verbose to see actual error.`
      ));
    }

    throw new Error(`unreachable`);
  }
};

const loadConfig = (moduleName: string): Promise<CosmiconfigResult> => {
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

  return explorer.search();
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
    if (!contentfulConfig.isEmpty) {
      const { managementToken, activeSpaceId, activeEnvironmentId, host } = contentfulConfig.config;

      contentfulCliOptions = removeEmpty({
        spaceId: activeSpaceId as string,
        managementToken: managementToken as string,
        environmentId: activeEnvironmentId as string,
        host: host as string,
      });
    }
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
  args.rootDir = process.cwd();
  try {
    // Get configuration from contentful-ssg rc file
    const configFile =  await loadConfig('contentful-ssg');
    if (!configFile.isEmpty) {
      configFileOptions = configFile.config;
      args.rootDir = path.dirname(configFile.filepath);
      if (configFileOptions.directory && !isAbsolute(configFileOptions.directory)) {
        configFileOptions.directory = resolve(args.rootDir, configFileOptions.directory);
      }
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
  const result = mergeOptions(
    defaultOptions,
    contentfulCliOptions,
    environmentOptions,
    configFileOptions,
    args || {}
  ) as InitialConfig;
  const plugins = await Promise.all(
    (result.plugins || []).map(async (plugin) => resolvePlugin(plugin as string | PluginInfo, result))
  );
  return { ...result, plugins };
};
