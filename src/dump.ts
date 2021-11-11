/* eslint-disable @typescript-eslint/naming-convention */
/* -eslint-disable @typescript-eslint/no-unsafe-return */
/* -eslint-disable @typescript-eslint/no-unsafe-call */

import type {Config, RuntimeContext, Task, TransformContext, TransformHelper} from './types.js';

import Listr from 'listr';
import chalk from 'chalk';
import {getContentTypeId, getContentId} from './helper/contentful.js';
// // Import {mapBuildInFields, addBlueprints, mapGrowLink} from './helper/presets/grow';

import {setup} from './tasks/setup.js';
import {fetch} from './tasks/fetch.js';
import {localize} from './tasks/localize.js';
import {transform} from './tasks/transform.js';
import {write} from './tasks/write.js';
import {collectParentValues, collectValues} from './helper/utils.js';

/**
 * This is a very simple listr renderer which does not swallow log output from
 * the configured helper functions.
 */
class CustomListrRenderer {
  readonly _tasks: Task[];
  constructor(tasks: Task[]) {
    this._tasks = tasks;
  }

  static get nonTTY() {
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  static subscribeTasks(tasks: Task[], indent = '') {
    for (const task of tasks) {
      task.subscribe(event => {
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
export const dump = async (config: Config): Promise<void> => {
  const tasks = new Listr<RuntimeContext>(
    [
      {
        title: 'Setup',
        task: async ctx => setup(ctx, config),
      },
      {
        title: 'Pulling data from contentful',
        task: async ctx => fetch(ctx, config),
      },
      {
        title: 'Before Hook',
        skip: ctx => !ctx.hooks.has('before'),
        task: async ctx => {
          const result = await ctx.hooks.before();
          ctx = {...ctx, ...(result || {})};
        },
      },
      {
        title: 'Localize data',
        task: async ctx => localize(ctx),
      },
      {
        title: 'Writing files',
        task: async ctx => {
          const {locales = []} = ctx.data;

          return new Listr(
            locales.map(locale => ({
              title: `${locale.code}`,
              task: async () => {
                const data = ctx.localized.get(locale.code);
                const {entries = []} = data || {};

                const promises = entries.map(async entry => {
                  const id = getContentId(entry);
                  const contentTypeId = getContentTypeId(entry);
                  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                  const helper = {
                    collectValues: collectValues({entries, entry}),
                    collectParentValues: collectParentValues({entries, entry}),
                  } as TransformHelper;

                  const transformContext: TransformContext = {
                    id, contentTypeId, entry, locale, helper, ...data,
                  };

                  try {
                    const content = await transform(transformContext, ctx, config);
                    await write({...transformContext, content}, ctx, config);
                  } catch (error: unknown) {
                    if (typeof error === 'string') {
                      ctx.stats.addError(transformContext, error);
                    } else if (error instanceof Error) {
                      ctx.stats.addError(transformContext, error.message);
                    } else {
                      ctx.stats.addError(transformContext, 'unknown');
                    }
                  }
                });

                return Promise.all(promises);
              },
            })),
            {concurrent: true},
          );
        },
      },
      {
        title: 'After Hook',
        skip: ctx => !ctx.hooks.has('after'),
        task: async ctx => {
          const result = await ctx.hooks.after();
          ctx = {...ctx, ...(result || {})};
        },
      },

      {
        title: 'Cleanup',
        skip: ctx => ctx.fileManager.count === 0,
        task: async ctx => {
          console.log(`Cleaning ${ctx.fileManager.count} files...`);
          await ctx.fileManager.cleanup();

          console.log('done');
        },
      },
    ],
    {renderer: CustomListrRenderer},
  );

  const ctx = await tasks.run();
  ctx.stats.print();
  console.log('\n---------------------------------------------');
};

