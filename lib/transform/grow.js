const path = require('path');
const fs = require('fs-extra');
const yaml = require('../converter/yaml');
const { getContentTypeDirectory } = require('../utils');
const { forEachAsync } = require('../array');

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
  await forEachAsync(Object.entries(typeConfig || {}), async ([contentType, blueprint]) => {
    const content = await yaml.convert(blueprint);
    const dir = await getContentTypeDirectory({ ...config, locale, contentType });
    const filepath = path.join(dir, '_blueprint.yaml');
    await fs.outputFile(filepath, content);
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

module.exports.addBlueprints = addBlueprints;
module.exports.mapBuildInFields = mapBuildInFields;