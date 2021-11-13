/* eslint-env jest */
import { getContent } from '../__test__/mock.js';
import {
  convertToMap,
  getContentId,
  getContentTypeId,
  getEnvironmentId,
  getFieldSettings,
  isAsset,
  isAssetLink,
  isEntry,
  isEntryLink,
  isLink,
} from './contentful';

describe('Contentful', () => {
  test('isAssetLink', async () => {
    const { entry, asset, entryLink, assetLink } = await getContent();
    expect(isAssetLink(assetLink)).toBe(true);
    expect(isAssetLink(entryLink)).toBe(false);
    expect(isAssetLink(entry)).toBe(false);
    expect(isAssetLink(asset)).toBe(false);
  });

  test('isEntryLink', async () => {
    const { entry, asset, entryLink, assetLink } = await getContent();
    expect(isEntryLink(assetLink)).toBe(false);
    expect(isEntryLink(entryLink)).toBe(true);
    expect(isEntryLink(entry)).toBe(false);
    expect(isEntryLink(asset)).toBe(false);
  });

  test('isAsset', async () => {
    const { entry, asset, entryLink, assetLink } = await getContent();
    expect(isAsset(assetLink)).toBe(false);
    expect(isAsset(entryLink)).toBe(false);
    expect(isAsset(entry)).toBe(false);
    expect(isAsset(asset)).toBe(true);
  });

  test('isEntry', async () => {
    const { entry, asset, entryLink, assetLink } = await getContent();
    expect(isEntry(assetLink)).toBe(false);
    expect(isEntry(entryLink)).toBe(false);
    expect(isEntry(entry)).toBe(true);
    expect(isEntry(asset)).toBe(false);
  });
  test('isLink', async () => {
    const { entry, asset, entryLink, assetLink } = await getContent();
    expect(isLink(assetLink)).toBe(true);
    expect(isLink(entryLink)).toBe(true);
    expect(isLink(entry)).toBe(false);
    expect(isLink(asset)).toBe(false);
  });

  test('getFieldSettings', async () => {
    const { contentTypes } = await getContent();
    const fieldSettings = getFieldSettings(contentTypes);

    expect(Object.keys(fieldSettings)).toContain('fieldTest');
    expect(Object.keys(fieldSettings.fieldTest)).toContain('shortTextList');
    expect(Object.values(fieldSettings.fieldTest)).toContainEqual({
      id: 'shortTextList',
      name: 'Short text (list)',
      type: 'Array',
      localized: true,
      required: false,
      disabled: false,
      omitted: false,
      items: {
        type: 'Symbol',
        validations: [],
      },
    });
  });

  test('getContentId', async () => {
    const { entry } = await getContent();
    expect(getContentId(entry)).toEqual('34O95Y8gLXd3jPozdy7gmd');
  });

  test('getContentTypeId', async () => {
    const { entry } = await getContent();
    expect(getContentTypeId(entry)).toEqual('fieldTest');
  });

  test('getEnvironmentId', async () => {
    const { entry } = await getContent();
    expect(getEnvironmentId(entry)).toEqual('master');
  });

  test('convertToMap', async () => {
    const { entries } = await getContent();
    const entryMap = convertToMap(entries);

    const ids = [
      '34O95Y8gLXd3jPozdy7gmd',
      'WLITBNhFp0VzHqOwKJAwR',
      '56O29iIIcee0ZcgIuwlHSv',
      '2WLqjLlMJUbc0vCf9UMfjA',
    ];

    expect(entryMap.size).toBe(ids.length);
    ids.forEach((id) => expect(entryMap.has(id)).toBe(true));
  });
});
