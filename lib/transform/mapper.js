const { documentToHtmlString } = require('@contentful/rich-text-html-renderer');
const { mapAsync } = require('../array');
const { removeEmpty } = require('../utils');

const {
  FIELD_TYPE_RICHTEXT,
  FIELD_TYPE_DATE,
  FIELD_TYPE_ARRAY,
  FIELD_TYPE_LINK,
  getContentId,
  getContentTypeId,
  getFieldSettings,
  isAssetLink,
  isEntryLink,
  isAsset,
  isEntry,
} = require('../contentful');

/**
 * Convert contentful entry to export format (link)
 * @param {Object} entry Contentful asset
 */
const mapEntryLink = (entry) => {
  const id = getContentId(entry);
  const contentType = getContentTypeId(entry);
  if (id && contentType) {
    return { id, contentType };
  }

  return {};
};

/**
 * Convert contentful asset to export format
 * @param {Object} entry Contentful asset
 */
const mapAssetLink = (entry) => {
  const fields = {
    mimeType: entry?.fields?.file?.contentType ?? '',
    url: entry?.fields?.file?.url ?? '',
    title: entry?.fields?.title ?? '',
    description: entry?.fields?.description ?? '',
  };

  const details = entry?.fields?.file?.details ?? {};
  if (fields.mimeType.includes('image') && details.image) {
    fields.width = details.image.width;
    fields.height = details.image.height;
  }

  return fields;
};

/**
 * Convert dates with time to ISO String
 * @param {String} fieldContent Date string
 * @return {String}
 */
const mapDateField = (fieldContent) => {
  if (fieldContent && fieldContent.length > 10) {
    return new Date(fieldContent).toISOString();
  }
  return fieldContent;
};

/**
 * Map reference fields
 * @param {Object} fieldContent Entry/Asset value from contentful entry
 * @param {*} options
 */
const mapReferenceField = (fieldContent, options) => {
  const { assets = [], entries = [], mapAssetLink: customMapAssetLink, mapEntryLink: customMapEntryLink } =
    options || {};

  if (isAssetLink(fieldContent)) {
    const asset = assets.find((node) => getContentId(node) === getContentId(fieldContent));

    return typeof customMapAssetLink === 'function' ? customMapAssetLink(asset) : mapAssetLink(asset);
  }

  if (isAsset(fieldContent)) {
    return typeof customMapAssetLink === 'function' ? customMapAssetLink(fieldContent) : mapAssetLink(fieldContent);
  }

  if (isEntryLink(fieldContent)) {
    const entry = entries.find((node) => getContentId(node) === getContentId(fieldContent));

    return typeof customMapEntryLink === 'function'
      ? customMapEntryLink(entry, { ...options, contentType: getContentTypeId(entry) })
      : mapEntryLink(entry);
  }

  if (isEntry(fieldContent)) {
    return typeof customMapEntryLink === 'function'
      ? customMapEntryLink(fieldContent, { ...options, contentType: getContentTypeId(fieldContent) })
      : mapEntryLink(fieldContent);
  }

  return {};
};

/**
 * Convert richtextField to html
 * @param {Object} fieldContent Document value from contentful richtext entry
 * @param {Object} options
 * @returns {String}
 */
const mapRichTextField = (fieldContent, options) => {
  const { richTextRenderer = {} } = options || {};

  if (typeof richTextRenderer === 'function') {
    return richTextRenderer(fieldContent, options);
  }

  return documentToHtmlString(fieldContent, richTextRenderer);
};

/**
 * Map field content from contentful entry
 * @param {*} fieldContent Value from contentful entry
 * @param {Object} options containing field settings from contentful content-type
 * @returns {*} Mapped field content
 */
const mapField = async (fieldContent, options) => {
  const { settings } = options || {};
  const { type, items } = settings || {};

  switch (type) {
    case FIELD_TYPE_DATE:
      return mapDateField(fieldContent);
    case FIELD_TYPE_LINK:
      return mapReferenceField(fieldContent, options);
    case FIELD_TYPE_RICHTEXT:
      return mapRichTextField(fieldContent, options);
    case FIELD_TYPE_ARRAY:
      return mapAsync(fieldContent || [], async (content) => {
        return mapField(content, { ...options, settings: items });
      });
    default:
      return fieldContent;
  }
};

/**
 * Map fields from contentful entry
 * @param {Object} entry Contetful entry
 * @param {Object} options Object containing entries, assets and contentTypes from contentful
 * @returns {Object} Mapped fields
 */
const mapEntry = async (entry, options) => {
  const { contentTypes } = options;
  const contentType = getContentTypeId(entry);
  const { [contentType]: fieldSettings } = getFieldSettings(contentTypes) || {};
  const { sys, fields } = entry;
  const { id, createdAt, updatedAt, publishedAt } = sys || {};
  const meta = {
    id,
    createdAt,
    updatedAt,
    contentType,
  };

  const isRequired = (key) => fieldSettings?.[key]?.required ?? false;

  // process field data
  const data = await mapAsync(Object.entries(fields), async ([key, content]) => {
    const value = await mapField(content, { ...options, settings: fieldSettings[key] || {} });

    return [key, value];
  });

  // check if data is valid (none of the required fields shall be empty)
  const valid = !data.some(([key, value]) => isRequired(key) && typeof value === 'undefined');

  if (valid) {
    return removeEmpty({ ...meta, ...Object.fromEntries(data) });
  }
};

module.exports.mapEntry = mapEntry;
module.exports.mapField = mapField;
module.exports.mapRichTextField = mapRichTextField;
module.exports.mapReferenceField = mapReferenceField;
module.exports.mapDateField = mapDateField;
module.exports.mapEntryLink = mapEntryLink;
module.exports.mapAssetLink = mapAssetLink;
