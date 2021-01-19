#!/usr/bin/env node

/* eslint-disable no-console */
/* eslint-env node */
const fs = require('fs-extra');
const path = require('path');
const prettier = require('prettier');
const chalk = require('chalk');
const { getConfig, askAll, askMissing } = require('./lib/config');
const { log, confirm, omitKeys } = require('./lib/utils');
const { dump } = require('./lib/dump');
const pkg = require('./package.json');

const program = require('commander');
program.version(pkg.version);
require('dotenv').config();

const parseArgs = (cmd) => {
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
    (errors || []).forEach((error) => log.error(error));
  }
  process.exit(1);
};

const actionRunner = (fn, log = true) => {
  return (...args) => fn(...args).catch((error) => errorHandler(error, !log));
};

program
  .command('init')
  .description('Initialize contentful-ssg')
  .option('--preset [preset]', `Use preset. Currently only 'grow' is available as preset`)
  .action(
    actionRunner(async (cmd) => {
      const config = await getConfig(parseArgs(cmd || {}));
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
      if (fs.existsSync(filePath)) {
        writeFile = await confirm(`Config file already exists. Overwrite?\n\n${chalk.reset(content)}`);
      } else {
        writeFile = await confirm(`Please verify your settings:\n\n${chalk.reset(content)}`);
      }

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
      const config = await getConfig(parseArgs(cmd || {}));
      const verified = await askMissing(config);

      await dump(verified);
    })
  );

program.parse(process.argv);
