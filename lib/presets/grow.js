const path = require('path');
const fs = require('fs-extra');
const yaml = require('../converter/yaml');
const { getContentTypeDirectory } = require('../utils');
const { mapAsync } = require('../array');

/**
 * Built-in fields carry special meaning that can affect various aspects of building your site.
 * The values of built-in fields can change things such as a tag's output in the template API or the routes served by your site.
 * See: https://grow.io/reference/documents/#built-in-fields
 */
const buildInFields = [
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
];

const addBlueprints = async (config) => {
  const { typeConfig, locale } = config || {};
  return mapAsync(Object.entries(typeConfig || {}), async ([contentType, blueprint]) => {
    const content = await yaml.convert(blueprint);
    const dir = await getContentTypeDirectory({ ...config, locale, contentType });
    const filepath = path.join(dir, '_blueprint.yaml');
    await fs.outputFile(filepath, content);
    return path.resolve(filepath);
  });
};

/**
 * Map keys for build in fields
 * @param {Object} content
 * @param {Object} config
 */
const mapBuildInFields = async (content, config) => {
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
      if (buildInFields.includes(key)) {
        return [`$${key}`, value];
      }

      return [key, value];
    })
  );
};

const mapGrowLink = async (entry, options) => {
  const { typeConfig = {}, contentType, entries, locale } = options;
  const id = entry?.sys?.id ?? '';
  const dir = await getContentTypeDirectory(options);

  if (id && dir && (!entries || entries.has(id))) {
    const hasBlueprint = Object.keys(typeConfig).includes(contentType);
    const localeExt = locale === undefined || locale?.default ? '' : `@${locale?.code}`;
    const file = `${id}${localeExt}.yaml`;
    const func = hasBlueprint ? '!g.doc' : '!g.yaml';

    return `${func} /${path.join(path.relative(process.cwd(), dir), file)}`;
  }

  return undefined;
};

module.exports.addBlueprints = addBlueprints;
module.exports.mapGrowLink = mapGrowLink;
module.exports.mapBuildInFields = mapBuildInFields;
