#!/usr/bin/env node

/* eslint-env node */
import { outputFile } from 'fs-extra';
import pico from 'picocolors';
import { logError } from '@jungvonmatt/contentful-ssg/lib/ui';
import { gracefulExit } from 'exit-hook';
import { Command } from 'commander';
import dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
import { generateTypings } from './index.js';

const env = dotenv.config();
expand(env);

type CommandArgs = {
  output: string;
  typeguard?: boolean;
  jsdoc?: boolean;
  localized?: boolean;
  legacy?: boolean;
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
  .command('generate')
  .description('Generate typescript definitions for contentful content types.')
  .option('-o, --output <filepath>', 'Specify output file', '@types/contentful.ts')
  .option('-l, --localized', 'Add localized types')
  .option('-d, --jsdoc', 'Add JSDoc comments')
  .option('-g, --typeguard', 'Add type guards')
  .option('-l, --legacy', 'Use legacy types (before contentful@10)')
  .action(
    actionRunner(async (cmd: CommandArgs) => {
      const output: string = cmd?.output ?? '';
      const typings = await generateTypings({
        typeguard: cmd.typeguard,
        jsdoc: cmd.jsdoc,
        localized: cmd.localized,
        legacy: cmd.legacy,
      });

      await outputFile(output, typings);
      console.log(pico.green(`  added: ${output}`));
    }),
  );

program.parse(process.argv);
