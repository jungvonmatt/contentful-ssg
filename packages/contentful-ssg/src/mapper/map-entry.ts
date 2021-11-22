import type {Config, KeyValueMap, RuntimeContext, TransformContext} from '../types.js';
import {ValidationError} from '../lib/error.js';
import {removeEmpty} from '../lib/object.js';
import {mapField} from './map-field.js';
import {mapMetaFields} from './map-meta-fields.js';

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
  const {spaceId} = runtimeContext.config;
  const {environmentId} = runtimeContext.config;
  const {fieldSettings} = runtimeContext.data;
  const {entry, contentTypeId, id, locale} = transformContext;
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
  const missingFields = requiredFields.filter(key => !Object.keys(fields).includes(key));

  let valid = missingFields.length === 0;
  if (typeof config.validate === 'function') {
    valid = await config.validate(
      {...transformContext, requiredFields, missingFields, content: result},
      runtimeContext,
    );
  }

  if (valid) {
    return result;
  }

  throw new ValidationError({
    spaceId,
    environmentId,
    entryId: id,
    contentTypeId,
    missingFields,
    locale,
  });
};
