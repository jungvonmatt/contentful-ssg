import {
  FIELD_TYPE_SYMBOL,
  FIELD_TYPE_TEXT,
  FIELD_TYPE_RICHTEXT,
  FIELD_TYPE_NUMBER,
  FIELD_TYPE_INTEGER,
  FIELD_TYPE_DATE,
  FIELD_TYPE_LOCATION,
  FIELD_TYPE_ARRAY,
  FIELD_TYPE_BOOLEAN,
  FIELD_TYPE_LINK,
  FIELD_TYPE_OBJECT,
  LINK_TYPE_ASSET,
  LINK_TYPE_ENTRY,
} from '@jungvonmatt/contentful-ssg/lib/contentful';

import {
  createData,
  FieldInfo,
  getArrayFake,
  getAssetFake,
  getEntryScheme,
  getIntegerFake,
  getLinkFake,
  getMockData,
  getNumberFake,
  getRegexValue,
  getRichtextFake,
  getSymbolFake,
  getTextFake,
  getTextForId,
} from './faker.js';

import { ContentTypeFieldValidation } from 'contentful-management/types';

const getFieldInfo = (
  id: string,
  validations: ContentTypeFieldValidation[] = [],
  widgetId: string = 'singleLine'
): FieldInfo => ({
  settings: { id, validations },
  interface: { fieldId: 'id', widgetId },
});

const getField = (type) => {
  const info = getFieldInfo(type);
  info.settings.type = type;
  info.settings.items = { type: FIELD_TYPE_SYMBOL };
  return info;
};

describe('contentful-fakes', () => {
  it('getTextFake (validation: in)', async () => {
    const inValue = ['a', 'b', 'c'];
    const result = await getTextFake(getFieldInfo('-', [{ in: inValue }]));

    expect(inValue.includes(result)).toBeTruthy();
  });

  it('getTextFake (validation: regexp)', async () => {
    const regexp = { pattern: '^\\w[\\w.-]*@([\\w-]+\\.)+[\\w-]+$', flags: '' };
    const result = await getTextFake(getFieldInfo('-', [{ regexp }]));

    expect(result).toMatch(new RegExp(regexp.pattern));
  });

  it('getTextFake (validation: size)', async () => {
    for (const min of Array.from(Array(100)).map((_, i) => i)) {
      const max = (min + 1) * 10;
      const size = { min, max };
      const result = await getTextFake(getFieldInfo('-', [{ size }]));
      expect(result.length >= min).toBe(true);
      expect(result.length <= max).toBe(true);
    }

    const resultMin = await getTextFake(getFieldInfo('-', [{ size: { min: 100 } }]));
    expect(resultMin.length >= 100).toBe(true);

    const resultMax = await getTextFake(getFieldInfo('-', [{ size: { max: 100 } }]));
    expect(resultMax.length <= 100).toBe(true);
  });

  it('getIntegerFake (validation: in)', async () => {
    const inValue = [1, 100, 1000];
    const result = await getIntegerFake(getFieldInfo('-', [{ in: inValue }]));

    expect(inValue.includes(result)).toBeTruthy();
  });

  it('getIntegerFake (validation: min)', async () => {
    const result = await getIntegerFake(getFieldInfo('-', [{ range: { min: 100 } }]));
    expect(Math.round(result)).toEqual(result);
    expect(result).toBeGreaterThanOrEqual(100);
  });

  it('getIntegerFake (validation: max)', async () => {
    const result = await getIntegerFake(getFieldInfo('-', [{ range: { max: 100 } }]));
    expect(Math.round(result)).toEqual(result);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('getIntegerFake (validation: range)', async () => {
    const result = await getIntegerFake(getFieldInfo('-', [{ range: { min: 100, max: 1000 } }]));
    expect(Math.round(result)).toEqual(result);
    expect(result).toBeGreaterThanOrEqual(100);
    expect(result).toBeLessThanOrEqual(1000);
  });

  it('getNumberFake (validation: in)', async () => {
    const inValue = [1.12, 3.414, 1000.009];
    const result = await getNumberFake(getFieldInfo('-', [{ in: inValue }]));
    expect(inValue.includes(result)).toBeTruthy();
  });

  it('getNumberFake (validation: min)', async () => {
    const result = await getNumberFake(getFieldInfo('-', [{ range: { min: 100 } }]));
    expect(result).toBeGreaterThanOrEqual(100);
  });

  it('getNumberFake (validation: max)', async () => {
    const result = await getNumberFake(getFieldInfo('-', [{ range: { max: 100 } }]));
    expect(result).toBeLessThanOrEqual(100);
  });

  it('getNumberFake (validation: range)', async () => {
    const result = await getNumberFake(getFieldInfo('-', [{ range: { min: 100, max: 1000 } }]));
    expect(result).toBeGreaterThanOrEqual(100);
    expect(result).toBeLessThanOrEqual(1000);
  });

  it('getSymbolFake (validation: in)', async () => {
    const inValue = ['a', 'b', 'abc'];
    const result = await getSymbolFake(getFieldInfo('-', [{ in: inValue }]));
    expect(inValue.includes(result)).toBeTruthy();
  });

  it('getSymbolFake (interface: urlEditor)', async () => {
    const result = await getSymbolFake(getFieldInfo('-', [], 'urlEditor'));
    expect(result).toMatch(
      new RegExp('\\/\\/(\\w+:{0,1}\\w*@)?(\\S+)(:[0-9]+)?(\\/|\\/([\\w#!:.?+=&%@!\\-/]))?$')
    );
  });

  it('getSymbolFake (interface: slugEditor)', async () => {
    const result = await getSymbolFake(getFieldInfo('-', [], 'slugEditor'));
    expect(result).toMatch(new RegExp('^[a-z0-9]+(?:-[a-z0-9]+)*$'));
  });

  it('getSymbolFake (special ids)', async () => {
    const result = await getSymbolFake(getFieldInfo('id'));
    expect(result).toMatch(
      new RegExp(
        '[0-9a-fA-F]{8}\\-[0-9a-fA-F]{4}\\-[0-9a-fA-F]{4}\\-[0-9a-fA-F]{4}\\-[0-9a-fA-F]{12}'
      )
    );
  });

  it('getSymbolFake (dropdown/radio)', async () => {
    const result = await getSymbolFake(getFieldInfo('-', [], 'dropdown'));
    expect(result).toMatch(new RegExp('[\\d\\w]+'));
  });

  it('getSymbolFake (min)', async () => {
    const result = await getSymbolFake(getFieldInfo('-', [{ size: { min: 100 } }]));
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThanOrEqual(100);
    expect(result.length).toBeLessThanOrEqual(255);
  });

  it('getSymbolFake (max)', async () => {
    const result = await getSymbolFake(getFieldInfo('-', [{ size: { max: 100 } }]));
    expect(typeof result).toBe('string');
    expect(result.length).toBeLessThanOrEqual(100);
  });

  it('getSymbolFake (min/max)', async () => {
    const result = await getSymbolFake(getFieldInfo('-', [{ size: { min: 10, max: 100 } }]));
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThanOrEqual(10);
    expect(result.length).toBeLessThanOrEqual(100);
  });

  it('getAssetFake', async () => {
    const result = await getAssetFake();

    expect(Object.keys(result)).toEqual([
      'mime_type',
      'url',
      'title',
      'description',
      'width',
      'height',
      'file_size',
    ]);

    expect(result.url).toMatch(/https?:\/\/.*/);
    expect(typeof result.width).toEqual('number');
    expect(typeof result.height).toEqual('number');
    expect(typeof result.file_size).toEqual('number');
    expect(typeof result.mime_type).toEqual('string');
    expect(typeof result.url).toEqual('string');
    expect(typeof result.title).toEqual('string');
    expect(typeof result.description).toEqual('string');
  });

  it('getEntryScheme', async () => {
    const result = await getEntryScheme(getFieldInfo('-', [{ linkContentType: ['content-type'] }]));

    expect(result).toMatchObject({ id: 'default', content_type: 'content-type' });
  });

  it('getLinkFake (asset)', async () => {
    const info = getFieldInfo('-');
    info.settings.linkType = LINK_TYPE_ASSET;
    const result = await getLinkFake(info);
    console.log(result);
    expect(Object.keys(result)).toEqual([
      'mime_type',
      'url',
      'title',
      'description',
      'width',
      'height',
      'file_size',
    ]);
  });

  it('getLinkFake (entry)', async () => {
    const info = getFieldInfo('-', [{ linkContentType: ['content-type'] }]);
    info.settings.linkType = LINK_TYPE_ENTRY;
    const result = await getLinkFake(info);

    expect(result).toMatchObject({ id: 'default', content_type: 'content-type' });
  });

  it('getRichtextFake min', async () => {
    const result = await getRichtextFake(
      getFieldInfo('-', [{ enabledMarks: [], enabledNodeTypes: [] }])
    );

    expect(Object.keys(result)).toEqual(['node_type', 'data', 'content']);
  });

  it('getRichtextFake max', async () => {
    const result = await getRichtextFake(
      getFieldInfo('-', [
        { enabledMarks: ['italic'], enabledNodeTypes: ['heading-1', 'heading-2'] },
      ])
    );

    expect(Object.keys(result)).toEqual(['node_type', 'data', 'content']);
    expect(result.content?.[0].node_type).toBe('heading-1');
    expect(result.content?.[1].node_type).toBe('heading-2');
  });

  it('getTextFake (special ids)', async () => {
    const specials = [
      'username',
      'first_name',
      'last_name',
      'full_name',
      'password',
      'name_prefix',
      'name_suffix',
      'company_name',
      'company_suffix',
      'catch_phrase',
      'phone',
      'ip',
      'domain',
      'url',
      'email',
      'user_agent',
      'country',
      'city',
      'zip',
      'street',
      'address',
      'address1',
      'address2',
      'state',
      'state_abbr',
      'latitude',
      'longitude',
      'building_number',
      'uuid',
      'uid',
      'id',
    ];

    const results = await Promise.all(specials.map((id) => getTextFake(getFieldInfo(id))));

    expect(results.length).toBe(specials.length);
    results.forEach((result) => expect(typeof result === 'string').toBe(true));
  });

  it('getRegexValue (preset: email)', () => {
    const pattern = '^\\w[\\w.-]*@([\\w-]+\\.)+[\\w-]+$';
    const result = getRegexValue({ pattern, flags: '' });

    expect(result).toMatch(new RegExp(pattern));
  });

  it('getRegexValue (preset: url)', () => {
    const pattern = '\\/\\/(\\w+:{0,1}\\w*@)?(\\S+)(:[0-9]+)?(\\/|\\/([\\w#!:.?+=&%@!\\-/]))?$';
    const result = getRegexValue({ pattern, flags: '' });

    expect(result).toMatch(new RegExp(pattern));
  });

  it('getRegexValue (preset: Date US)', () => {
    const pattern = '^(0?[1-9]|1[012])[- /.](0?[1-9]|[12][0-9]|3[01])[- /.](19|20)?\\d\\d$';
    const result = getRegexValue({ pattern, flags: '' });

    expect(result).toMatch(new RegExp(pattern));
  });

  it('getRegexValue (preset: Date European)', () => {
    const pattern = '^(0?[1-9]|[12][0-9]|3[01])[- /.](0?[1-9]|1[012])[- /.](19|20)?\\d\\d$';
    const result = getRegexValue({ pattern, flags: '' });

    expect(result).toMatch(new RegExp(pattern));
  });

  it('getRegexValue (preset: 12h Time)', () => {
    const pattern = '^(0?[1-9]|1[012]):[0-5][0-9](:[0-5][0-9])?\\s*[aApP][mM]$';
    const result = getRegexValue({ pattern, flags: '' });

    expect(result).toMatch(new RegExp(pattern));
  });

  it('getRegexValue (preset: 24h Time)', () => {
    const pattern = '^(0?[0-9]|1[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$';
    const result = getRegexValue({ pattern, flags: '' });

    expect(result).toMatch(new RegExp(pattern));
  });

  it('getRegexValue (preset: US Phone number)', () => {
    const pattern = '^\\d[ -.]?\\(?\\d\\d\\d\\)?[ -.]?\\d\\d\\d[ -.]?\\d\\d\\d\\d$';
    const regex = '^\\d[ \\-\\.]?\\(?\\d\\d\\d\\)?[ \\-\\.]?\\d\\d\\d[\\s\\-\\.]?\\d\\d\\d\\d$';
    const result = getRegexValue({ pattern, flags: '' });
    expect(result).toMatch(new RegExp(regex));
  });

  it('getRegexValue (preset: US Zip code)', () => {
    const pattern = '^\\d{5}$|^\\d{5}-\\d{4}$';
    const result = getRegexValue({ pattern, flags: '' });
    expect(result).toMatch(new RegExp(pattern));
  });

  it('getRegexValue (custom regex)', () => {
    const pattern = '^a\\w{3}\\d{1,5}z';
    const flags = 'i';
    const result = getRegexValue({ pattern, flags });

    expect(result).toMatch(new RegExp(pattern, flags));
  });

  it('getMockData', async () => {
    const contentTypes = {
      ct: [
        getField(FIELD_TYPE_SYMBOL),
        getField(FIELD_TYPE_TEXT),
        getField(FIELD_TYPE_RICHTEXT),
        getField(FIELD_TYPE_NUMBER),
        getField(FIELD_TYPE_INTEGER),
        getField(FIELD_TYPE_DATE),
        getField(FIELD_TYPE_LOCATION),
        getField(FIELD_TYPE_ARRAY),
        getField(FIELD_TYPE_BOOLEAN),
        getField(FIELD_TYPE_LINK),
        getField(FIELD_TYPE_OBJECT),
      ],
    };

    const { ct: result } = await getMockData(contentTypes);

    expect(typeof result[FIELD_TYPE_SYMBOL]).toEqual('string');
    expect(typeof result[FIELD_TYPE_TEXT]).toEqual('string');
    expect(Object.keys(result[FIELD_TYPE_RICHTEXT])).toEqual(['node_type', 'data', 'content']);
    expect(typeof result[FIELD_TYPE_NUMBER]).toEqual('number');
    expect(typeof result[FIELD_TYPE_INTEGER]).toEqual('number');
    expect(result[FIELD_TYPE_DATE]).toBeInstanceOf(Date);
    expect(typeof result[FIELD_TYPE_LOCATION]).toEqual('object');
    expect(Object.keys(result[FIELD_TYPE_LOCATION])).toEqual(['lat', 'lng']);
    expect(typeof result[FIELD_TYPE_ARRAY]).toEqual('object');
    expect(Array.isArray(result[FIELD_TYPE_ARRAY])).toBeTruthy();
    expect(typeof result[FIELD_TYPE_BOOLEAN]).toEqual('boolean');
    expect(typeof result[FIELD_TYPE_LINK]).toEqual('object');
    expect(typeof result[FIELD_TYPE_OBJECT]).toEqual('object');
  });
});
