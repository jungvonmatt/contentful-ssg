import { type TransformContext } from '../types.js';

/**
 * Map meta fields object
 * @param {Object} entry Contentful entry
 * @param {Object} options Object containing contentType, spaceId, etc. from contentful
 * @returns {Object} Mapped meta fields
 */
export const mapMetaFields = (transformContext: TransformContext) => {
  const { entry, contentTypeId } = transformContext;
  const { sys } = entry;
  const { id, createdAt, updatedAt } = sys || {};

  return {
    sys: { id, contentType: contentTypeId, createdAt, updatedAt },
  };
};
