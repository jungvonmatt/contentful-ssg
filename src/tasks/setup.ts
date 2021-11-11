import type {Config, RuntimeContext} from '../types.js';
import {FileManager} from '../helper/file-manager.js';
import {Stats} from '../helper/stats.js';
import {HookManager} from '../helper/hook-manager.js';

export const setup = async (context: RuntimeContext, config: Config) => {
  context.config = config;

  context.fileManager = new FileManager(config);
  await context.fileManager.initialize();

  context.stats = new Stats(config);

  context.hooks = new HookManager(context, config);
};
