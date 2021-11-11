import type {Config, StatsEntry, TransformContext} from '../types.js';

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
      contentType: context.contentTypeId,
    };
  }

  addSuccess(context: TransformContext, message = '') {
    this.success.push({message, ...this.toEntry(context)});
  }

  addError(context: TransformContext, message = '') {
    this.errors.push({message, ...this.toEntry(context)});
  }

  addSkipped(context: TransformContext, message = '') {
    this.skipped.push({message, ...this.toEntry(context)});
  }

  print() {
    console.log('STATS');

    /**
 * Log dump stats
 * @param {Object} stats
 * @param {String} locale

const outputStats = (stats, locale) => {
  const data = Object.fromEntries(
    stats.map(([locale, stats]) => [locale, Object.fromEntries(Object.entries(stats).map(([ct, list]) => [ct, list.length]))]),
  );

  let tmp = data[locale];
  if (!tmp) {
    tmp = Object.values(data)[0];
  }

  console.log('    -----------');
  const cnt = Object.entries(tmp)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([ct, cnt]) => {
      console.log(`  ${chalk.green('✔')} ${ct} - ${chalk.cyan(cnt)} item${cnt === 1 ? 's' : ''}`);
      return parseInt(cnt as string, 10);
    });

  console.log(`\n  Saved ${chalk.cyan(cnt.reduce((acc, num) => acc + num, 0))} entries`);
};
 */
  }
}
