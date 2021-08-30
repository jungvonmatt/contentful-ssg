/* eslint-env jest */
const { BLOCKS, INLINES, MARKS } = require('@contentful/rich-text-types');

const { readFixture, getContent } = require('./utils');
const {
  FIELD_TYPE_SYMBOL,
  FIELD_TYPE_BOOLEAN,
  FIELD_TYPE_NUMBER,
  FIELD_TYPE_INTEGER,
  FIELD_TYPE_ARRAY,
  FIELD_TYPE_OBJECT,
  FIELD_TYPE_TEXT,
  FIELD_TYPE_RICHTEXT,
  FIELD_TYPE_DATE,
  FIELD_TYPE_LOCATION,
  FIELD_TYPE_LINK,
  LINK_TYPE_ASSET,
  LINK_TYPE_ENTRY,
  getContentId,
  getContentTypeId,
  convertToMap,
  getFieldSettings,
} = require('../lib/contentful');

const { mapField, mapEntry } = require('../lib/transform/mapper');
const { localizeEntry } = require('../lib/transform/localize');

describe('Mapper - mapField', () => {
  test('Symbol', async () => {
    const value = await mapField('Symbol', {
      settings: { type: FIELD_TYPE_SYMBOL },
    });
    expect(value).toEqual('Symbol');
  });
  test('Symbol Integer', async () => {
    const value = await mapField(1, {
      settings: { type: FIELD_TYPE_INTEGER },
    });
    expect(value).toEqual(1);
  });
  test('Symbol Decimal', async () => {
    const value = await mapField(1.3, {
      settings: { type: FIELD_TYPE_NUMBER },
    });
    expect(value).toEqual(1.3);
  });
  test('Symbol (Array)', async () => {
    const value = await mapField(['Symbol 1', 'Symbol 2', 'Symbol 3'], {
      settings: {
        type: FIELD_TYPE_ARRAY,
        items: { type: FIELD_TYPE_SYMBOL },
      },
    });
    expect(value).toEqual(['Symbol 1', 'Symbol 2', 'Symbol 3']);
  });
  test('Text', async () => {
    const value = await mapField('__Long text__\n', {
      settings: { type: FIELD_TYPE_TEXT },
    });
    expect(value).toEqual('__Long text__\n');
  });
  test('RichText', async () => {
    const content = await readFixture('richtext.json');
    const expected =
      '<p><b>Rich text (EN)</b></p><p><span>type: entry-hyperlink id: WLITBNhFp0VzHqOwKJAwR</span></p><p><span>type: asset-hyperlink id: 3t1t8PDynjpXbAzv6zOVQq</span></p><p></p><p></p>';
    const value = await mapField(content, {
      settings: { type: FIELD_TYPE_RICHTEXT },
    });

    expect(value).toEqual(expected);
  });

  test('DateTime', async () => {
    const value = await mapField('2021-01-14T12:00', {
      settings: { type: FIELD_TYPE_DATE },
    });
    expect(value).toEqual(new Date('2021-01-14T12:00').toISOString());
  });

  test('Date', async () => {
    const value = await mapField('2021-01-14', {
      settings: { type: FIELD_TYPE_DATE },
    });
    expect(value).toEqual('2021-01-14');
  });

  test('Location', async () => {
    const location = {
      lon: 13.422140718124993,
      lat: 52.47504074424066,
    };
    const value = await mapField(location, {
      settings: { type: FIELD_TYPE_LOCATION },
    });
    expect(value).toEqual(location);
  });

  test('Boolean', async () => {
    const valueTrue = await mapField(true, { settings: { type: FIELD_TYPE_BOOLEAN } });
    const valueFalse = await mapField(false, { settings: { type: FIELD_TYPE_BOOLEAN } });
    expect(valueTrue).toEqual(true);
    expect(valueFalse).toEqual(false);
  });

  test('JSON Object', async () => {
    const data = { JSON: { A: [1, 2, 3] } };
    const value = await mapField(data, {
      settings: { type: FIELD_TYPE_OBJECT },
    });
    expect(value).toEqual(data);
  });

  test('Asset Link (Image)', async () => {
    const assets = await readFixture('assets.json');
    const locales = await readFixture('locales.json');
    const contentTypes = await readFixture('content_types.json');
    const fieldSettings = getFieldSettings(contentTypes);
    const translatedAssets = await assets.map((asset) => localizeEntry(asset, 'en-GB', { fieldSettings, locales }));

    const [asset] = translatedAssets;

    const link = {
      sys: {
        type: FIELD_TYPE_LINK,
        linkType: LINK_TYPE_ASSET,
        id: getContentId(asset),
      },
    };

    const expected = {
      mimeType: asset.fields.file.contentType,
      url: asset.fields.file.url,
      title: asset.fields.title,
      description: asset.fields.description,
      width: asset.fields.file.details.image.width,
      height: asset.fields.file.details.image.height,
      fileSize: asset.fields.file.details.size,
    };

    const value = await mapField(link, {
      settings: { type: FIELD_TYPE_LINK },
      assets: convertToMap(translatedAssets),
    });

    expect(value).toEqual(expected);
  });

  test('Asset Link (Array)', async () => {
    const assets = await readFixture('assets.json');
    const locales = await readFixture('locales.json');
    const contentTypes = await readFixture('content_types.json');
    const fieldSettings = getFieldSettings(contentTypes);
    const translatedAssets = await assets.map((asset) => localizeEntry(asset, 'en-GB', { fieldSettings, locales }));

    const [asset] = translatedAssets;
    const link = {
      sys: {
        type: FIELD_TYPE_LINK,
        linkType: LINK_TYPE_ASSET,
        id: getContentId(asset),
      },
    };

    const expected = {
      mimeType: asset.fields.file.contentType,
      url: asset.fields.file.url,
      title: asset.fields.title,
      description: asset.fields.description,
      width: asset.fields.file.details.image.width,
      height: asset.fields.file.details.image.height,
      fileSize: asset.fields.file.details.size,
    };

    const value = await mapField([link, link], {
      settings: {
        type: FIELD_TYPE_ARRAY,
        items: {
          type: FIELD_TYPE_LINK,
          linkType: LINK_TYPE_ASSET,
        },
      },
      assets: convertToMap(translatedAssets),
      entries: new Map(),
      fieldSettings,
    });

    expect(value).toEqual([expected, expected]);
  });

  test('Asset Link (invalid)', async () => {
    const link = {
      sys: {
        type: FIELD_TYPE_LINK,
        linkType: LINK_TYPE_ENTRY,
        id: 'asdasd',
      },
    };

    const value = await mapField(link, {
      settings: { type: FIELD_TYPE_LINK },
      assets: new Map(),
      entries: new Map(),
    });

    expect(value).toEqual(undefined);
  });

  test('Entry Link', async () => {
    const entries = await readFixture('entries.json');
    const [entry] = entries;

    const link = {
      sys: {
        type: FIELD_TYPE_LINK,
        linkType: LINK_TYPE_ENTRY,
        id: getContentId(entry),
      },
    };

    const expected = { id: getContentId(entry), contentType: getContentTypeId(entry) };

    const value = await mapField(link, {
      settings: { type: FIELD_TYPE_LINK },
      entries: convertToMap(entries),
      assets: new Map(),
    });

    expect(value).toEqual(expected);
  });

  test('Entry Link (invalid)', async () => {
    const entries = await readFixture('entries.json');
    const [entry] = entries;

    const link = {
      sys: {
        type: FIELD_TYPE_LINK,
        linkType: LINK_TYPE_ENTRY,
        id: getContentId(entry),
      },
    };

    const value = await mapField(link, {
      settings: { type: FIELD_TYPE_LINK },
      entries: new Map(),
      assets: new Map(),
    });

    expect(value).toEqual(undefined);
  });

  test('Entry Link (Array)', async () => {
    const entries = await readFixture('entries.json');
    const contentTypes = await readFixture('content_types.json');
    const [entry] = entries;
    const link = {
      sys: {
        type: FIELD_TYPE_LINK,
        linkType: LINK_TYPE_ENTRY,
        id: getContentId(entry),
      },
    };

    const data = { id: getContentId(entry), contentType: getContentTypeId(entry) };

    const value = await mapField([link, link], {
      settings: {
        type: FIELD_TYPE_ARRAY,
        items: {
          type: FIELD_TYPE_LINK,
          linkType: LINK_TYPE_ENTRY,
        },
      },
      entries: convertToMap(entries),
      fieldSettings: getFieldSettings(contentTypes),
    });

    expect(value).toEqual([data, data]);
  });
});

describe('Mapper - mapEntry', () => {
  const createLocalizedEntryAndOptions = async () => {
    const { entries, assets, contentTypes, locales } = await getContent();
    const [entry] = entries;
    const fieldSettings = getFieldSettings(contentTypes);

    const translatedAssets = await assets.map((asset) => localizeEntry(asset, 'en-GB', { locales, fieldSettings }));

    const localized = await localizeEntry(entry, 'en-GB', { fieldSettings, locales });
    const options = {
      entries,
      assets: convertToMap(translatedAssets),
      entries: convertToMap(entries),
      contentTypes,
      fieldSettings,
    };

    return [localized, options];
  };

  test('Maps entry', async () => {
    const [localized, options] = await createLocalizedEntryAndOptions();
    const result = await mapEntry(localized, options);

    expect(result).toEqual({
      id: '34O95Y8gLXd3jPozdy7gmd',
      createdAt: '2021-01-14T13:17:17.232Z',
      updatedAt: '2021-01-14T13:35:12.671Z',
      contentType: 'fieldTest',
      shortText: 'Short Text (EN)',
      shortTextList: ['List 1 (gb)', 'List 2 (gb)'],
      longText: '__Long text (en-GB)__\n',
      richText:
        '<p><b>Rich text (EN)</b></p><p><span>type: entry-hyperlink id: WLITBNhFp0VzHqOwKJAwR</span></p><p><span>type: asset-hyperlink id: 3t1t8PDynjpXbAzv6zOVQq</span></p><p></p><p></p>',
      integer: 2,
      decimal: 12,
      dateTime: new Date('2021-01-14T12:00').toISOString(),
      date: '2021-01-19',
      location: { lon: 13.422140718124993, lat: 52.47504074424066 },
      media: {
        mimeType: 'image/svg+xml',
        url:
          '//images.ctfassets.net/gpdredy5px7h/3t1t8PDynjpXbAzv6zOVQq/7f4143c74191766d87f86d0035d91d28/FuBK_testcard_vectorized.svg',
        title: 'FuBK',
        description: 'Dummy image',
        width: 768,
        height: 576,
        fileSize: 120093,
      },
      mediaList: [
        {
          mimeType: 'image/svg+xml',
          url:
            '//images.ctfassets.net/gpdredy5px7h/3t1t8PDynjpXbAzv6zOVQq/7f4143c74191766d87f86d0035d91d28/FuBK_testcard_vectorized.svg',
          title: 'FuBK',
          description: 'Dummy image',
          width: 768,
          height: 576,
          fileSize: 120093,
        },
      ],
      boolean: false,
      jsonObject: { JSON: 'OBJECT' },
      reference: { id: '56O29iIIcee0ZcgIuwlHSv', contentType: 'fieldTest' },
      referenceList: [
        { id: '2WLqjLlMJUbc0vCf9UMfjA', contentType: 'fieldTest' },
        { id: '56O29iIIcee0ZcgIuwlHSv', contentType: 'fieldTest' },
      ],
    });
  });

  test('Map meta fields', async () => {
    const [localized, options] = await createLocalizedEntryAndOptions();

    const customMetaFields = () => {
      const { sys } = localized;
      const { id, createdAt, updatedAt } = sys || {};
      const { contentType } = options;

      return {
        sys: {
          id,
          contentType,
          createdAt,
          updatedAt,
        },
      };
    };

    options.contentType = getContentTypeId(localized);
    options.mapMetaFields = customMetaFields;

    const result = await mapEntry(localized, options);

    expect(result).toEqual({
      sys: {
        id: '34O95Y8gLXd3jPozdy7gmd',
        contentType: 'fieldTest',
        createdAt: '2021-01-14T13:17:17.232Z',
        updatedAt: '2021-01-14T13:35:12.671Z',
      },
      shortText: 'Short Text (EN)',
      shortTextList: ['List 1 (gb)', 'List 2 (gb)'],
      longText: '__Long text (en-GB)__\n',
      richText:
        '<p><b>Rich text (EN)</b></p><p><span>type: entry-hyperlink id: WLITBNhFp0VzHqOwKJAwR</span></p><p><span>type: asset-hyperlink id: 3t1t8PDynjpXbAzv6zOVQq</span></p><p></p><p></p>',
      integer: 2,
      decimal: 12,
      dateTime: new Date('2021-01-14T12:00').toISOString(),
      date: '2021-01-19',
      location: { lon: 13.422140718124993, lat: 52.47504074424066 },
      media: {
        mimeType: 'image/svg+xml',
        url:
          '//images.ctfassets.net/gpdredy5px7h/3t1t8PDynjpXbAzv6zOVQq/7f4143c74191766d87f86d0035d91d28/FuBK_testcard_vectorized.svg',
        title: 'FuBK',
        description: 'Dummy image',
        width: 768,
        height: 576,
        fileSize: 120093,
      },
      mediaList: [
        {
          mimeType: 'image/svg+xml',
          url:
            '//images.ctfassets.net/gpdredy5px7h/3t1t8PDynjpXbAzv6zOVQq/7f4143c74191766d87f86d0035d91d28/FuBK_testcard_vectorized.svg',
          title: 'FuBK',
          description: 'Dummy image',
          width: 768,
          height: 576,
          fileSize: 120093,
        },
      ],
      boolean: false,
      jsonObject: { JSON: 'OBJECT' },
      reference: { id: '56O29iIIcee0ZcgIuwlHSv', contentType: 'fieldTest' },
      referenceList: [
        { id: '2WLqjLlMJUbc0vCf9UMfjA', contentType: 'fieldTest' },
        { id: '56O29iIIcee0ZcgIuwlHSv', contentType: 'fieldTest' },
      ],
    });
  });

  test('Skip entry with mandatory field missing', async () => {
    const [localized, options] = await createLocalizedEntryAndOptions();

    // make shortText mandatory and remove it
    options.fieldSettings.fieldTest.shortText.required = true;
    localized.fields.shortText = undefined;

    const result = await mapEntry(localized, options);

    expect(result).toBeUndefined();
  });

  test('Skip entry with custom validate function', async () => {
    const [localized, options] = await createLocalizedEntryAndOptions();

    // we want to have a mandatory field in the validate args
    options.fieldSettings.fieldTest.shortText.required = true;

    let validateEntry;
    let validateOptions;
    const validate = (entryArg, optionsArg) => {
      validateEntry = entryArg;
      validateOptions = optionsArg;
      return false;
    };

    const result = await mapEntry(localized, {
      validate,
      ...options,
    });

    expect(result).toBeUndefined();
    expect(validateEntry.id).toEqual('34O95Y8gLXd3jPozdy7gmd');
    expect(validateOptions.requiredFields).toEqual(['shortText']);
    expect(validateOptions.requiredFieldMissing).toEqual(false);
  });
});

describe('Mapper hooks', () => {
  test('mapEntryLink', async () => {
    const entries = await readFixture('entries.json');
    const [entry] = entries;

    const link = {
      sys: {
        type: FIELD_TYPE_LINK,
        linkType: LINK_TYPE_ENTRY,
        id: getContentId(entry),
      },
    };

    const value = await mapField(link, {
      settings: { type: FIELD_TYPE_LINK },
      entries: convertToMap(entries),
      mapEntryLink: (entry) => ({ id: getContentId(entry), custom: true }),
    });

    expect(value).toEqual({ id: getContentId(entry), custom: true });
  });

  test('mapAssetLink', async () => {
    const assets = await readFixture('assets.json');
    const [asset] = assets;
    const link = {
      sys: {
        type: FIELD_TYPE_LINK,
        linkType: LINK_TYPE_ASSET,
        id: getContentId(asset),
      },
    };

    const value = await mapField(link, {
      settings: { type: FIELD_TYPE_LINK },
      assets: convertToMap(assets),
      mapAssetLink: (asset) => ({ id: getContentId(asset), custom: true }),
    });

    expect(value).toEqual({ id: getContentId(asset), custom: true });
  });

  test('richTextRenderer (config)', async () => {
    const content = await readFixture('richtext.json');
    const expected =
      '<entry-link>WLITBNhFp0VzHqOwKJAwR</entry-link><asset-link>3t1t8PDynjpXbAzv6zOVQq</asset-link><asset>3t1t8PDynjpXbAzv6zOVQq</asset>';

    const value = await mapField(content, {
      settings: { type: FIELD_TYPE_RICHTEXT },
      richTextRenderer: {
        renderMark: {
          [MARKS.BOLD]: () => '',
        },
        renderNode: {
          [BLOCKS.PARAGRAPH]: (node, next) => next(node.content),
          [BLOCKS.EMBEDDED_ASSET]: (node) => `<asset>${node.data.target.sys.id}</asset>`,
          [INLINES.ENTRY_HYPERLINK]: (node) => `<entry-link>${node.data.target.sys.id}</entry-link>`,
          [INLINES.ASSET_HYPERLINK]: (node) => `<asset-link>${node.data.target.sys.id}</asset-link>`,
        },
      },
    });

    expect(value).toEqual(expected);
  });

  test('richTextRenderer (function)', async () => {
    const content = await readFixture('richtext.json');
    const value = await mapField(content, {
      settings: { type: FIELD_TYPE_RICHTEXT },
      richTextRenderer: () => '<h1>CUSTOM</h1>',
    });

    expect(value).toEqual('<h1>CUSTOM</h1>');
  });

  test('disabled richTextRenderer', async () => {
    const entries = await readFixture('entries.json');
    const assets = await readFixture('assets.json');
    const content = await readFixture('richtext.json');
    const value = await mapField(content, {
      settings: { type: FIELD_TYPE_RICHTEXT },
      richTextRenderer: false,
      entries: convertToMap(entries),
      assets: convertToMap(assets),
    });

    expect(value).toEqual({
      data: {},
      content: [
        {
          data: {},
          content: [{ data: {}, marks: ['bold'], value: 'Rich text (EN)', nodeType: 'text' }],
          nodeType: 'paragraph',
        },
        {
          data: {},
          content: [
            { data: {}, marks: [], value: '', nodeType: 'text' },
            {
              data: { id: 'WLITBNhFp0VzHqOwKJAwR', contentType: 'fieldTest' },
              content: [{ data: {}, marks: [], value: 'Entry Link', nodeType: 'text' }],
              nodeType: 'entry-hyperlink',
            },
            { data: {}, marks: [], value: '', nodeType: 'text' },
          ],
          nodeType: 'paragraph',
        },
        {
          data: {},
          content: [
            { data: {}, marks: [], value: '', nodeType: 'text' },
            {
              data: { mimeType: '', url: '', title: { 'en-US': 'FuBK' }, description: { 'en-US': 'Dummy image' } },
              content: [{ data: {}, marks: [], value: 'Asset Link', nodeType: 'text' }],
              nodeType: 'asset-hyperlink',
            },
            { data: {}, marks: [], value: '', nodeType: 'text' },
          ],
          nodeType: 'paragraph',
        },
        { data: {}, content: [{ data: {}, marks: [], value: '', nodeType: 'text' }], nodeType: 'paragraph' },
        {
          data: { mimeType: '', url: '', title: { 'en-US': 'FuBK' }, description: { 'en-US': 'Dummy image' } },
          content: [],
          nodeType: 'embedded-asset-block',
        },
        { data: {}, content: [{ data: {}, marks: [], value: '', nodeType: 'text' }], nodeType: 'paragraph' },
      ],
      nodeType: 'document',
    });
  });
});
