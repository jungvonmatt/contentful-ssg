import type {Config, RuntimeContext} from '../types.js';
import {FileManager} from '../lib/file-manager.js';
import {Stats} from '../lib/stats.js';
import {HookManager} from '../lib/hook-manager.js';
import * as array from '../lib/array.js';
import * as object from '../lib/object.js';
import * as json from '../converter/json.js';
import * as markdown from '../converter/markdown.js';
import * as toml from '../converter/toml.js';
import * as yaml from '../converter/yaml.js';

export const setup = async (context: RuntimeContext, config: Config) => {
  context.config = config;

  context.fileManager = new FileManager(config);
  await context.fileManager.initialize();

  context.stats = new Stats(config);

  context.hooks = new HookManager(context, config);
  context.converter = {
    json,
    markdown,
    yaml,
    toml,
  };
  context.helper = {
    array,
    object,
  };
};
