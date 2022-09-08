#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-unsafe-call */

/* eslint-env node */
import exitHook from 'async-exit-hook';
import chalk from 'chalk';
import { Command } from 'commander';
import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import { existsSync } from 'fs';
import { outputFile } from 'fs-extra';
import { readFile } from 'fs/promises';
import getPort from 'get-port';
import ngrok from 'ngrok';
import path from 'path';
import prettier from 'prettier';
import { run } from './index.js';
import { initializeCache } from './lib/cf-cache.js';
import { getConfig, getEnvironmentConfig } from './lib/config.js';
import { addWatchWebhook } from './lib/contentful.js';
import { omitKeys } from './lib/object.js';
import { askAll, askMissing, confirm, logError } from './lib/ui.js';
import { getApp } from './server/index.js';
import { Config, ContentfulConfig, RunResult } from './types.js';

const env = dotenv.config();
dotenvExpand(env);

const parseFetchArgs = (cmd): Partial<Config> => ({
  preview: cmd.preview as boolean,
  verbose: cmd.verbose as boolean,
  ignoreErrors: cmd.ignoreErrors as boolean,
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

  process.exit(1);
};

const actionRunner =
  (fn, log = true) =>
  (...args) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    fn(...args).catch((error) => errorHandler(error, !log));
const program = new Command();
program
  .command('init')
  .description('Initialize contentful-ssg')
  .option('--typescript', 'Initialize typescript config')
  .action(
    actionRunner(async (cmd) => {
      const useTypescript = Boolean(cmd?.typescript ?? false);
      const config = await getConfig();
      const verified = await askAll(config);

      const environmentConfig = getEnvironmentConfig();

      const filePath = path.join(
        process.cwd(),
        `contentful-ssg.config.${useTypescript ? 'ts' : 'js'}`
      );
      const prettierOptions = await prettier.resolveConfig(filePath);
      if (verified.directory?.startsWith('/')) {
        verified.directory = path.relative(process.cwd(), verified.directory);
      }

      const environmentKeys: Array<keyof ContentfulConfig> = Object.keys(
        environmentConfig
      ) as Array<keyof ContentfulConfig>;

      // Update .env file
      if (environmentConfig && existsSync('.env')) {
        const envSource = await readFile('.env', 'utf8');
        const nextEnvSource = envSource
          .replace(/(CONTENTFUL_SPACE_ID\s*=\s*['"]?)[^'"]*(['"]?)/, `$1${verified.spaceId}$2`)
          .replace(
            /(CONTENTFUL_ENVIRONMENT_ID\s*=\s*['"]?)[^'"]*(['"]?)/,
            `$1${verified.environmentId}$2`
          )
          .replace(
            /(CONTENTFUL_MANAGEMENT_TOKEN\s*=\s*['"]?)[^'"]*(['"]?)/,
            `$1${verified.managementToken}$2`
          )
          .replace(
            /(CONTENTFUL_PREVIEW_TOKEN\s*=\s*['"]?)[^'"]*(['"]?)/,
            `$1${verified.previewAccessToken}$2`
          )
          .replace(
            /(CONTENTFUL_DELIVERY_TOKEN\s*=\s*['"]?)[^'"]*(['"]?)/,
            `$1${verified.accessToken}$2`
          );

        await outputFile('.env', nextEnvSource);
      }

      const cleanedConfig = omitKeys(
        verified,
        'preview',
        'verbose',
        'rootDir',
        'resolvedPlugins',
        'host',
        'managementToken',
        ...environmentKeys
      );

      let content = '';
      if (useTypescript) {
        content = prettier.format(
          `import {Config} from '@jungvonmatt/contentful-ssg';
        export default <Config>${JSON.stringify(cleanedConfig)}`,
          {
            parser: 'typescript',
            ...prettierOptions,
          }
        );
      } else {
        content = prettier.format(`module.exports = ${JSON.stringify(cleanedConfig)}`, {
          parser: 'babel',
          ...prettierOptions,
        });
      }

      let writeFile = true;
      if (existsSync(filePath)) {
        writeFile = await confirm(
          `Config file already exists. Overwrite?\n\n${chalk.reset(content)}`
        );
      } else {
        writeFile = await confirm(`Please verify your settings:\n\n${chalk.reset(content)}`, true);
      }

      if (writeFile) {
        await outputFile(filePath, content);
        console.log(
          `\nConfiguration saved to ${chalk.cyan(path.relative(process.cwd(), filePath))}`
        );
      }
    })
  );

program
  .command('fetch')
  .description('Fetch content objects')
  .option('-p, --preview', 'Fetch with preview mode')
  .option('-v, --verbose', 'Verbose output')
  .option('--ignore-errors', 'No error return code when transform has errors')
  .action(
    actionRunner(async (cmd) => {
      const config = await getConfig(parseFetchArgs(cmd || {}));
      const verified = await askMissing(config);
      const cache = initializeCache(config);
      await cache.reset();

      return run(verified);
    })
  );

program
  .command('watch')
  .description('Fetch content objects && watch for changes')
  .option('-p, --preview', 'Fetch with preview mode')
  .option('-v, --verbose', 'Verbose output')
  .option('--url <url>', 'Webhook url.\nCan also be set via environment variable CSSG_WEBHOOK_URL')
  .option('--no-cache', "Don't cache sync data")
  .option('--poll', 'Use polling (usefull when ngrok tunnel is not an option)')
  .option('--poll-intervall <intervall>', 'Change default intervall of 10000ms', '10000')
  .option(
    '--port <port>',
    'Overwrite internal listener port. Useful for running the watcher in an environment with a single public port and a proxy configuration.\nCan also be set via environment variable CSSG_WEBHOOK_PORT'
  )
  .option('--ignore-errors', 'No error return code when transform has errors')
  .action(
    actionRunner(async (cmd) => {
      const config = await getConfig(parseFetchArgs(cmd || {}));
      const verified = await askMissing(config);
      const useCache = Boolean(cmd?.cache ?? true);
      const cache = initializeCache(verified);
      // Await resetSync();
      let prev: RunResult;
      if (useCache && cache.hasSyncState()) {
        prev = await cache.getSyncState();
      } else if (!useCache) {
        await cache.reset();
      }

      prev = await run({ ...verified, sync: true }, prev);
      if (useCache) {
        await cache.setSyncState(prev);
      }

      if (cmd.poll) {
        const poll = () => {
          setTimeout(async () => {
            prev = await run({ ...verified, sync: true }, prev);
            if (useCache) {
              await cache.setSyncState(prev);
            }

            poll();
          }, parseInt(cmd.pollIntervall, 10));
        };

        poll();

        exitHook((cb) => {
          Promise.allSettled([
            !useCache && cache.reset(),
            useCache && prev && cache.setSyncState(prev),
          ])
            .then(() => {
              cb();
            })
            .catch((err) => {
              console.log('error:', err.message);
              cb();
            });
        });
      } else {
        let port = await getPort({ port: 1314 });

        if (process.env.CSSG_WEBHOOK_URL || cmd.url) {
          const url = new URL(process.env.CSSG_WEBHOOK_URL || cmd.url);
          if (url.port) {
            port = parseInt(url.port, 10);
          } else {
            port = url.protocol === 'https:' ? 443 : 80;
          }
        }

        if (process.env.CSSG_WEBHOOK_PORT || cmd.port) {
          port = parseInt(process.env.CSSG_WEBHOOK_PORT || cmd.port, 10);
        }

        const app = getApp(async () => {
          prev = await run({ ...verified, sync: true }, prev);
          await cache.setSyncState(prev);
        });

        console.log();

        const server = app.listen(port, () => {
          console.log(`  Internal server listening on port :${chalk.cyan(port)}`);
        });

        const stopServer = async () =>
          new Promise((resolve, reject) => {
            server.close((err) => {
              if (err) {
                reject(err);
              } else {
                resolve(true);
              }
            });
          });

        const url =
          process.env.CSSG_WEBHOOK_URL || (cmd.url as string) || (await ngrok.connect(port));
        console.log(`  Listening for hooks on ${chalk.cyan(url)}`);
        const webhook = await addWatchWebhook(verified as ContentfulConfig, url);

        exitHook((cb) => {
          Promise.allSettled([
            webhook.delete(),
            stopServer(),
            !useCache && cache.reset(),
            useCache && prev && cache.setSyncState(prev),
          ])
            .then(() => {
              cb();
            })
            .catch((err) => {
              console.log('error:', err.message);
              cb();
            });
        });
      }
    })
  );

program.parse(process.argv);
