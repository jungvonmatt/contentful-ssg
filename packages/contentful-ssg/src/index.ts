import type {
  Config,
  ObservableContext,
  RuntimeContext,
  Task,
  TransformContext,
  TransformHelper,
} from './types.js';
import Listr from 'listr';
import { BehaviorSubject } from 'rxjs';
import chalk from 'chalk';
import { getContentTypeId, getContentId } from './lib/contentful.js';
import { setup } from './tasks/setup.js';
import { fetch } from './tasks/fetch.js';
import { localize } from './tasks/localize.js';
import { transform } from './tasks/transform.js';
import { write } from './tasks/write.js';
import { collectParentValues, collectValues, waitFor } from './lib/utils.js';
import { ValidationError } from './lib/error.js';

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

/**
 * Dump contentful objects to files
 * @param {Object} config
 */
export const run = async (config: Config): Promise<void> => {
  const tasks = new Listr<RuntimeContext>(
    [
      {
        title: 'Setup',
        task: async (ctx) => setup(ctx, config),
      },
      {
        title: 'Pulling data from contentful',
        task: async (ctx) => fetch(ctx, config),
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
        title: 'Writing files',
        task: async (ctx) => {
          const { locales = [] } = ctx.data;

          const tasks = locales.map((locale) => ({
            title: `${locale.code}`,
            task: async () => {
              const subject = new BehaviorSubject<ObservableContext>(null);
              const observable = subject.asObservable();
              const data = ctx.localized.get(locale.code);
              const { entries = [] } = data || {};

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
                  } else if (typeof error === 'string') {
                    subject.next({ ...transformContext, error: new Error(error) });
                  }

                  if (error instanceof ValidationError) {
                    ctx.stats.addSkipped(transformContext, error);
                  } else if (typeof error === 'string' || error instanceof Error) {
                    ctx.stats.addError(transformContext, error);
                  }
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
        task: async (ctx) => ctx.fileManager.cleanup(),
      },
    ],
    { renderer: CustomListrRenderer }
  );

  const ctx = await tasks.run();
  await ctx.stats.print();
  console.log('\n---------------------------------------------');

  if (ctx.stats.errors?.length && !config.ignoreErrors) {
    process.exit(1);
  }
};
