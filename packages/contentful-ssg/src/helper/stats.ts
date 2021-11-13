import type {Config, StatsEntry, TransformContext} from '../types.js';
import {getEntries, groupBy} from './object.js';
import {writeFile} from 'fs/promises';
import chalk from 'chalk';
import {join} from 'path';

export class Stats {
  config: Config;

  success: StatsEntry[] = [];
  errors: StatsEntry[] = [];
  skipped: StatsEntry[] = [];

  constructor(config: Config) {
    this.config = config;
  }

  toEntry(context: TransformContext) {
    return {
      id: context.id,
      locale: context.locale.code,
      contentTypeId: context.contentTypeId,
    };
  }

  addSuccess(context: TransformContext, message = '') {
    this.success.push({message, ...this.toEntry(context)});
  }

  addError(context: TransformContext, error: string | Error): void {
    if (typeof error === 'string') {
      this.errors.push({error: new Error(error), ...this.toEntry(context)});
    } else {
      this.errors.push({error, ...this.toEntry(context)});
    }
  }

  addSkipped(context: TransformContext, message = '') {
    this.skipped.push({message, ...this.toEntry(context)});
  }

  async print() {
    console.log('\n    -----------\n');
    const stats = groupBy<StatsEntry>(this.success, 'contentTypeId');

    Object.entries(stats)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .forEach(([key, entries]) => {
        const byLocale = groupBy<StatsEntry>(entries, 'locale');
        const counts = getEntries(byLocale)
          .map(([locale, items]) => `${chalk.cyan(items.length)}(${locale})`)
          .join(' - ');
        console.log(`  ${chalk.green('✔')} ${key}: ${counts}`);
        return entries.length;
      });

    const timestamp = Date.now();
    const filenameSkipped = `skipped-${timestamp}.log`;
    const filenameErrors = `errors-${timestamp}.log`;

    console.log(`\n  Saved ${chalk.green(this.success.length)} entries`);
    console.log(
      `  ${chalk.cyan(this.skipped.length)} entries skipped due to validation issues.`,
      this.config.verbose && this.skipped.length ? `See ${filenameSkipped} for details.` : '',
    );
    console.log(
      `  ${chalk.red(this.errors.length)} errors.`,
      this.config.verbose && this.errors.length ? `See ${filenameErrors} for details.` : '',
    );

    if (this.config.verbose && this.skipped.length) {
      await writeFile(
        join(process.cwd(), filenameSkipped),
        JSON.stringify(this.skipped, null, '   '),
      );
    }

    if (this.config.verbose && this.errors.length) {
      await writeFile(
        join(process.cwd(), filenameErrors),
        JSON.stringify(this.errors, null, '   '),
      );
    }
  }
}
