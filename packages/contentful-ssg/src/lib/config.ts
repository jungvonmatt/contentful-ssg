import chalk from 'chalk';
import { gracefulExit } from 'exit-hook';
import { resolve } from 'path';
import slash from 'slash';
import type {
  Config,
  ContentfulConfig,
  Hooks,
  KeyValueMap,
  PluginInfo,
  PluginModule,
} from '../types.js';
import { reduceAsync } from './array.js';
import { createRequire } from './create-require.js';
import { isObject, removeEmpty } from './object.js';

import { getPromts, loadContentfulConfig } from '@jungvonmatt/contentful-config';

const resolvePlugin = async (
  plugin: string | [string, KeyValueMap] | PluginInfo,
  config: Partial<Config>,
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
          `There was a problem loading plugin "${pluginName}". Perhaps you need to install its package?\nUse --verbose to see actual error.`,
        ),
      );
    }

    gracefulExit(1);
  }
};

export const getEnvironmentConfig = (strict = true): ContentfulConfig =>
  removeEmpty(
    {
      spaceId: process.env.CONTENTFUL_SPACE_ID,
      environmentId: process.env.CONTENTFUL_ENVIRONMENT_ID,
      managementToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN,
      previewAccessToken: process.env.CONTENTFUL_PREVIEW_TOKEN,
      accessToken: process.env.CONTENTFUL_DELIVERY_TOKEN,
    },
    strict,
  );

export const ALL_PROMPTS = getPromts({}).map((p) => p.name);

/**
 * Get configuration
 * @param {Object} args
 */
export const getConfig = async (
  args: Partial<Config> & { configFile?: string; cwd?: string } = {},
  required: Array<Exclude<keyof Config, number | symbol>> = ALL_PROMPTS as Array<
    Exclude<keyof Config, number | symbol>
  >,
): Promise<Config> => {
  const { configFile, cwd, ...overrides } = args;

  const loaderResult = await loadContentfulConfig<Config>('contentful-ssg', {
    overrides,
    required,
    defaultConfig: {
      environmentId: 'master',
      host: 'api.contentful.com',
      directory: resolve(process.cwd(), 'content'),
      managedDirectories: [],
      plugins: [],
      resolvedPlugins: [],
    },
  });

  const { config } = loaderResult;
  config.directory = resolve(cwd || process.cwd(), config.directory);

  const resolvedPlugins = [
    ...config.resolvedPlugins,
    ...(await Promise.all(
      (config.plugins || []).map(async (plugin) => resolvePlugin(plugin, config)),
    )),
  ];

  config.managedDirectories = [...config.managedDirectories, config.directory];

  const hookedConfig = await reduceAsync(
    resolvedPlugins.filter((plugin) => typeof plugin.config === 'function'),
    async (prev: Config, hooks) => {
      const hook = hooks.config;
      return hook(prev);
    },
    config,
  );

  return { ...hookedConfig, ...config, resolvedPlugins };
};
