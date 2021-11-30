import { register } from '@swc-node/register/register';
import chalk from 'chalk';
import { cosmiconfig, Loader } from 'cosmiconfig';
import type { CosmiconfigResult } from 'cosmiconfig/dist/types';
import mergeOptionsModule from 'merge-options';
import { dirname, isAbsolute, resolve } from 'path';
import slash from 'slash';
import type {
  Config,
  ContentfulConfig,
  ContentfulRcConfig,
  Hooks,
  KeyValueMap,
  PluginInfo,
  PluginModule,
} from '../types.js';
import { createRequire } from './create-require.js';
import { isObject, removeEmpty } from './object.js';

const typescriptLoader: Loader = async (filePath: string): Promise<any> => {
  register({ format: 'esm', extensions: ['.ts', '.tsx', '.mts'] });

  const require = createRequire();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
  const configModule = require(filePath);
  return configModule.default || configModule;
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const mergeOptions = mergeOptionsModule.bind({ ignoreUndefined: true });

const resolvePlugin = async (
  plugin: string | [string, KeyValueMap] | PluginInfo,
  config: Partial<Config>
): Promise<Hooks> => {
  let pluginName: string;
  let pluginOptions: KeyValueMap;
  if (typeof plugin === 'string') {
    pluginName = plugin;
    pluginOptions = {};
  } else if (Array.isArray(plugin)) {
    pluginName = plugin[0];
    pluginOptions = plugin[1] || {};
  } else {
    pluginName = plugin.resolve;
    pluginOptions = plugin.options || {};
  }

  const { rootDir, verbose } = config;

  try {
    const requireSource =
      rootDir === null ? createRequire() : createRequire(`${rootDir}/:internal:`);

    // If the path is absolute, resolve the directory of the internal plugin,
    // otherwise resolve the directory containing the package.json
    const resolvedPath = slash(requireSource.resolve(pluginName));
    const pluginModule = (await import(resolvedPath)) as PluginModule;
    let pluginDefaultHooks = {};

    // Resolve default export (could be function or an object)
    if (typeof pluginModule.default === 'function') {
      pluginDefaultHooks = await pluginModule.default(pluginOptions || {});
    } else if (isObject(pluginModule.default)) {
      pluginDefaultHooks = pluginModule.default;
    }

    // Add named exports
    const pluginHooks: Hooks = { ...(pluginDefaultHooks || {}), ...(pluginModule || {}) };

    return pluginHooks;
  } catch (error: unknown) {
    if (verbose) {
      console.error(chalk.red(`Plugin "${pluginName} threw the following error:`));
      console.error(error);
    } else {
      console.error(
        chalk.red(
          `There was a problem loading plugin "${pluginName}". Perhaps you need to install its package?\nUse --verbose to see actual error.`
        )
      );
    }

    process.exit(1);
  }
};

const loadConfig = async (moduleName: string): Promise<CosmiconfigResult> => {
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

export const getEnvironmentConfig = (strict = true): ContentfulConfig =>
  removeEmpty(
    {
      spaceId: process.env.CONTENTFUL_SPACE_ID!,
      environmentId: process.env.CONTENTFUL_ENVIRONMENT_ID!,
      managementToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN!,
      previewAccessToken: process.env.CONTENTFUL_PREVIEW_TOKEN!,
      accessToken: process.env.CONTENTFUL_DELIVERY_TOKEN!,
    },
    strict
  );

/**
 * Get configuration
 * @param {Object} args
 */
export const getConfig = async (args?: Partial<Config>): Promise<Config> => {
  const defaultOptions: Config = {
    environmentId: 'master',
    host: 'api.contentful.com',
    directory: resolve(process.cwd(), 'content'),
    plugins: [],
    resolvedPlugins: [],
  };

  const environmentOptions = getEnvironmentConfig(false);
  let contentfulCliOptions: Partial<ContentfulConfig> = {};

  try {
    // Get configuration from contentful rc file (created by the contentful cli command)
    const contentfulConfig = await loadConfig('contentful');
    if (contentfulConfig && !contentfulConfig.isEmpty) {
      const { managementToken, activeSpaceId, activeEnvironmentId, host } =
        contentfulConfig.config as ContentfulRcConfig;

      contentfulCliOptions = removeEmpty(
        {
          spaceId: activeSpaceId,
          managementToken,
          environmentId: activeEnvironmentId,
          host,
        },
        false
      );
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

  let configFileOptions: Partial<Config> = {};
  args.rootDir = process.cwd();
  try {
    // Get configuration from contentful-ssg rc file
    const configFile = await loadConfig('contentful-ssg');
    if (configFile && !configFile.isEmpty) {
      configFileOptions = configFile.config as Partial<Config>;
      args.rootDir = dirname(configFile.filepath);
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
  ) as Config;

  const resolvedPlugins = [
    ...result.resolvedPlugins,
    ...(await Promise.all(
      (result.plugins || []).map(async (plugin) => resolvePlugin(plugin, result))
    )),
  ];
  return { ...result, resolvedPlugins };
};
