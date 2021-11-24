import type { RuntimeContext, ContentfulData, Node, Locale, Asset, Entry } from '../types.js';
import Listr from 'listr';
import { mapAsync } from '../lib/array.js';
import { convertToMap, getContentTypeId } from '../lib/contentful.js';

/**
 * Get an ordered list of locales to use for translation based on fallback locales
 * @param {String} code Locale code
 * @param {Array} locales Array of contentful locale objects
 * @returns {Array} E.g. ['en-US', 'en-GB', 'de-DE']
 */
export const getLocaleList = (code: string | null, locales: Locale[] = []): string[] => {
  const locale = locales.find((locale) => locale.code === code);
  return locale ? [locale.code, ...getLocaleList(locale.fallbackCode, locales)] : [];
};

/**
 * Try to get the localized value. Stops at the first valid locale in codes
 * @param {Object} field Object with values for different locales { 'de-DE': '...', 'en-US': '...' }
 * @param  {...any} codes Array with codes generated by getLocaleList
 */
export const localizeField = <T extends Record<string, any>>(field: T, ...codes: string[]): any => {
  const [code, ...fallbackCodes] = codes;
  if (code && Object.prototype.hasOwnProperty.call(field, code)) {
    return field[code];
  }

  if (fallbackCodes.length) {
    return localizeField(field, ...fallbackCodes);
  }
};

/**
 * Localize fields from contentful entry
 * @param {Array} fields Contetful fields array
 * @param {String} code Locale code e.g. 'de-DE'
 * @param {Object} data Object containing locales & content types from contentful
 */
export const localizeEntry = <T extends Node>(
  node: T,
  code: string,
  data: Partial<ContentfulData>
): T => {
  const { locales, fieldSettings } = data;

  const { fields } = node;
  const contentType = getContentTypeId(node as unknown as Node);
  const { [contentType]: settings } = fieldSettings || {};
  const { code: defaultCode = 'unknown' } = (locales || []).find((locale) => locale.default) || {};
  const localeCodes = getLocaleList(code, locales);

  const isLocalized = (key: string) => settings?.[key]?.localized ?? false;

  return {
    ...node,
    fields: Object.fromEntries(
      Object.entries(fields).map(([key, field]) =>
        isLocalized(key)
          ? [key, localizeField(field, ...localeCodes)]
          : [key, localizeField(field, defaultCode)]
      )
    ),
  };
};

/**
 * Localize all entries
 * @param context
 * @returns
 */
export const localize = async (context: RuntimeContext) => {
  const { locales, entries, assets, contentTypes, fieldSettings } = context.data;
  context.localized = new Map();
  return new Listr(
    locales.map((locale) => ({
      title: `${locale.code}`,
      task: async () => {
        const localizedAssets = await mapAsync(assets, async (asset) =>
          localizeEntry<Asset>(asset, locale.code, { locales, contentTypes, fieldSettings })
        );
        const localizedEntries = await mapAsync(entries, async (entry) =>
          localizeEntry<Entry>(entry, locale.code, { locales, contentTypes, fieldSettings })
        );

        context.localized.set(locale.code, {
          assets: localizedAssets,
          entries: localizedEntries,
          assetMap: convertToMap(localizedAssets),
          entryMap: convertToMap(localizedEntries),
        });
      },
    })),
    { concurrent: true }
  );
};
