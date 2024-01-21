import vm from 'vm';
import chalk from 'chalk';
import { transformSync, type Options } from '@swc/core';
import { gracefulExit } from 'exit-hook';
import { cosmiconfig, type Loader } from 'cosmiconfig';
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
  SandboxContext,
} from '../types.js';
import { reduceAsync } from './array.js';
import { createRequire } from './create-require.js';
import { isObject, removeEmpty } from './object.js';

const getContext = (filename: string): vm.Context => {
  const module: NodeModule = {
    exports: {},
    isPreloading: false,
    require: createRequire(dirname(filename)),
    id: '',
    filename,
    loaded: false,
    parent: undefined,
    children: [],
    path: dirname(filename),
    paths: [dirname(filename)],
  };

  const sandbox: SandboxContext = {
    module,
    exports: {},
    process: { env: process.env },
    require: module.require,
    __dirname: dirname(filename),
    __filename: filename,
  };
  vm.createContext(sandbox);

  return sandbox;
};

const getLoader =
  (syntax: Options['jsc']['parser']['syntax']) => (filename: string, content: string) => {
    const context = getContext(filename);
    const script = transformSync(content, {
      isModule: /\s(export|import)\s/.test(content),
      module: {
        type: 'commonjs',
      },
      cwd: dirname(filename),
      jsc: {
        parser: {
          syntax,
          dynamicImport: true,
        },
      },
    });

    const vmScript = new vm.Script(script.code);

    try {
      vmScript.runInContext(context, { filename, timeout: 10000 });
    } catch (error: unknown) {
      console.log(error);
    }

    // Handle module (even if the transpiled code should be commonjs exports)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    if (Object.keys(context?.module?.exports).length > 0) {
      const result = (context.module.exports?.default ?? context.module.exports) as Config;
      return { ...result };
    }

    // Handle commonjs export
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    if (Object.keys(context?.exports ?? {}).length > 0) {
      const result = (context.exports?.default ?? context.exports) as Config;

      return { ...result };
    }

    return {};
  };

const typescriptLoader: Loader = getLoader('typescript');
const ecmascriptLoader: Loader = getLoader('ecmascript');

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const mergeOptions = mergeOptionsModule.bind({ ignoreUndefined: true });

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

const loadConfig = async (moduleName: string): Promise<CosmiconfigResult> => {
  const explorer = cosmiconfig(moduleName, {
    searchStrategy: 'global',
    searchPlaces: [
      'package.json',
      `.${moduleName}rc`,
      `.${moduleName}rc.json`,
      `.${moduleName}rc.yaml`,
      `.${moduleName}rc.yml`,
      `.${moduleName}rc.js`,
      `${moduleName}.config.ts`,
      `${moduleName}.config.js`,
      `${moduleName}.config.cjs`,
      `${moduleName}.config.mjs`,
    ],
    loaders: {
      '.ts': typescriptLoader,
      '.js': ecmascriptLoader,
      '.cjs': ecmascriptLoader,
      '.mjs': ecmascriptLoader,
    },
  });

  return explorer.search();
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

/**
 * Get configuration
 * @param {Object} args
 */
export const getConfig = async (args: Partial<Config> = {}): Promise<Config> => {
  const defaultOptions: Config = {
    environmentId: 'master',
    host: 'api.contentful.com',
    directory: resolve(process.cwd(), 'content'),
    managedDirectories: [],
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
        false,
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
    args || {},
  ) as Config;

  const resolvedPlugins = [
    ...result.resolvedPlugins,
    ...(await Promise.all(
      (result.plugins || []).map(async (plugin) => resolvePlugin(plugin, result)),
    )),
  ];

  result.managedDirectories = [...result.managedDirectories, result.directory];

  const hookedConfig = await reduceAsync(
    resolvedPlugins.filter((plugin) => typeof plugin.config === 'function'),
    async (prev: Config, hooks) => {
      const hook = hooks.config;
      return hook(prev);
    },
    result,
  );

  return { ...hookedConfig, ...result, resolvedPlugins };
};
