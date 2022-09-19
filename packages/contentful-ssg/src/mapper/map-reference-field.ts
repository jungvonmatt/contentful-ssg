import type { EntryFields } from 'contentful';
import {
  getContentId,
  getContentTypeId,
  isAsset,
  isAssetLink,
  isEntry,
  isEntryLink,
} from '../lib/contentful.js';
import type {
  Asset,
  Entry,
  MapAssetLink,
  Node,
  RuntimeContext,
  TransformContext,
} from '../types.js';

/**
 * Convert contentful entry to export format (link)
 * @param {Object} entry Contentful asset
 */
export const mapEntryLink = (transformContext: TransformContext) => {
  const { id, contentTypeId } = transformContext;
  if (id && contentTypeId) {
    return { id, contentType: contentTypeId };
  }

  return {};
};

/**
 * Convert contentful asset to export format
 * @param {Object} entry Contentful asset
 */
export const mapAssetLink = (transformContext: TransformContext): MapAssetLink => {
  const { asset } = transformContext;
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
 * Map reference fields
 * @param {Object} fieldContent Entry/Asset value from contentful entry
 * @param {*} options
 */
export const mapReferenceField = async (
  fieldContent: EntryFields.Link<unknown> | Node,
  transformContext: TransformContext,
  runtimeContext: RuntimeContext
) => {
  const { hooks } = runtimeContext;

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
      mapAssetLink
    );
  }

  if (isAsset(fieldContent)) {
    const asset = transformContext.assetMap.get(getContentId(fieldContent));
    return hooks.mapAssetLink(
      {
        ...transformContext,
        asset: asset || (fieldContent as Asset),
        id: getContentId(fieldContent),
        contentTypeId: getContentTypeId(fieldContent),
      },
      mapAssetLink
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
      mapEntryLink
    );
  }

  if (isEntry(fieldContent)) {
    const entry = transformContext.entryMap.get(getContentId(fieldContent));

    return hooks.mapEntryLink(
      {
        ...transformContext,
        id: getContentId(fieldContent),
        contentTypeId: getContentTypeId(fieldContent),
        entry: entry || (fieldContent as Entry),
      },
      mapEntryLink
    );
  }
};
