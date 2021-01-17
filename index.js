#!/usr/bin/env node

/* eslint-disable no-console */
/* eslint-env node */
const fs = require('fs-extra');
const path = require('path');
const prettier = require('prettier');
const pkgUp = require('pkg-up');
const chalk = require('chalk');
const { getConfig, askAll, askMissing } = require('./lib/config');
const { log, confirm, omitKeys } = require('./lib/utils');
const { getApiKeys } = require('./lib/contentful');
const { dump } = require('./lib/dump');
const pkg = require('./package.json');

const program = require('commander');
program.version(pkg.version);
require('dotenv').config();

const parseArgs = (cmd) => {
  const directory = cmd.path || cmd.parent.path;
  return {
    environment: cmd.env || cmd.parent.env,
    directory: directory ? path.resolve(directory) : undefined,
    sourceEnvironment: cmd.sourceEnv || cmd.parent.sourceEnv,
    destEnvironment: cmd.destEnv || cmd.parent.destEnv,
    verbose: cmd.verbose || cmd.parent.verbose,
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
  .action(
    actionRunner(async (cmd) => {
      const config = await getConfig(parseArgs(cmd));
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
  .action(
    actionRunner(async (cmd) => {
      const config = await getConfig(parseArgs(cmd));
      const verified = await askMissing(config);

      await dump(verified);
    })
  );

program.parse(process.argv);
