import chalk from 'chalk';
import Listr from 'listr';
import { ReplaySubject } from 'rxjs';
import { getContentId, getContentTypeId, isSyncRequest } from './lib/contentful.js';
import { ValidationError } from './lib/error.js';
import { collectParentValues, collectValues, waitFor } from './lib/utils.js';
import { fetch } from './tasks/fetch.js';
import { localize } from './tasks/localize.js';
import { remove } from './tasks/remove.js';
import { setup } from './tasks/setup.js';
import { transform } from './tasks/transform.js';
import { write } from './tasks/write.js';
import type {
  Asset,
  Config,
  Entry,
  LocalizedContent,
  ObservableContext,
  RunResult,
  RuntimeContext,
  Task,
  TransformContext,
  TransformHelper,
} from './types.js';

/**
 * This is a very simple listr renderer which does not swallow log output from
 * the configured helper functions.
 */
class CustomListrRenderer {
  readonly _tasks: Task[];
  constructor(tasks: Task[]) {
    this._tasks = tasks;
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  static get nonTTY() {
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  static subscribeTasks(tasks: Task[], indent = '') {
    for (const task of tasks) {
      task.subscribe((event) => {
        if (event.type === 'STATE' && task.isPending()) {
          console.log(`${indent}  ${chalk.yellow('\u279E')} ${task.title}`);
        }

        if (event.type === 'SUBTASKS' && task.subtasks.length > 0) {
          CustomListrRenderer.subscribeTasks(task.subtasks as unknown as Task[], indent + '  ');
        }
      });
    }
  }

  render() {
    CustomListrRenderer.subscribeTasks(this._tasks);
  }

  end(err) {
    if (!err) {
      console.log(`  ${chalk.green('✔')} all tasks done!`);
    }
  }
}

export const mergePrev = (ctx: RuntimeContext, prev: RunResult) => {
  // Add missing fields to deletedEntries
  // DeletedEntries from sync doesn't contain the contentType field in sys
  // and the fields object which makes it hard to locate the file which should be removed
  const entryMap =
    prev.localized?.[ctx.defaultLocale]?.entryMap ?? (new Map() as LocalizedContent['entryMap']);

  ctx.data.deletedEntries =
    ctx?.data?.deletedEntries?.map((entry) => {
      if (entryMap.has(entry.sys.id)) {
        const prevEntry: Entry = entryMap.get(entry.sys.id);

        return { ...prevEntry, sys: { ...prevEntry.sys, ...entry.sys } };
      }

      return entry;
    }) ?? [];

  // Remove deleted entries from prev result
  ctx.data.locales.forEach((locale) => {
    if (ctx?.data?.deletedEntries?.length) {
      ctx.data.deletedEntries.forEach((entry) => {
        if (prev.localized?.[locale.code]?.entryMap.has(entry.sys.id)) {
          prev.localized?.[locale.code]?.entryMap.delete(entry.sys.id);
          prev.localized[locale.code].entries = Array.from(
            prev.localized?.[locale.code]?.entryMap.values()
          );
        }
      });
    }

    if (ctx?.data?.deletedAssets?.length) {
      ctx.data.deletedAssets.forEach((asset) => {
        if (prev.localized?.[locale.code]?.assetMap.has(asset.sys.id)) {
          prev.localized?.[locale.code]?.assetMap.delete(asset.sys.id);
          prev.localized[locale.code].assets = Array.from(
            prev.localized?.[locale.code]?.assetMap.values()
          );
        }
      });
    }
  });
};

/**
 * Dump contentful objects to files
 * @param {Object} config
 */
export const run = async (
  config: Config,
  prev: RunResult = {
    observables: {},
    localized: {},
  }
): Promise<RunResult> => {
  const tasks = new Listr<RuntimeContext>(
    [
      {
        title: 'Setup',
        task: async (ctx) => setup(ctx, config),
      },
      {
        title: 'Pulling data from contentful',
        task: async (ctx) => {
          await fetch(ctx, config);
          mergePrev(ctx, prev);
        },
      },
      {
        title: 'Localize data',
        task: async (ctx) => localize(ctx),
      },
      {
        title: 'Before Hook',
        skip: (ctx) => !ctx.hooks.has('before'),
        task: async (ctx) => ctx.hooks.before(),
      },
      {
        title: 'Remove deleted files',
        skip: (ctx) => (ctx.data.deletedEntries ?? []).length === 0,
        task: async (ctx) => {
          const { locales = [], deletedEntries = [] } = ctx.data;
          const tasks = locales.map((locale) => ({
            title: `${locale.code}`,
            task: async () => {
              const data = ctx.localized.get(locale.code);

              // Get observables from previous run
              if (!prev?.observables?.[locale.code]) {
                prev.observables[locale.code] = new ReplaySubject<ObservableContext>();
              }

              const subject = prev.observables[locale.code];
              const observable = subject.asObservable();

              const promises = deletedEntries.map(async (entry) => {
                const id = getContentId(entry);
                const contentTypeId = getContentTypeId(entry);
                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                const utils = {} as TransformHelper;

                const transformContext: TransformContext = {
                  ...data,
                  id,
                  contentTypeId,
                  entry,
                  locale,
                  observable,
                  utils,
                };

                return remove(transformContext, ctx, config);
              });

              return Promise.all(promises);
            },
          }));

          return new Listr(tasks, { concurrent: true });
        },
      },
      {
        title: 'Writing files',
        task: async (ctx) => {
          const { locales = [] } = ctx.data;

          const tasks = locales.map((locale) => ({
            title: `${locale.code}`,
            task: async () => {
              const data = ctx.localized.get(locale.code);

              // Only walk new entries
              const { entries = [] } = data || {};

              // Get observables from previous run
              if (!prev?.observables?.[locale.code]) {
                prev.observables[locale.code] = new ReplaySubject<ObservableContext>();
              }

              const subject = prev.observables[locale.code];
              const observable = subject.asObservable();

              // Merge entries entries & assets from previous run
              // so that tey are available to changed entries
              data.assetMap = new Map<string, Asset>([
                ...(prev?.localized[locale.code]?.assetMap ?? new Map()),
                ...data.assetMap,
              ]);

              data.entryMap = new Map<string, Entry>([
                ...(prev?.localized[locale.code]?.entryMap ?? new Map()),
                ...data.entryMap,
              ]);

              data.entries = Array.from(data.entryMap.values());
              data.assets = Array.from(data.assetMap.values());

              // Store data for the next run
              prev.localized[locale.code] = data;

              const promises = entries.map(async (entry) => {
                const id = getContentId(entry);
                const contentTypeId = getContentTypeId(entry);

                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                const utils = {
                  collectValues: collectValues({ ...data, entry }),
                  collectParentValues: collectParentValues({ ...data, entry }),
                  waitFor: waitFor({ ...data, entry, observable }),
                } as TransformHelper;

                const transformContext: TransformContext = {
                  ...data,
                  id,
                  contentTypeId,
                  entry,
                  locale,
                  utils,
                  observable,
                };

                try {
                  const content = await transform(transformContext, ctx, config);
                  subject.next({ ...transformContext, content });

                  if (typeof content === 'undefined') {
                    return;
                  }

                  await write({ ...transformContext, content }, ctx, config);
                  ctx.stats.addSuccess(transformContext);
                } catch (error: unknown) {
                  if (error instanceof Error) {
                    subject.next({ ...transformContext, error });
                  } else {
                    // eslint-disable-next-line @typescript-eslint/no-base-to-string, @typescript-eslint/restrict-template-expressions
                    subject.next({ ...transformContext, error: new Error(`${error}`) });
                  }

                  if (error instanceof ValidationError) {
                    ctx.stats.addSkipped(transformContext, error);
                  } else {
                    ctx.stats.addError(transformContext, error);
                  }

                  await remove(transformContext, ctx, config);
                }
              });

              return Promise.all(promises);
            },
          }));
          return new Listr(tasks, { concurrent: true });
        },
      },
      {
        title: 'After Hook',
        skip: (ctx) => !ctx.hooks.has('after'),
        task: async (ctx) => ctx.hooks.after(),
      },
      {
        title: 'Cleanup',
        skip: () => isSyncRequest(),
        task: async (ctx) => ctx.fileManager.cleanup(),
      },
    ],
    { renderer: CustomListrRenderer }
  );

  const ctx = await tasks.run();
  await ctx.stats.print();
  console.log('\n  -------------------------------------------');

  if (ctx.stats.errors?.length && !config.ignoreErrors) {
    process.exit(1);
  }

  return prev;
};
