import { MARKS, BLOCKS, INLINES } from '@contentful/rich-text-types';
import { Field } from 'contentful';
import {
  FIELD_TYPE_SYMBOL,
  FIELD_TYPE_INTEGER,
  FIELD_TYPE_NUMBER,
  FIELD_TYPE_ARRAY,
  FIELD_TYPE_TEXT,
  FIELD_TYPE_RICHTEXT,
  FIELD_TYPE_DATE,
  FIELD_TYPE_LOCATION,
  FIELD_TYPE_BOOLEAN,
  FIELD_TYPE_OBJECT,
  getFieldSettings,
  FIELD_TYPE_LINK,
  LINK_TYPE_ASSET,
  getContentId,
  convertToMap,
  LINK_TYPE_ENTRY,
  getContentTypeId,
} from '../lib/contentful.js';
import { HookManager } from '../lib/hook-manager.js';
import { localizeEntry } from '../tasks/localize.js';
import { Config, RuntimeContext } from '../types.js';
import { getRuntimeContext, getConfig, getTransformContext, readFixture } from '../__test__/mock.js';
import { mapField } from './map-field.js';

describe('Mapper - mapField', () => {
  const runtimeContext = getRuntimeContext();
  const config = getConfig();
  test('Symbol', async () => {
    const value = await mapField(
      getTransformContext({
        fieldContent: 'Symbol',
        fieldSettings: { type: FIELD_TYPE_SYMBOL } as Field,
      }),
      runtimeContext,
      config
    );
    expect(value).toEqual('Symbol');
  });
  test('Symbol Integer', async () => {
    const value = await mapField(
      getTransformContext({
        fieldContent: 1,
        fieldSettings: { type: FIELD_TYPE_INTEGER } as Field,
      }),
      runtimeContext,
      config
    );
    expect(value).toEqual(1);
  });
  test('Symbol Decimal', async () => {
    const value = await mapField(
      getTransformContext({
        fieldContent: 1.3,
        fieldSettings: { type: FIELD_TYPE_NUMBER } as Field,
      }),
      runtimeContext,
      config
    );
    expect(value).toEqual(1.3);
  });
  test('Symbol (Array)', async () => {
    const value = await mapField(
      getTransformContext({
        fieldContent: ['Symbol 1', 'Symbol 2', 'Symbol 3'],
        fieldSettings: { type: FIELD_TYPE_ARRAY, items: { type: FIELD_TYPE_SYMBOL } } as Field,
      }),
      runtimeContext,
      config
    );
    expect(value).toEqual(['Symbol 1', 'Symbol 2', 'Symbol 3']);
  });
  test('Text', async () => {
    const value = await mapField(
      getTransformContext({
        fieldContent: '__Long text__\n',
        fieldSettings: { type: FIELD_TYPE_TEXT } as Field,
      }),
      runtimeContext,
      config
    );
    expect(value).toEqual('__Long text__\n');
  });
  test('RichText', async () => {
    const content = await readFixture('richtext.json');
    const expected =
      '<p><b>Rich text (EN)</b></p><p><span>type: entry-hyperlink id: WLITBNhFp0VzHqOwKJAwR</span></p><p><span>type: asset-hyperlink id: 3t1t8PDynjpXbAzv6zOVQq</span></p><p></p><p></p>';
    const value = await mapField(
      getTransformContext({
        fieldContent: content,
        fieldSettings: { type: FIELD_TYPE_RICHTEXT } as Field,
      }),
      runtimeContext,
      config
    );
    expect(value).toEqual(expected);
  });

  test('DateTime', async () => {
    const value = await mapField(
      getTransformContext({
        fieldContent: '2021-01-14T12:00',
        fieldSettings: { type: FIELD_TYPE_DATE } as Field,
      }),
      runtimeContext,
      config
    );
    expect(value).toEqual(new Date('2021-01-14T12:00').toISOString());
  });

  test('Date', async () => {
    const value = await mapField(
      getTransformContext({
        fieldContent: '2021-01-14',
        fieldSettings: { type: FIELD_TYPE_DATE } as Field,
      }),
      runtimeContext,
      config
    );
    expect(value).toEqual('2021-01-14');
  });

  test('Location', async () => {
    const location = {
      lon: 13.422140718124993,
      lat: 52.47504074424066,
    };
    const value = await mapField(
      getTransformContext({
        fieldContent: location,
        fieldSettings: { type: FIELD_TYPE_LOCATION } as Field,
      }),
      runtimeContext,
      config
    );
    expect(value).toEqual(location);
  });

  test('Boolean', async () => {
    const valueTrue = await mapField(
      getTransformContext({
        fieldContent: true,
        fieldSettings: { type: FIELD_TYPE_BOOLEAN } as Field,
      }),
      runtimeContext,
      config
    );

    const valueFalse = await mapField(
      getTransformContext({
        fieldContent: false,
        fieldSettings: { type: FIELD_TYPE_BOOLEAN } as Field,
      }),
      runtimeContext,
      config
    );
    expect(valueTrue).toEqual(true);
    expect(valueFalse).toEqual(false);
  });

  test('JSON Object', async () => {
    const data = { JSON: { A: [1, 2, 3] } };
    const value = await mapField(
      getTransformContext({
        fieldContent: data,
        fieldSettings: { type: FIELD_TYPE_OBJECT } as Field,
      }),
      runtimeContext,
      config
    );
    expect(value).toEqual(data);
  });

  test('Asset Link (Image)', async () => {
    const assets = await readFixture('assets.json');
    const locales = await readFixture('locales.json');
    const contentTypes = await readFixture('content_types.json');
    const fieldSettings = getFieldSettings(contentTypes);
    const translatedAssets = await assets.map((asset) =>
      localizeEntry(asset, 'en-GB', { fieldSettings, locales })
    );

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

    const value = await mapField(
      getTransformContext({
        fieldContent: link,
        fieldSettings: { type: FIELD_TYPE_LINK } as Field,
        assetMap: convertToMap(translatedAssets),
      }),
      runtimeContext,
      config
    );

    expect(value).toEqual(expected);
  });

  test('Asset Link (Array)', async () => {
    const assets = await readFixture('assets.json');
    const locales = await readFixture('locales.json');
    const contentTypes = await readFixture('content_types.json');
    const fieldSettings = getFieldSettings(contentTypes);
    const translatedAssets = await assets.map((asset) =>
      localizeEntry(asset, 'en-GB', { fieldSettings, locales })
    );

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

    const value = await mapField(
      getTransformContext({
        fieldContent: [link, link],
        fieldSettings: {
          type: FIELD_TYPE_ARRAY,
          items: {
            type: FIELD_TYPE_LINK,
            linkType: LINK_TYPE_ASSET,
          },
        } as Field,
        assetMap: convertToMap(translatedAssets),
        entryMap: new Map(),
      }),
      runtimeContext,
      config
    );

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

    const value = await mapField(
      getTransformContext({
        fieldContent: link,
        fieldSettings: {
          type: FIELD_TYPE_LINK,
        } as Field,
        assetMap: new Map(),
        entryMap: new Map(),
      }),
      runtimeContext,
      config
    );

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

    const value = await mapField(
      getTransformContext({
        fieldContent: link,
        fieldSettings: {
          type: FIELD_TYPE_LINK,
        } as Field,
        assetMap: new Map(),
        entryMap: convertToMap(entries),
      }),
      runtimeContext,
      config
    );

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

    const value = await mapField(
      getTransformContext({
        fieldContent: link,
        fieldSettings: {
          type: FIELD_TYPE_LINK,
        } as Field,
        assetMap: new Map(),
        entryMap: new Map(),
      }),
      runtimeContext,
      config
    );

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

    const value = await mapField(
      getTransformContext({
        fieldContent: [link, link],
        fieldSettings: {
          type: FIELD_TYPE_ARRAY,
          items: {
            type: FIELD_TYPE_LINK,
            linkType: LINK_TYPE_ENTRY,
          },
        } as Field,
        assetMap: new Map(),
        entryMap: convertToMap(entries),
      }),
      runtimeContext,
      config
    );

    expect(value).toEqual([data, data]);
  });
});

describe('Mapper hooks', () => {
  const runtimeContext = getRuntimeContext();
  const config = getConfig();

  const getHookedRuntime = (configMock: Partial<Config> = {}): RuntimeContext => ({
    ...runtimeContext,
    hooks: new HookManager(runtimeContext, { ...config, ...configMock }),
  });

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

    const value = await mapField(
      getTransformContext({
        fieldContent: link,
        fieldSettings: { type: FIELD_TYPE_LINK } as Field,
        entryMap: convertToMap(entries),
      }),
      getHookedRuntime({
        mapEntryLink: (transformContext) => ({ id: transformContext.id, custom: true }),
      }),
      config
    );

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

    const value = await mapField(
      getTransformContext({
        fieldContent: link,
        fieldSettings: { type: FIELD_TYPE_LINK } as Field,
        assetMap: convertToMap(assets),
      }),
      getHookedRuntime({
        mapAssetLink: (transformContext) => ({ id: transformContext.id, custom: true }),
      }),
      config
    );

    expect(value).toEqual({ id: getContentId(asset), custom: true });
  });

  test('richTextRenderer (config)', async () => {
    const content = await readFixture('richtext.json');
    const expected =
      '<entry-link>WLITBNhFp0VzHqOwKJAwR</entry-link><asset-link>3t1t8PDynjpXbAzv6zOVQq</asset-link><asset>3t1t8PDynjpXbAzv6zOVQq</asset>';

    const value = await mapField(
      getTransformContext({
        fieldContent: content,
        fieldSettings: { type: FIELD_TYPE_RICHTEXT } as Field,
      }),
      runtimeContext,
      {
        ...config,
        richTextRenderer: {
          renderMark: {
            [MARKS.BOLD]: () => '',
          },
          renderNode: {
            [BLOCKS.PARAGRAPH]: (node, next) => next(node.content),
            [BLOCKS.EMBEDDED_ASSET]: (node) => `<asset>${node.data.target.sys.id}</asset>`,
            [INLINES.ENTRY_HYPERLINK]: (node) =>
              `<entry-link>${node.data.target.sys.id}</entry-link>`,
            [INLINES.ASSET_HYPERLINK]: (node) =>
              `<asset-link>${node.data.target.sys.id}</asset-link>`,
          },
        },
      }
    );

    expect(value).toEqual(expected);
  });

  test('richTextRenderer (function)', async () => {
    const content = await readFixture('richtext.json');

    const value = await mapField(
      getTransformContext({
        fieldContent: content,
        fieldSettings: { type: FIELD_TYPE_RICHTEXT } as Field,
      }),
      runtimeContext,
      { ...config, richTextRenderer: () => '<h1>CUSTOM</h1>' }
    );

    expect(value).toEqual('<h1>CUSTOM</h1>');
  });

  test('disabled richTextRenderer', async () => {
    const entries = await readFixture('entries.json');
    const assets = await readFixture('assets.json');
    const content = await readFixture('richtext.json');

    const value = await mapField(
      getTransformContext({
        fieldContent: content,
        fieldSettings: { type: FIELD_TYPE_RICHTEXT } as Field,
        entryMap: convertToMap(entries),
        assetMap: convertToMap(assets),
      }),
      runtimeContext,
      { ...config, richTextRenderer: false }
    );

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
              data: {
                mimeType: '',
                url: '',
                title: { 'en-US': 'FuBK' },
                description: { 'en-US': 'Dummy image' },
              },
              content: [{ data: {}, marks: [], value: 'Asset Link', nodeType: 'text' }],
              nodeType: 'asset-hyperlink',
            },
            { data: {}, marks: [], value: '', nodeType: 'text' },
          ],
          nodeType: 'paragraph',
        },
        {
          data: {},
          content: [{ data: {}, marks: [], value: '', nodeType: 'text' }],
          nodeType: 'paragraph',
        },
        {
          data: {
            mimeType: '',
            url: '',
            title: { 'en-US': 'FuBK' },
            description: { 'en-US': 'Dummy image' },
          },
          content: [],
          nodeType: 'embedded-asset-block',
        },
        {
          data: {},
          content: [{ data: {}, marks: [], value: '', nodeType: 'text' }],
          nodeType: 'paragraph',
        },
      ],
      nodeType: 'document',
    });
  });
});
