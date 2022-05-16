#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-unsafe-call */

/* eslint-env node */
import path from 'path';
import chalk from 'chalk';
import ngrok from 'ngrok';
import getPort from 'get-port';
import exitHook from 'async-exit-hook';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { outputFile } from 'fs-extra';
import prettier from 'prettier';
import { Command } from 'commander';
import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import { logError, confirm, askAll, askMissing } from './lib/ui.js';
import { omitKeys } from './lib/object.js';
import { getApp } from './server/index.js';

import { getConfig, getEnvironmentConfig } from './lib/config.js';
import { run } from './index.js';
import { Config, ContentfulConfig } from './types.js';
import { addWatchWebhook, resetSync } from './lib/contentful.js';

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
      await resetSync();
      const config = await getConfig(parseFetchArgs(cmd || {}));
      const verified = await askMissing(config);

      return run(verified);
    })
  );

program
  .command('watch')
  .description('Fetch content objects && watch for changes')
  .option('-p, --preview', 'Fetch with preview mode')
  .option('-v, --verbose', 'Verbose output')
  .option('--url <url>', 'Url where the the server is reachable from the outside')
  .option('--ignore-errors', 'No error return code when transform has errors')
  .action(
    actionRunner(async (cmd) => {
      await resetSync();
      const config = await getConfig(parseFetchArgs(cmd || {}));
      const verified = await askMissing(config);

      const prev = await run({ ...verified, sync: true });

      let port = await getPort({ port: 1414 });
      if (cmd.url) {
        console.log(cmd);
        const url = new URL(cmd.url);
        port = url.port || url.protocol === 'https:' ? 443 : 80;
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const app = getApp(async () => {
        return run({ ...verified, sync: true }, prev);
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const server = app.listen(port);

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

      const url = (cmd.url as string) || (await ngrok.connect(port));
      console.log(`\n  Listening for hooks on ${chalk.cyan(url)}\n`);
      const webhook = await addWatchWebhook(verified as ContentfulConfig, url);

      exitHook(async (cb) => {
        await webhook.delete();
        cb();
      });

      exitHook(async (cb) => {
        await stopServer();
        cb();
      });
    })
  );

program.parse(process.argv);
