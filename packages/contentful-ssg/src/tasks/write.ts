import type {TransformContext, RuntimeContext, Config} from '../types.js';
import {join} from 'path';
import mm from 'micromatch';
import {stringify, TYPE_YAML} from '../converter/index.js';
const {contains} = mm;

export const write = async (transformContext: TransformContext, runtimeContext: RuntimeContext, config: Config) => {
  const {id, locale, contentTypeId, content: data} = transformContext;

  const contentTypeDirectory = await runtimeContext.hooks.mapDirectory(transformContext, contentTypeId);
  const directory = join((config.directory || process.cwd()), contentTypeDirectory);
  // Use CLDR codes for locales (http://www.localeplanet.com/icu/)
  const localeAddon = locale.default ? '' : `@${locale.code.replace('-', '_')}`;

  let format = TYPE_YAML;
  if (typeof config.format === 'string') {
    format = config.format;
  } else if (typeof config.format === 'function') {
    format = await config.format(transformContext, runtimeContext, TYPE_YAML);
  } else {
    [format = TYPE_YAML] = Object.entries(config.format || {}).find(([, glob]) => contains(directory, glob)) || [];
  }

  const filename = await runtimeContext.hooks.mapFilename(transformContext, `${id}${localeAddon}.${format}`);
  const filepath = join(directory, filename);

  const content = stringify(data, format);

  await runtimeContext.fileManager.writeFile(filepath, content);
};
