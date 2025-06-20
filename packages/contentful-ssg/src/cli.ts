#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call */

/* eslint-env node */
import chalk from 'chalk';
import { Command } from 'commander';
import { type QueryOptions } from 'contentful-management/types.js';
import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import { asyncExitHook, gracefulExit } from 'exit-hook';
import { existsSync } from 'fs';
import { outputFile } from 'fs-extra';
import { readFile } from 'fs/promises';
import path from 'path';
import prettier from 'prettier';
import { run } from './index.js';
import { initializeCache } from './lib/cf-cache.js';
import { ALL_PROMPTS, getConfig } from './lib/config.js';
import { omitKeys } from './lib/object.js';
import { confirm, logError } from './lib/ui.js';
import { type Config, type ContentfulConfig, type RunResult } from './types.js';

const env = dotenv.config();
dotenvExpand.expand(env);

const parseQuery = (query: string): QueryOptions => {
  if (!query) {
    return {};
  }

  const params = new URLSearchParams(query);
  return Object.fromEntries(params.entries());
};

const parseFetchArgs = (cmd: {
  preview: boolean;
  verbose: boolean;
  ignoreErrors: boolean;
  query: string;
  cwd?: string;
  config?: string;
}): Partial<Config> & { cwd?: string; configFile?: string } => ({
  preview: cmd.preview,
  verbose: cmd.verbose,
  ignoreErrors: cmd.ignoreErrors,
  query: parseQuery(cmd.query),
  cwd: cmd?.cwd || process.cwd(),
  configFile: cmd?.config,
});

type CommandError = Error & {
  errors?: Error[];
};
const errorHandler = (error: CommandError, silence: boolean) => {
  if (!silence) {
    const { errors } = error;
    logError(error);
    (errors || []).forEach((error) => {
      logError(error);
    });
  }

  gracefulExit(1);
};

const actionRunner =
  (fn, log = true) =>
  (...args) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    fn(...args).catch((error) => {
      errorHandler(error, !log);
    });
const program = new Command();
program
  .command('init')
  .description('Initialize contentful-ssg')
  .option('--typescript', 'Initialize typescript config')
  .option(
    '--config <configFile>',
    'Use this configuration, overriding other config options if present',
  )
  .option('--cwd <directory>', 'Working directory. Defaults to process.cwd()')
  .action(
    actionRunner(async (cmd: { typescript?: boolean; cwd?: string; config?: string }) => {
      const useTypescript = Boolean(cmd?.typescript ?? false);
      const cwd = cmd?.cwd ?? process.cwd();
      const configFile = cmd?.config;
      const r = await getConfig(
        { cwd, configFile },
        {
          prompt: ALL_PROMPTS,
        },
      );

      const { config } = r;

      const environmentConfig = r.layers.find((layer) => layer?.meta?.type === 'env')?.config;

      const filePath =
        configFile || path.join(cwd, `contentful-ssg.config.${useTypescript ? 'ts' : 'js'}`);
      const prettierOptions = await prettier.resolveConfig(filePath);
      if (config.directory?.startsWith('/')) {
        config.directory = path.relative(cwd, config.directory);
      }

      const environmentKeys: Array<keyof ContentfulConfig> = Object.keys(
        environmentConfig || {},
      ) as Array<keyof ContentfulConfig>;

      // Update .env file
      if (environmentConfig && existsSync('.env')) {
        const envSource = await readFile('.env', 'utf8');
        const nextEnvSource = envSource
          .replace(/(CONTENTFUL_SPACE_ID\s*=\s*['"]?)[^'"]*(['"]?)/, `$1${config.spaceId}$2`)
          .replace(
            /(CONTENTFUL_ENVIRONMENT_ID\s*=\s*['"]?)[^'"]*(['"]?)/,
            `$1${config.environmentId}$2`,
          )
          .replace(
            /(CONTENTFUL_MANAGEMENT_TOKEN\s*=\s*['"]?)[^'"]*(['"]?)/,
            `$1${config.managementToken}$2`,
          )
          .replace(
            /(CONTENTFUL_PREVIEW_TOKEN\s*=\s*['"]?)[^'"]*(['"]?)/,
            `$1${config.previewAccessToken}$2`,
          )
          .replace(
            /(CONTENTFUL_DELIVERY_TOKEN\s*=\s*['"]?)[^'"]*(['"]?)/,
            `$1${config.accessToken}$2`,
          );

        await outputFile('.env', nextEnvSource);
      }

      const cleanedConfig = omitKeys(
        config,
        'preview',
        'verbose',
        'rootDir',
        'resolvedPlugins',
        'host',
        'managementToken',
        ...environmentKeys,
      );

      let content = '';
      if (useTypescript || filePath.endsWith('.ts')) {
        content = await prettier.format(
          `import {Config} from '@jungvonmatt/contentful-ssg';
        export default <Config>${JSON.stringify(cleanedConfig)}`,
          {
            parser: 'typescript',
            ...prettierOptions,
          },
        );
      } else if (filePath.endsWith('.js')) {
        content = await prettier.format(`module.exports = ${JSON.stringify(cleanedConfig)}`, {
          parser: 'babel',
          ...prettierOptions,
        });
      }

      if (filePath.endsWith('.js') || filePath.endsWith('.ts')) {
        let writeFile = true;
        if (existsSync(filePath)) {
          writeFile = await confirm(
            `Config file already exists. Overwrite?\n\n${chalk.reset(content)}`,
          );
        } else {
          writeFile = await confirm(
            `Please verify your settings:\n\n${chalk.reset(content)}`,
            true,
          );
        }

        if (writeFile) {
          await outputFile(filePath, content);
          console.log(`\nConfiguration saved to ${chalk.cyan(path.relative(cwd, filePath))}`);
        }
      }
    }),
  );

program
  .command('fetch')
  .description('Fetch content objects')
  .option('-p, --preview', 'Fetch with preview mode')
  .option('-v, --verbose', 'Verbose output')
  .option(
    '--config <configFile>',
    'Use this configuration, overriding other config options if present',
  )
  .option('--cwd <directory>', 'Working directory. Defaults to process.cwd()')
  .option('--sync', 'cache sync data')
  .option('--query <query>', 'Query used to fetch contentful entries')
  .option('--ignore-errors', 'No error return code when transform has errors')
  .action(
    actionRunner(async (cmd) => {
      const r = await getConfig(parseFetchArgs(cmd || {}));
      const { config } = r;
      const cache = initializeCache(config);

      if (cmd.sync && cmd.query) {
        console.log(
          chalk.red(
            '\nCustom Contentful queries are not supported when using sync. Query argument will be ignored.\n',
          ),
        );
      }

      let prev: RunResult;
      if (cmd.sync && cache.hasSyncState()) {
        prev = await cache.getSyncState();
      } else if (!cmd.sync) {
        await cache.reset();
      }

      prev = await run({ ...config, sync: Boolean(cmd.sync) }, prev);

      if (cmd.sync) {
        await cache.setSyncState(prev);
      }
    }),
  );

program
  .command('watch')
  .description('Fetch content objects && watch for changes')
  .option('-p, --preview', 'Fetch with preview mode')
  .option('-v, --verbose', 'Verbose output')
  .option(
    '--config <configFile>',
    'Use this configuration, overriding other config options if present',
  )
  .option('--cwd <directory>', 'Working directory. Defaults to process.cwd()')
  .option('--url <url>', 'Webhook url.\nCan also be set via environment variable CSSG_WEBHOOK_URL')
  .option('--no-cache', "Don't cache sync data")
  .option('--poll', 'Use polling (usefull when ngrok tunnel is not an option)')
  .option('--poll-intervall <intervall>', 'Change default intervall of 10000ms', '10000')
  .option(
    '--port <port>',
    'Overwrite internal listener port. Useful for running the watcher in an environment with a single public port and a proxy configuration.\nCan also be set via environment variable CSSG_WEBHOOK_PORT',
  )
  .option('--ignore-errors', 'No error return code when transform has errors')
  .action(
    actionRunner(async (cmd) => {
      const r = await getConfig(parseFetchArgs(cmd || {}));
      const { config } = r;
      const useCache = Boolean(cmd?.cache ?? true);
      const cache = initializeCache(config);

      let prev: RunResult;
      if (useCache && cache.hasSyncState()) {
        prev = await cache.getSyncState();
      } else if (!useCache) {
        await cache.reset();
      }

      prev = await run({ ...config, sync: true }, prev);
      if (useCache) {
        await cache.setSyncState(prev);
      }

      // Handle cache on exit
      asyncExitHook(
        async () => {
          try {
            await Promise.all([
              !useCache && cache.reset(),
              useCache && prev && cache.setSyncState(prev),
            ]);
          } catch (error: unknown) {
            console.error('\nError:', error);
          }
        },
        {
          wait: 2000,
        },
      );

      if (cmd.poll) {
        const poll = () => {
          setTimeout(
            () => {
              (async () => {
                prev = await run({ ...config, sync: true }, prev);
                if (useCache) {
                  await cache.setSyncState(prev);
                }

                poll();
              })();
            },
            parseInt(cmd.pollIntervall, 10),
          );
        };

        poll();
      } else {
        console.log(
          chalk.red(
            '\nLocal tunneling has been disabled due to security issues with the used package.\nPlease use "--poll" instead',
          ),
        );
        // Let port = await getPort({ port: 1314 });

        // if (process.env.CSSG_WEBHOOK_URL || cmd.url) {
        //   const url = new URL(process.env.CSSG_WEBHOOK_URL || cmd.url);
        //   if (url.port) {
        //     port = parseInt(url.port, 10);
        //   } else {
        //     port = url.protocol === 'https:' ? 443 : 80;
        //   }
        // }

        // if (process.env.CSSG_WEBHOOK_PORT || cmd.port) {
        //   port = parseInt(process.env.CSSG_WEBHOOK_PORT || cmd.port, 10);
        // }

        // const app = getApp(async () => {
        //   prev = await run({ ...verified, sync: true }, prev);
        //   await cache.setSyncState(prev);
        // });

        // console.log();

        // const server = app.listen(port, () => {
        //   console.log(`  Internal server listening on port :${chalk.cyan(port)}`);
        // });

        // const stopServer = async () =>
        //   new Promise((resolve, reject) => {
        //     server.close((err) => {
        //       if (err) {
        //         reject(err);
        //       } else {
        //         resolve(true);
        //       }
        //     });
        //   });

        // let url = process.env.CSSG_WEBHOOK_URL || (cmd.url as string);
        // let tunnel: Awaited<ReturnType<typeof localtunnel>>;
        // if (!url) {
        //   tunnel = (await localtunnel({ port })) as {
        //     url: string;
        //     close: () => Promise<void>;
        //   };
        //   url = tunnel.url as string;
        // }

        // console.log(`  Listening for hooks on ${chalk.cyan(url)}`);
        // const webhook = await addWatchWebhook(verified as ContentfulConfig, url);

        // // Remove webhook & stop server on exit
        // asyncExitHook(
        //   async () => {
        //     try {
        //       const results = await Promise.allSettled([
        //         webhook.delete(),
        //         stopServer(),
        //         tunnel?.close(),
        //       ]);
        //       results.forEach((result) => {
        //         if (result.status === 'rejected') {
        //           console.error('\nError:', result?.reason?.message ?? result?.reason);
        //         }
        //       });
        //     } catch (error: unknown) {
        //       console.error('\nError:', error);
        //     }
        //   },
        //   {
        //     wait: 2000,
        //   },
        // );
      }
    }),
  );

program.parse(process.argv);
