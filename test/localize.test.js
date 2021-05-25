/* eslint-env jest */
import { getContentId, getFieldSettings } from '../lib/contentful';
import { getLocaleList, localizeEntry, localizeField } from '../lib/transform/localize';
import { getContent } from './utils';

describe('Localize', () => {
  test('getLocaleList', async () => {
    const locales = [
      {
        code: '1',
        fallbackCode: '2',
      },
      {
        code: '2',
        fallbackCode: '3',
      },
      {
        code: '3',
        fallbackCode: '4',
      },
    ];

    expect(getLocaleList('1', locales).join('-')).toEqual('1-2-3');
    expect(getLocaleList('2', locales).join('-')).toEqual('2-3');
    expect(getLocaleList('3', locales).join('-')).toEqual('3');
    // There's no locale for '4' available, so it should be empty
    expect(getLocaleList('4', locales).length).toEqual(0);
  });

  test('localizeField', async () => {
    const field = { b: 'b', c: 'c' };

    expect(localizeField(field, ...['a', 'b', 'c'])).toEqual('b');
    expect(localizeField(field, ...['a', 'c'])).toEqual('c');
    expect(localizeField(field, 'b')).toEqual('b');
    expect(localizeField(field, 'c')).toEqual('c');
    expect(localizeField(field, ...['a'])).toBeUndefined();
  });

  test('Localize entry', async () => {
    const { entries, assets, contentTypes, locales } = await getContent();
    const fieldSettings = getFieldSettings(contentTypes);
    const entry = entries.find((entry) => getContentId(entry) === '34O95Y8gLXd3jPozdy7gmd');

    const { fields: fieldsDe } = localizeEntry(entry, 'de', { fieldSettings, locales });
    expect(fieldsDe.shortText).toEqual('Short Text (DE)');
    expect(fieldsDe.longText).toEqual('__Long text (de-DE)__\n');
    expect(fieldsDe.integer).toEqual(3);
    expect(fieldsDe.decimal).toEqual(14);

    const { fields: fieldsEn } = localizeEntry(entry, 'en-GB', { fieldSettings, locales });
    expect(fieldsEn.shortText).toEqual('Short Text (EN)');
    expect(fieldsEn.longText).toEqual('__Long text (en-GB)__\n');
    expect(fieldsEn.integer).toEqual(2);
    expect(fieldsEn.decimal).toEqual(12);
  });

  test('Localize asset', async () => {
    const { entries, assets, contentTypes, locales } = await getContent();
    const fieldSettings = getFieldSettings(contentTypes);
    const asset = assets.find((asset) => getContentId(asset) === '3t1t8PDynjpXbAzv6zOVQq');

    const { fields } = localizeEntry(asset, 'en-US', { fieldSettings, locales });

    expect(fields).toEqual({
      title: 'FuBK',
      description: 'Dummy image',
      file: {
        url: '//images.ctfassets.net/gpdredy5px7h/3t1t8PDynjpXbAzv6zOVQq/7f4143c74191766d87f86d0035d91d28/FuBK_testcard_vectorized.svg',
        details: {
          size: 120_093,
          image: {
            width: 768,
            height: 576,
          },
        },
        fileName: 'FuBK_testcard_vectorized.svg',
        contentType: 'image/svg+xml',
      },
    });
  });
});
