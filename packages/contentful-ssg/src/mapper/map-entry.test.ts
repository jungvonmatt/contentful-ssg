import { convertToMap, getContentId, getContentTypeId } from '../lib/contentful.js';
import { HookManager } from '../lib/hook-manager.js';
import { localizeEntry } from '../tasks/localize.js';
import { TransformContext } from '../types.js';
import { getConfig, getRuntimeContext, getTransformContext } from '../__test__/mock.js';
import { mapEntry } from './map-entry.js';
import { mapMetaFields } from './map-meta-fields.js';

describe('Mapper - mapEntry', () => {
  const config = getConfig();
  const runtimeContext = getRuntimeContext();

  const assets = runtimeContext.data.assets.map((asset) =>
    localizeEntry(asset, 'en-GB', {
      locales: runtimeContext.data.locales,
      fieldSettings: runtimeContext.data.fieldSettings,
    })
  );

  const entries = runtimeContext.data.entries.map((entry) =>
    localizeEntry(entry, 'en-GB', {
      locales: runtimeContext.data.locales,
      fieldSettings: runtimeContext.data.fieldSettings,
    })
  );
  const [entry] = entries;
  const transformContext = getTransformContext({
    entry,
    id: getContentId(entry),
    contentTypeId: getContentTypeId(entry),
    locale: runtimeContext.data.locales.find((locale) => locale.code === 'en-GB'),
    assets,
    entries,
    assetMap: convertToMap(assets),
    entryMap: convertToMap(entries),
  });

  test('Maps entry', async () => {
    const result = await mapEntry(transformContext, runtimeContext, config);

    expect(result).toEqual({
      sys: {
        id: '34O95Y8gLXd3jPozdy7gmd',
        createdAt: '2021-01-14T13:17:17.232Z',
        updatedAt: '2021-01-14T13:35:12.671Z',
        contentType: 'fieldTest',
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
        url: '//images.ctfassets.net/gpdredy5px7h/3t1t8PDynjpXbAzv6zOVQq/7f4143c74191766d87f86d0035d91d28/FuBK_testcard_vectorized.svg',
        title: 'FuBK',
        description: 'Dummy image',
        width: 768,
        height: 576,
        fileSize: 120093,
      },
      mediaList: [
        {
          mimeType: 'image/svg+xml',
          url: '//images.ctfassets.net/gpdredy5px7h/3t1t8PDynjpXbAzv6zOVQq/7f4143c74191766d87f86d0035d91d28/FuBK_testcard_vectorized.svg',
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
    config.mapMetaFields = (transformContext: TransformContext) => {
      const metaFields = mapMetaFields(transformContext);

      return {
        customKey: metaFields.sys,
        mapMetaFields: 'mocked',
      };
    };

    const result = await mapEntry(
      transformContext,
      { ...runtimeContext, hooks: new HookManager(runtimeContext, config) },
      config
    );

    expect(result).toEqual({
      customKey: {
        id: '34O95Y8gLXd3jPozdy7gmd',
        contentType: 'fieldTest',
        createdAt: '2021-01-14T13:17:17.232Z',
        updatedAt: '2021-01-14T13:35:12.671Z',
      },
      mapMetaFields: 'mocked',
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
        url: '//images.ctfassets.net/gpdredy5px7h/3t1t8PDynjpXbAzv6zOVQq/7f4143c74191766d87f86d0035d91d28/FuBK_testcard_vectorized.svg',
        title: 'FuBK',
        description: 'Dummy image',
        width: 768,
        height: 576,
        fileSize: 120093,
      },
      mediaList: [
        {
          mimeType: 'image/svg+xml',
          url: '//images.ctfassets.net/gpdredy5px7h/3t1t8PDynjpXbAzv6zOVQq/7f4143c74191766d87f86d0035d91d28/FuBK_testcard_vectorized.svg',
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
    const modifiedTransformContext = { ...transformContext };
    const modifiedRuntimeContext = { ...runtimeContext };
    // make shortText mandatory and remove it
    modifiedRuntimeContext.data.fieldSettings.fieldTest.shortText.required = true;
    modifiedTransformContext.entry.fields.shortText = undefined;

    await expect(async () => {
      await mapEntry(modifiedTransformContext, modifiedRuntimeContext, config);
    }).rejects.toThrowError(/ValidationError/);
  });

  test('Skip entry with custom validate function', async () => {
    const modifiedTransformContext = { ...transformContext };
    const modifiedRuntimeContext = { ...runtimeContext };

    // we want to have a mandatory field in the validate args
    modifiedRuntimeContext.data.fieldSettings.fieldTest.shortText.required = false;
    modifiedRuntimeContext.data.fieldSettings.fieldTest.longText.required = true;

    let validateContext: TransformContext;

    config.validate = (context) => {
      validateContext = context;
      return false;
    };

    await expect(async () => {
      await mapEntry(modifiedTransformContext, modifiedRuntimeContext, config);
    }).rejects.toThrowError(/ValidationError/);

    const requiredFieldMissing = !validateContext.requiredFields.every((key) =>
      Object.keys(validateContext.content).includes(key)
    );

    expect(validateContext.entry.sys.id).toEqual('34O95Y8gLXd3jPozdy7gmd');
    expect(validateContext.requiredFields).toEqual(['longText']);
    expect(requiredFieldMissing).toEqual(false);
  });
});
