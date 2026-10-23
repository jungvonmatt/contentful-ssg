import type { DeletedEntry, EntryFields, EntrySkeletonType } from 'contentful';
import type { ContentType, FieldSettings, KeyValueMap, Node, NodeRaw } from './types.js';

// --- Constants ---
export const FIELD_TYPE_SYMBOL = 'Symbol';
export const FIELD_TYPE_TEXT = 'Text';
export const FIELD_TYPE_RICHTEXT = 'RichText';
export const FIELD_TYPE_NUMBER = 'Number';
export const FIELD_TYPE_INTEGER = 'Integer';
export const FIELD_TYPE_DATE = 'Date';
export const FIELD_TYPE_LOCATION = 'Location';
export const FIELD_TYPE_ARRAY = 'Array';
export const FIELD_TYPE_BOOLEAN = 'Boolean';
export const FIELD_TYPE_LINK = 'Link';
export const FIELD_TYPE_OBJECT = 'Object';
export const LINK_TYPE_ASSET = 'Asset';
export const LINK_TYPE_ENTRY = 'Entry';

// --- Accessors ---

/**
 * Get contentType id from entry
 */
export const getContentTypeId = <
  T extends Node | NodeRaw | EntryFields.EntryLink<EntrySkeletonType> | DeletedEntry,
>(
  node: T,
): string => {
  if (node?.sys?.type === 'Asset') {
    return 'asset';
  }

  if (node?.sys?.type === 'DeletedEntry') {
    return 'unknown';
  }

  return node?.sys?.contentType?.sys?.id ?? 'unknown';
};

/**
 * Get environment id from entry
 */
export const getEnvironmentId = <T extends Node | NodeRaw>(node: T): string =>
  node?.sys?.environment?.sys?.id ?? 'unknown';

/**
 * Get content id from entry
 */
export const getContentId = <
  T extends Node | NodeRaw | ContentType | EntryFields.Link<EntrySkeletonType> | DeletedEntry,
>(
  node: T,
): string => node?.sys?.id ?? 'unknown';

// --- Type Guards ---

/**
 * Check if the passed object looks like a regular contentful entity (entry or asset)
 */
export const isContentfulObject = (obj: any) =>
  Object.prototype.toString.call(obj) === '[object Object]' && Object.keys(obj).includes('sys');

/**
 * Check if the passed object is a contentful link object
 */
export const isLink = (obj: any) => isContentfulObject(obj) && obj.sys.type === FIELD_TYPE_LINK;

/**
 * Check if the passed object is a contentful asset link object
 */
export const isAssetLink = (obj: any) => isLink(obj) && obj.sys.linkType === LINK_TYPE_ASSET;

/**
 * Check if the passed object is a contentful entry link object
 */
export const isEntryLink = (obj: any) =>
  isContentfulObject(obj) && obj.sys.linkType === LINK_TYPE_ENTRY;

/**
 * Check if the passed object is a contentful asset object
 */
export const isAsset = (obj: any) => isContentfulObject(obj) && obj.sys.type === LINK_TYPE_ASSET;

/**
 * Check if the passed object is a contentful entry object
 */
export const isEntry = (obj: any) => isContentfulObject(obj) && obj.sys.type === LINK_TYPE_ENTRY;

// --- Converters ---

/**
 * Convert content type list to a field settings map
 */
export const getFieldSettings = (contentTypes: ContentType[]): FieldSettings => {
  const result: FieldSettings = {};
  for (const contentType of contentTypes) {
    const id = getContentId(contentType);
    const fields: Record<string, ContentType['fields'][number]> = {};
    for (const field of contentType.fields) {
      fields[field.id] = field;
    }
    result[id] = fields;
  }
  return result;
};

/**
 * Convert entries/assets array to map keyed by content id
 */
export const convertToMap = <T extends Node | NodeRaw>(nodes: T[] = []) =>
  new Map(nodes.map((node) => [getContentId(node), node]));
