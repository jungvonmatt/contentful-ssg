import { documentToHtmlString } from '@contentful/rich-text-html-renderer';
import { mapAsync } from '../array.js';
import {
  FIELD_TYPE_ARRAY,
  FIELD_TYPE_DATE,
  FIELD_TYPE_LINK,
  FIELD_TYPE_RICHTEXT,
  getContentId,
  getContentTypeId,
  isAsset,
  isAssetLink,
  isEntry,
  isEntryLink,
} from '../contentful.js';
import { removeEmpty } from '../utils.js';

/**
 * Convert contentful entry to export format (link)
 * @param {Object} entry Contentful asset
 */
export const mapEntryLink = (entry) => {
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
export const mapAssetLink = (entry) => {
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

  if (details.size > 0) {
    fields.fileSize = details.size;
  }

  return fields;
};

/**
 * Convert dates with time to ISO String
 * @param {String} fieldContent Date string
 * @return {String}
 */
export const mapDateField = (fieldContent) => {
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
export const mapReferenceField = (fieldContent, options) => {
  const {
    assets = [],
    entries = [],
    mapAssetLink: customMapAssetLink,
    mapEntryLink: customMapEntryLink,
  } = options || {};

  if (isAssetLink(fieldContent)) {
    const asset = assets.get(getContentId(fieldContent));
    if (!asset) {
      return;
    }
    return typeof customMapAssetLink === 'function' ? customMapAssetLink(asset, options) : mapAssetLink(asset);
  }

  if (isAsset(fieldContent)) {
    return typeof customMapAssetLink === 'function'
      ? customMapAssetLink(fieldContent, options)
      : mapAssetLink(fieldContent);
  }

  if (isEntryLink(fieldContent)) {
    const entry = entries.get(getContentId(fieldContent));
    if (!entry) {
      return;
    }

    return typeof customMapEntryLink === 'function'
      ? customMapEntryLink(entry, { ...options, contentType: getContentTypeId(entry) })
      : mapEntryLink(entry);
  }

  if (isEntry(fieldContent)) {
    return typeof customMapEntryLink === 'function'
      ? customMapEntryLink(fieldContent, { ...options, contentType: getContentTypeId(fieldContent) })
      : mapEntryLink(fieldContent);
  }

  return;
};

const mapRichTextDataNode = (node = {}, options) => {
  const { target } = node;
  if (target) {
    return mapReferenceField(target, options);
  }
  return node;
};

const mapRichTextContentNode = (node = [], options) => {
  const contentArray = [];
  for (const item of node) {
    contentArray.push(mapRichTextNodes(item, options));
  }
  return contentArray;
};

const mapRichTextMarks = (node = []) => {
  const markArray = [];
  for (const item of node) {
    markArray.push(item.type);
  }
  return markArray;
};

const mapRichTextNodes = (node, options) => {
  const fieldContent = {};
  if (typeof node === 'undefined') {
    return;
  }
  for (const field of Object.keys(node)) {
    const subNode = node[field];
    switch (field) {
      case 'data': {
        fieldContent[field] = mapRichTextDataNode(subNode, options);
        break;
      }
      case 'content': {
        fieldContent[field] = mapRichTextContentNode(subNode, options);
        break;
      }
      case 'marks': {
        fieldContent[field] = mapRichTextMarks(subNode, options);
        break;
      }
      default:
        fieldContent[field] = node[field];
        break;
    }
  }
  return fieldContent;
};

/**
 * Convert richtextField to html
 * @param {Object} fieldContent Document value from contentful richtext entry
 * @param {Object} options
 * @returns {String|Array}
 */
export const mapRichTextField = (fieldContent, options) => {
  const { richTextRenderer = {} } = options || {};

  if (typeof richTextRenderer === 'function') {
    return richTextRenderer(fieldContent, options);
  }

  if (richTextRenderer === false) {
    return mapRichTextNodes(fieldContent, options);
  }

  return documentToHtmlString(fieldContent, richTextRenderer);
};

/**
 * Map field content from contentful entry
 * @param {*} fieldContent Value from contentful entry
 * @param {Object} options containing field settings from contentful content-type
 * @returns {*} Mapped field content
 */
export const mapField = async (fieldContent, options) => {
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
export const mapEntry = async (entry, options) => {
  const { contentTypes, fieldSettings } = options;
  const contentType = getContentTypeId(entry);
  // const { [contentType]: fieldSettings } = getFieldSettings(contentTypes) || {};
  const { [contentType]: settings } = fieldSettings;
  const { sys, fields } = entry;
  const { id, createdAt, updatedAt, publishedAt } = sys || {};
  const meta = {
    id,
    createdAt,
    updatedAt,
    contentType,
  };

  const requiredFields = Object.entries(settings)
    .filter(([, value]) => value.required)
    .map(([key]) => key);

  // process field data
  const data = await mapAsync(Object.entries(fields), async ([key, content]) => {
    const value = await mapField(content, { ...options, settings: settings[key] || {} });

    return [key, value];
  });

  // Filter undefined values & convert back to object
  const filtered = Object.fromEntries(data.filter(([, value]) => typeof value !== 'undefined'));
  // List of all fields available in entry
  const keys = Object.keys(filtered);
  // Valid if all required fields are available in keys
  const valid = requiredFields.every((key) => keys.includes(key));

  if (valid) {
    return removeEmpty({ ...meta, ...filtered });
  }
};
