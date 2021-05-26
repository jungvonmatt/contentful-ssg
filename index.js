#!/usr/bin/env node

/* eslint-disable no-console */
/* eslint-env node */
import chalk from 'chalk';
import program from 'commander';
import dotenv from 'dotenv';
import fs from 'fs-extra';
import path from 'path';
import prettier from 'prettier';
import { askAll, askMissing, getConfig } from './lib/config.js';
import { dump } from './lib/dump.js';
import { confirm, log, omitKeys } from './lib/utils.js';

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

dotenv.config();
program.version(packageJson.version);

const parseArguments = (cmd) => {
  return {
    environment: cmd.env,
    directory: cmd.path ? path.resolve(cmd.path) : undefined,
    sourceEnvironment: cmd.sourceEnv,
    destEnvironment: cmd.destEnv,
    verbose: cmd.verbose,
    preview: cmd.preview,
    preset: cmd.preset,
  };
};

const errorHandler = (error, silence) => {
  if (!silence) {
    const { errors } = error;
    log.error(error);
    for (const error of errors || []) log.error(error);
  }
  process.exit(1);
};

const actionRunner = (function_, log = true) => {
  return (...arguments_) => function_(...arguments_).catch((error) => errorHandler(error, !log));
};

program
  .command('init')
  .description('Initialize contentful-ssg')
  .option('--preset [preset]', `Use preset. Currently only 'grow' is available as preset`)
  .action(
    actionRunner(async (cmd) => {
      const config = await getConfig(parseArguments(cmd || {}));
      const verified = await askAll(config);

      const filePath = path.join(process.cwd(), 'contentful-ssg.config.js');
      const prettierOptions = await prettier.resolveConfig(filePath);
      if (verified.directory && verified.directory.startsWith('/')) {
        verified.directory = path.relative(process.cwd(), verified.directory);
      }

      const content = prettier.format(`module.exports = ${JSON.stringify(omitKeys(verified, 'managementToken'))}`, {
        parser: 'babel',
        ...prettierOptions,
      });

      let writeFile = true;
      writeFile = await (fs.existsSync(filePath)
        ? confirm(`Config file already exists. Overwrite?\n\n${chalk.reset(content)}`)
        : confirm(`Please verify your settings:\n\n${chalk.reset(content)}`));

      if (writeFile) {
        await fs.outputFile(filePath, content);
        console.log(`\nConfiguration saved to ${chalk.cyan(path.relative(process.cwd(), filePath))}`);
      }
    })
  );

program
  .command('fetch')
  .description('Fetch content objects')
  .option('--preview', 'Fetch with preview mode')
  .action(
    actionRunner(async (cmd) => {
      const config = await getConfig(parseArguments(cmd || {}));
      const verified = await askMissing(config);

      await dump(verified);
    })
  );

program.parse(process.argv);
