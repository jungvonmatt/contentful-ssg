#!/usr/bin/env node

/* eslint-env node */
import path from 'path';
import { existsSync } from 'fs';
import { outputFile } from 'fs-extra';
import { Command } from 'commander';
import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import { ContentfulConfig } from '@jungvonmatt/contentful-ssg';
import { getConfig } from '@jungvonmatt/contentful-ssg/lib/config';
import { forEachAsync } from '@jungvonmatt/contentful-ssg/lib/array';
import { stringify } from '@jungvonmatt/contentful-ssg/converter';
import { logError, askMissing, confirm } from '@jungvonmatt/contentful-ssg/lib/ui';
import { createFakes } from './index.js';

const env = dotenv.config();
dotenvExpand(env);

type CommandArgs = {
  outputDirectory: string;
  extension: string;
  contentType: string[];
  env: string;
  verbose: boolean;
  force: boolean;
};

const parseArgs = (cmd: CommandArgs) => ({
  environment: cmd.env,
  verbose: Boolean(cmd.verbose),
  contentTypes: cmd.contentType,
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
    fn(...args).catch((error) => errorHandler(error, !log));
const program = new Command();

program
  .command('create')
  .description('Create fake objects')
  .option('-c, --content-type <content-type...>', 'Specify content-types')
  .option('-e, --extension <extension>', 'Specify output format', 'yaml')
  .option('-o, --output-directory <directory>', 'Specify output directory', 'data')
  .option('-f, --force', 'Overwrite')
  .action(
    actionRunner(async (cmd: CommandArgs) => {
      const contentTypes: string[] = cmd?.contentType ?? [];
      const force: boolean = cmd?.force ?? false;
      const format: string = cmd?.extension ?? '';
      const outputDirectory: string = cmd?.outputDirectory ?? '';
      const config = await getConfig(parseArgs(cmd));
      const verified = await askMissing(config);
      const fakes = await createFakes(verified as ContentfulConfig, contentTypes);
      await forEachAsync(Object.entries(fakes), async ([contentTypeId, fakeData]) => {
        const [defaultData, minData] = fakeData;
        const dir = path.join(outputDirectory, contentTypeId);
        const filenameDefault = path.join(dir, `default.${format}`);
        const filenameMin = path.join(dir, `min.${format}`);
        if (
          !existsSync(filenameDefault) ||
          force ||
          (await confirm(`Overwrite file: ${filenameDefault}`))
        ) {
          await outputFile(filenameDefault, stringify(defaultData, format));
        }

        if (
          !existsSync(filenameMin) ||
          force ||
          (await confirm(`Overwrite file: ${filenameMin}`))
        ) {
          await outputFile(filenameMin, stringify(minData, format));
        }
      });
    })
  );

program.parse(process.argv);
