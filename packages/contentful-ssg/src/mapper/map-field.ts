import type { Document } from '@contentful/rich-text-types';
import type { EntryFields, EntrySkeletonType } from 'contentful';
import {
  FIELD_TYPE_ARRAY,
  FIELD_TYPE_DATE,
  FIELD_TYPE_LINK,
  FIELD_TYPE_RICHTEXT,
} from '../lib/contentful.js';
import type { Asset, Config, Entry, RuntimeContext, TransformContext } from '../types.js';
import { mapDateField } from './map-date-field.js';
import { mapReferenceField } from './map-reference-field.js';
import { mapRichTextField } from './map-rich-text-field.js';

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
  const { fieldSettings, fieldContent } = transformContext;
  const { type, items } = fieldSettings || {};

  switch (type) {
    case FIELD_TYPE_DATE:
      return mapDateField(fieldContent as EntryFields.Date);
    case FIELD_TYPE_LINK:
      return mapReferenceField(
        fieldContent as EntryFields.EntryLink<EntrySkeletonType> | Asset | Entry,
        transformContext,
        runtimeContext,
      );
    case FIELD_TYPE_RICHTEXT:
      return mapRichTextField(fieldContent as Document, transformContext, runtimeContext, config);
    case FIELD_TYPE_ARRAY:
      return Promise.all(
        ((fieldContent || []) as EntryFields.Array<any>).map(async (content) =>
          mapField(
            {
              ...transformContext,
              fieldSettings: { ...fieldSettings, ...items },
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
