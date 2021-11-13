import type {
  RuntimeContext,
  Config,
  TransformContext,
  Asset,
  Entry,
  MapAssetLink,
  RichTextData,
  Node,
} from '../types.js';
import type {EntryFields} from 'contentful';
import type {Options} from '@contentful/rich-text-html-renderer';
import type {
  Document,
  Mark,
  TopLevelBlock,
  Node as RichTextNode,
} from '@contentful/rich-text-types';
import {documentToHtmlString} from '@contentful/rich-text-html-renderer';
import {removeEmpty} from '../helper/object.js';

import {
  FIELD_TYPE_RICHTEXT,
  FIELD_TYPE_DATE,
  FIELD_TYPE_ARRAY,
  FIELD_TYPE_LINK,
  getContentId,
  getContentTypeId,
  isAssetLink,
  isEntryLink,
  isAsset,
  isEntry,
} from '../helper/contentful.js';
import type {KeyValueMap} from 'contentful-management/types';

/**
 * Convert contentful entry to export format (link)
 * @param {Object} entry Contentful asset
 */
export const mapEntryLink = (transformContext: TransformContext) => {
  const {id, contentTypeId} = transformContext;
  if (id && contentTypeId) {
    return {id, contentType: contentTypeId};
  }

  return {};
};

/**
 * Convert contentful asset to export format
 * @param {Object} entry Contentful asset
 */
export const mapAssetLink = (transformContext: TransformContext): MapAssetLink => {
  const {asset} = transformContext;
  const fields: MapAssetLink = {
    mimeType: asset?.fields?.file?.contentType ?? '',
    url: asset?.fields?.file?.url ?? '',
    title: asset?.fields?.title ?? '',
    description: asset?.fields?.description ?? '',
  };

  const details = asset?.fields?.file?.details;
  if (fields.mimeType.includes('image') && details?.image) {
    fields.width = details.image.width;
    fields.height = details.image.height;
  }

  if (details?.size) {
    fields.fileSize = details.size;
  }

  return fields;
};

/**
 * Convert dates with time to ISO String
 * @param {String} fieldContent Date string
 * @return {String}
 */
export const mapDateField = (fieldContent: string) => {
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
export const mapReferenceField = async (
  fieldContent: EntryFields.Link<unknown> | Node,
  transformContext: TransformContext,
  runtimeContext: RuntimeContext,
) => {
  const {hooks} = runtimeContext;

  if (isAssetLink(fieldContent)) {
    const asset = transformContext.assetMap.get(getContentId(fieldContent));
    if (!asset) {
      return;
    }

    return hooks.mapAssetLink(
      {
        ...transformContext,
        asset,
        id: getContentId(asset),
        contentTypeId: getContentTypeId(asset),
      },
      mapAssetLink,
    );
  }

  if (isAsset(fieldContent)) {
    return hooks.mapAssetLink(
      {
        ...transformContext,
        asset: fieldContent as Asset,
        id: getContentId(fieldContent),
        contentTypeId: getContentTypeId(fieldContent),
      },
      mapAssetLink,
    );
  }

  if (isEntryLink(fieldContent)) {
    const entry = transformContext.entryMap.get(getContentId(fieldContent));
    if (!entry) {
      return;
    }

    return hooks.mapEntryLink(
      {
        ...transformContext,
        id: getContentId(entry),
        contentTypeId: getContentTypeId(entry),
        entry,
      },
      mapEntryLink,
    );
  }

  if (isEntry(fieldContent)) {
    return hooks.mapEntryLink(
      {
        ...transformContext,
        id: getContentId(fieldContent),
        contentTypeId: getContentTypeId(fieldContent),
        entry: fieldContent as Entry,
      },
      mapEntryLink,
    );
  }
};

export const mapRichTextDataNode = (
  node: RichTextData,
  transformContext: TransformContext,
  runtimeContext: RuntimeContext,
) => {
  const {target} = node || {};
  if (target) {
    return mapReferenceField(target as EntryFields.Link<unknown>, transformContext, runtimeContext);
  }

  return node;
};

export const mapRichTextContentNode = async (
  nodes: TopLevelBlock[],
  transformContext: TransformContext,
  runtimeContext: RuntimeContext,
) =>
  Promise.all(
    (nodes || []).map(async node => mapRichTextNodes(node, transformContext, runtimeContext)),
  );

export const mapRichTextMarks = (nodes: Mark[] = []) => (nodes || []).map(node => node.type);

export const mapRichTextNodes = async (
  node: RichTextNode,
  transformContext: TransformContext,
  runtimeContext: RuntimeContext,
) => {
  const fieldContent: Record<string, any> = {};
  if (typeof node === 'undefined') {
    return;
  }

  for (const [field, subNode] of Object.entries(node)) {
    switch (field) {
      case 'data': {
        // eslint-disable-next-line no-await-in-loop
        fieldContent[field] = await mapRichTextDataNode(
          subNode as RichTextData,
          transformContext,
          runtimeContext,
        );
        break;
      }

      case 'content': {
        // eslint-disable-next-line no-await-in-loop
        fieldContent[field] = await mapRichTextContentNode(
          subNode as TopLevelBlock[],
          transformContext,
          runtimeContext,
        );
        break;
      }

      case 'marks': {
        fieldContent[field] = mapRichTextMarks(subNode as Mark[]);
        break;
      }

      default:
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        fieldContent[field] = subNode;
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
export const mapRichTextField = (
  fieldContent: Document,
  transformContext: TransformContext,
  runtimeContext: RuntimeContext,
  config: Config,
) => {
  const {richTextRenderer = {}} = config || {};

  if (typeof richTextRenderer === 'function') {
    return richTextRenderer(fieldContent, transformContext, runtimeContext);
  }

  if (richTextRenderer === false) {
    return mapRichTextNodes(fieldContent, transformContext, runtimeContext);
  }

  return documentToHtmlString(fieldContent, richTextRenderer as Options);
};

/**
 * Map field content from contentful entry
 * @param {*} fieldContent Value from contentful entry
 * @param {Object} options containing field settings from contentful content-type
 * @returns {*} Mapped field content
 */
export const mapField = async (
  transformContext: TransformContext,
  runtimeContext: RuntimeContext,
  config: Config,
): Promise<unknown> => {
  const {fieldSettings, fieldContent} = transformContext;
  const {type, items} = fieldSettings || {};

  switch (type) {
    case FIELD_TYPE_DATE:
      return mapDateField(fieldContent as EntryFields.Date);
    case FIELD_TYPE_LINK:
      return mapReferenceField(
        fieldContent as EntryFields.Link<unknown> | Asset | Entry,
        transformContext,
        runtimeContext,
      );
    case FIELD_TYPE_RICHTEXT:
      return mapRichTextField(fieldContent as Document, transformContext, runtimeContext, config);
    case FIELD_TYPE_ARRAY:
      return Promise.all(
        ((fieldContent || []) as EntryFields.Array).map(async content =>
          mapField(
            {
              ...transformContext,
              fieldSettings: {...fieldSettings, ...items},
              fieldContent: content,
            },
            runtimeContext,
            config,
          ),
        ),
      );

    default:
      return fieldContent;
  }
};

/**
 * Map meta fields object
 * @param {Object} entry Contentful entry
 * @param {Object} options Object containing contentType, spaceId, etc. from contentful
 * @returns {Object} Mapped meta fields
 */
export const mapMetaFields = (transformContext: TransformContext) => {
  const {entry, contentTypeId} = transformContext;
  const {sys} = entry;
  const {id, createdAt, updatedAt} = sys || {};

  return {
    sys: {id, contentType: contentTypeId, createdAt, updatedAt},
  };
};

/**
 * Map fields from contentful entry
 * @param {Object} entry Contetful entry
 * @param {Object} options Object containing entries, assets and contentTypes from contentful
 * @returns {Object} Mapped fields
 */
export const mapEntry = async (
  transformContext: TransformContext,
  runtimeContext: RuntimeContext,
  config: Config,
) => {
  const {fieldSettings} = runtimeContext.data;
  const {entry, contentTypeId} = transformContext;
  const {[contentTypeId]: settings} = fieldSettings;

  const sys = await runtimeContext.hooks.mapMetaFields(transformContext, mapMetaFields);

  // Process field data
  const data = await Promise.all(
    Object.entries(entry.fields).map(async ([fieldId, fieldContent]) => {
      const value = await mapField(
        {
          ...transformContext,
          fieldId,
          fieldContent: fieldContent as unknown,
          fieldSettings: settings[fieldId],
        },
        runtimeContext,
        config,
      );

      return [fieldId, value];
    }),
  );

  // Filter undefined values & convert back to object
  const fields = removeEmpty<KeyValueMap>(
    Object.fromEntries(data.filter(([, value]) => typeof value !== 'undefined')),
  );

  const result = {...sys, ...fields};

  const requiredFields = Object.entries(settings)
    .filter(([, value]) => value.required)
    .map(([key]) => key);
  // Check if all required fields are available in keys
  const requiredFieldMissing = !requiredFields.every(key => Object.keys(fields).includes(key));

  let valid = !requiredFieldMissing;
  if (typeof config.validate === 'function') {
    valid = await config.validate(
      {...transformContext, requiredFields, content: result},
      runtimeContext,
    );
  }

  if (valid) {
    return result;
  }
};

export const transform = async (
  transformContext: TransformContext,
  runtimeContext: RuntimeContext,
  config: Config,
) => {
  const initialValue = await mapEntry(transformContext, runtimeContext, config);
  return runtimeContext.hooks.transform(transformContext, initialValue);
};
