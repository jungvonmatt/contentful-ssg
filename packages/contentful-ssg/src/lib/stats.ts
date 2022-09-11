import pico from 'picocolors';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import type { Config, KeyValueMap, RunResult, StatsEntry, TransformContext } from '../types.js';
import type { ValidationError } from './error.js';
import { getEntries, groupBy } from './object.js';
import { getObservableCount } from './observable.js';

export class Stats {
  config: Config;

  success: StatsEntry[] = [];
  errors: StatsEntry[] = [];
  skipped: StatsEntry[] = [];

  constructor(_config: Config) {
    this.config = _config;
  }

  toEntry(context: TransformContext) {
    return {
      id: context.id,
      locale: context.locale.code,
      contentTypeId: context.contentTypeId,
    };
  }

  addSuccess(context: TransformContext, message = '') {
    this.success.push({ message, ...this.toEntry(context) });
  }

  addError(context: TransformContext, error: unknown): void {
    if (error instanceof Error) {
      this.errors.push({ error, ...this.toEntry(context) });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string, @typescript-eslint/restrict-template-expressions
      this.errors.push({ error: new Error(`${error}`), ...this.toEntry(context) });
    }
  }

  addSkipped(context: TransformContext, error: ValidationError) {
    this.skipped.push({ error, ...this.toEntry(context) });
  }

  async print(prev?: RunResult) {
    console.log('\n    -----------\n');
    const stats = groupBy<StatsEntry>(this.success, 'contentTypeId');

    Object.entries(stats)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .forEach(([key, entries]) => {
        const byLocale = groupBy<StatsEntry>(entries, 'locale');
        const counts = getEntries(byLocale)
          .map(([locale, items]) => `${pico.cyan(items.length)}(${locale})`)
          .join(' - ');
        console.log(`  ${pico.green('✔')} ${key}: ${counts}`);
        return entries.length;
      });

    const timestamp = Date.now();
    const filenameSkipped = `validation-errors-${timestamp}.log`;
    const filenameErrors = `errors-${timestamp}.log`;

    if (prev) {
      const successCounts = await Promise.all(
        Object.entries(prev.observables).map(async ([, observable]) => {
          return getObservableCount(observable, (ctx) => !ctx.error);
        })
      );
      const errorCounts = await Promise.all(
        Object.entries(prev.observables).map(async ([, observable]) => {
          return getObservableCount(observable, (ctx) => Boolean(ctx.error));
        })
      );

      const successCount = successCounts.reduce((result, count) => result + count, 0);
      const errorCount = errorCounts.reduce((result, count) => result + count, 0);

      console.log(
        `  Sync cache contains ${pico.green(successCount)} entries and ${pico.red(
          errorCount
        )} errors`
      );
    }

    console.log(`\n  Saved ${pico.green(this.success.length)}${prev ? ' new' : ''} entries`);

    console.log(
      `  ${pico.cyan(this.skipped.length)} entries skipped due to validation issues.`,
      this.config.verbose && this.skipped.length
        ? `See ${filenameSkipped} for details.`
        : this.skipped.length
        ? 'Use --verbose to see actual errors.'
        : ''
    );
    console.log(
      `  ${pico.red(this.errors.length)}${prev ? ' new' : ''} errors.`,
      this.config.verbose && this.errors.length
        ? `See ${filenameErrors} for details.`
        : this.errors.length
        ? 'Use --verbose to see actual errors.'
        : ''
    );

    if (this.config.verbose && this.skipped.length) {
      await writeFile(
        join(process.cwd(), filenameSkipped),
        JSON.stringify(
          this.skipped.map((item) => ({
            ...item,
            error: JSON.parse(
              JSON.stringify(item.error, Object.getOwnPropertyNames(item.error))
            ) as KeyValueMap,
          })),
          null,
          '   '
        )
      );
    }

    if (this.config.verbose && this.errors.length) {
      await writeFile(
        join(process.cwd(), filenameErrors),
        JSON.stringify(
          this.errors.map((item) => ({
            ...item,
            error: JSON.parse(
              JSON.stringify(item.error, Object.getOwnPropertyNames(item.error))
            ) as KeyValueMap,
          })),
          null,
          '   '
        )
      );
    }
  }
}
