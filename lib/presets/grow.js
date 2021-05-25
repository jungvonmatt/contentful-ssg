import fs from 'fs-extra';
import path from 'path';
import { mapAsync } from '../array.js';
import { convert } from '../converter/yaml.js';
import { getContentTypeDirectory } from '../utils.js';

/**
 * Built-in fields carry special meaning that can affect various aspects of building your site.
 * The values of built-in fields can change things such as a tag's output in the template API or the routes served by your site.
 * See: https://grow.io/reference/documents/#built-in-fields
 */
const buildInFields = new Set([
  'category',
  'date',
  'hidden',
  'localization',
  'order',
  'parent',
  'path',
  'slug',
  'title',
  'view',
  'dates',
  'titles',
]);

export const addBlueprints = async (config) => {
  const { typeConfig, locale } = config || {};
  return mapAsync(Object.entries(typeConfig || {}), async ([contentType, blueprint]) => {
    const content = await convert(blueprint);
    const contentTypeDirectory = await getContentTypeDirectory({ ...config, locale, contentType });
    const filepath = path.join(contentTypeDirectory, '_blueprint.yaml');
    await fs.outputFile(filepath, content);
    return path.resolve(filepath);
  });
};

/**
 * Map keys for build in fields
 * @param {Object} content
 * @param {Object} config
 */
export const mapBuildInFields = async (content, config) => {
  const { typeConfig, contentType } = config || {};
  const pageTypes = Object.keys(typeConfig || {});

  if (typeConfig && !pageTypes.includes(contentType)) {
    return content;
  }

  const dates = {
    created: new Date(content.created_at).toISOString(),
    published: new Date(content.updated_at).toISOString(),
  };

  const date = new Date(content.updated_at).toISOString();

  return Object.fromEntries(
    Object.entries({ dates, date, ...content }).map(([key, value]) => {
      if (buildInFields.has(key)) {
        return [`$${key}`, value];
      }

      return [key, value];
    })
  );
};

export const mapGrowLink = async (entry, options) => {
  const { typeConfig = {}, contentType, entries, locale } = options;
  const id = entry?.sys?.id ?? '';
  const contentTypeDirectory = await getContentTypeDirectory(options);

  if (id && contentTypeDirectory && (!entries || entries.has(id))) {
    const hasBlueprint = Object.keys(typeConfig).includes(contentType);
    const localeExtension = locale === undefined || locale?.default ? '' : `@${locale?.code}`;
    const file = `${id}${localeExtension}.yaml`;
    const function_ = hasBlueprint ? '!g.doc' : '!g.yaml';

    return `${function_} /${path.join(path.relative(process.cwd(), contentTypeDirectory), file)}`;
  }

  return;
};
