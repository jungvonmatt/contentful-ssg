#!/usr/bin/env node

/* eslint-env node */
import path from 'path';
import chalk from 'chalk';
import {existsSync} from 'fs';
import {outputFile} from 'fs-extra';
import prettier from 'prettier';
import {Command} from 'commander';
import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import {logError, confirm, askAll, askMissing} from './helper/ui.js';
import {omitKeys} from './helper/object.js';

import {getConfig, getEnvironmentConfig} from './helper/config.js';
import {run} from './index.js';
import {ContentfulConfig} from './types.js';

const env = dotenv.config();
dotenvExpand(env);

const parseArgs = cmd => ({
  environment: cmd.env as string,
  preview: Boolean(cmd.preview),
  verbose: Boolean(cmd.verbose),
});

type CommandError = Error & {
  errors?: Error[];
};
const errorHandler = (error: CommandError, silence: boolean) => {
  if (!silence) {
    const {errors} = error;
    logError(error);
    (errors || []).forEach(error => {
      logError(error);
    });
  }

  process.exit(1);
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
const actionRunner = (fn, log = true) => (...args) => fn(...args).catch(error => errorHandler(error, !log));
const program = new Command();
program
  .command('init')
  .description('Initialize contentful-ssg')
  .option('--typescript', 'Initialize typescript config')
  .action(
    actionRunner(async cmd => {
      const useTypescript = Boolean(cmd?.typescript ?? false);
      const config = await getConfig(parseArgs(cmd || {}));
      const verified = await askAll(config);

      const environmentConfig = getEnvironmentConfig();

      const filePath = path.join(process.cwd(), `contentful-ssg.config.${useTypescript ? 'ts' : 'js'}`);
      const prettierOptions = await prettier.resolveConfig(filePath);
      if (verified.directory?.startsWith('/')) {
        verified.directory = path.relative(process.cwd(), verified.directory);
      }

      const environmentKeys: Array<keyof ContentfulConfig> = (Object.keys(environmentConfig) as Array<keyof ContentfulConfig>).filter(key => environmentConfig[key] === verified[key]);

      const cleanedConfig = omitKeys(verified,
        'preview',
        'verbose',
        'rootDir',
        'resolvedPlugins',
        'host',
        'managementToken',
        ...environmentKeys,
      );

      let content = '';
      if (useTypescript) {
        content = prettier.format(`import {Config} from '@jungvonmatt/contentful-ssg';
        export default <Config>${JSON.stringify(cleanedConfig)}`, {
          parser: 'typescript',
          ...prettierOptions,
        });
      } else {
        content = prettier.format(`module.exports = ${JSON.stringify(cleanedConfig)}`, {
          parser: 'babel',
          ...prettierOptions,
        });
      }

      let writeFile = true;
      if (existsSync(filePath)) {
        writeFile = await confirm(`Config file already exists. Overwrite?\n\n${chalk.reset(content)}`);
      } else {
        writeFile = await confirm(`Please verify your settings:\n\n${chalk.reset(content)}`, true);
      }

      if (writeFile) {
        await outputFile(filePath, content);
        console.log(`\nConfiguration saved to ${chalk.cyan(path.relative(process.cwd(), filePath))}`);
      }
    }),
  );

program
  .command('fetch')
  .description('Fetch content objects')
  .option('-p, --preview', 'Fetch with preview mode')
  .option('-v, --verbose', 'Verbose output')
  .action(
    actionRunner(async cmd => {
      const config = await getConfig(parseArgs(cmd || {}));
      const verified = await askMissing(config);

      return run(verified);
    }),
  );

program.parse(process.argv);
