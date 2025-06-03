#!/usr/bin/env node

/* eslint-env node */
import { stringify } from '@jungvonmatt/contentful-ssg/converter';
import { forEachAsync } from '@jungvonmatt/contentful-ssg/lib/array';
import { confirm, logError } from '@jungvonmatt/contentful-ssg/lib/ui';
import { gracefulExit } from 'exit-hook';
import chalk from 'chalk';
import { Command } from 'commander';
import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import { existsSync } from 'fs';
import { outputFile } from 'fs-extra';
import path from 'path';
import { createFakes } from './index.js';

const env = dotenv.config();
dotenvExpand.expand(env);

type CommandArgs = {
  outputDirectory: string;
  extension: string;
  contentType: string[];
  config?: string;
  cwd?: string;
  env: string;
  verbose: boolean;
  yes: boolean;
  no: boolean;
};

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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
    fn(...args).catch((error: CommandError) => {
      errorHandler(error, !log);
    });
const program = new Command();

program
  .command('create')
  .description('Create fake objects')
  .option('-c, --content-type <content-type...>', 'Specify content-types')
  .option('-e, --extension <extension>', 'Specify output format', 'yaml')
  .option('-o, --output-directory <directory>', 'Specify output directory', 'data')
  .option(
    '--config <configFile>',
    'Use this configuration, overriding other config options if present',
  )
  .option('--cwd <directory>', 'Working directory. Defaults to process.cwd()')
  .option('--yes', 'Overwrite')
  .option('--no', 'Skip')
  .action(
    actionRunner(async (cmd: CommandArgs) => {
      const contentTypes: string[] = cmd?.contentType ?? [];
      const yes: boolean = cmd?.yes ?? false;
      const no: boolean = cmd?.no ?? false;
      const format: string = cmd?.extension ?? '';
      const outputDirectory: string = cmd?.outputDirectory ?? '';
      const fakes = await createFakes(contentTypes, cmd.config, cmd.cwd);
      console.log();
      if (!Object.keys(fakes).length) {
        console.log('No files generated.');
        console.log(
          `No content models found for: ${chalk.cyan(contentTypes.join(chalk.white(', ')))}`,
        );
      }

      await forEachAsync(Object.entries(fakes), async ([contentTypeId, fakeData]) => {
        const [defaultData] = fakeData;
        const dir = path.join(outputDirectory, contentTypeId);
        const filenameDefault = path.join(dir, `default.${format}`);
        if (existsSync(filenameDefault) && no) {
          console.log(chalk.yellow(`  skipped: ${filenameDefault}`));
        } else if (
          !existsSync(filenameDefault) ||
          yes ||
          (await confirm(`Overwrite file: ${filenameDefault}`))
        ) {
          await outputFile(filenameDefault, stringify(defaultData, format));
          console.log(chalk.green(`    added: ${filenameDefault}`));
        }
      });
    }),
  );

program.parse(process.argv);
