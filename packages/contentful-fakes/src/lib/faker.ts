/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/naming-convention */
// See validations
// https://www.contentful.com/developers/docs/references/content-management-api/#/reference/content-types/content-type

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

import type { ContentFields, KeyValueMap, Control } from 'contentful-management/types';

import { faker } from '@faker-js/faker';
import casual from 'casual';
import RandExp from 'randexp';
import { oneOf, randomInt } from './helper.js';

export type FieldInfo = {
  interface: Control;
  settings: Partial<ContentFields>;
};

export type ContentTypes = Record<string, FieldInfo[]>;

export const getMockData = async (contentTypes: ContentTypes): Promise<KeyValueMap> => {
  const dataEntries = await Promise.all(
    Object.entries(contentTypes).map(async ([name, fields]) => [name, await createData(fields)])
  );

  return Object.fromEntries(dataEntries);
};

export const createData = async (fields: FieldInfo[]): Promise<KeyValueMap> => {
  const entries = await Promise.all(
    fields.map(async (field) => {
      const id = field?.settings?.id || 'undefined';
      switch (field.settings.type) {
        case FIELD_TYPE_SYMBOL:
          return [id, await getSymbolFake(field)];
        case FIELD_TYPE_INTEGER:
          return [id, await getIntegerFake(field)];
        case FIELD_TYPE_NUMBER:
          return [id, await getNumberFake(field)];
        case FIELD_TYPE_TEXT:
          return [id, await getTextFake(field)];
        case FIELD_TYPE_LINK:
          return [id, await getLinkFake(field)];
        case FIELD_TYPE_ARRAY:
          return [id, await getArrayFake(field)];
        case FIELD_TYPE_BOOLEAN:
          return [id, faker.datatype.boolean()];
        case FIELD_TYPE_DATE:
          return [id, faker.date.future()];
        case FIELD_TYPE_RICHTEXT:
          return [id, await getRichtextFake(field)];
        case FIELD_TYPE_OBJECT:
          return [id, {}];
        case FIELD_TYPE_LOCATION:
          return [
            id,
            {
              lat: faker.address.latitude(),
              lng: faker.address.longitude(),
            },
          ];
        default:
          return [id, undefined];
      }
    })
  );

  return Object.fromEntries(entries);
};

type RegexType = {
  pattern: string;
  flags: string;
};

export const getRegexValue = (regex: RegexType) => {
  const { pattern, flags } = regex;

  // First try to handle regex values predefined in contentful
  // Email:
  if (pattern === '^\\w[\\w.-]*@([\\w-]+\\.)+[\\w-]+$') {
    return faker.internet.exampleEmail();
  }

  // Url:
  if (
    pattern.includes('\\/\\/(\\w+:{0,1}\\w*@)?(\\S+)(:[0-9]+)?(\\/|\\/([\\w#!:.?+=&%@!\\-/]))?$')
  ) {
    return faker.internet.url();
  }

  // Date (US)
  if (pattern === '^(0?[1-9]|1[012])[- /.](0?[1-9]|[12][0-9]|3[01])[- /.](19|20)?\\d\\d$') {
    return casual.time('MM-DD-YYYY');
  }

  // Date (European)
  if (pattern === '^(0?[1-9]|[12][0-9]|3[01])[- /.](0?[1-9]|1[012])[- /.](19|20)?\\d\\d$') {
    return casual.time('DD-MM-YYYY');
  }

  // 12h Time
  if (pattern === '^(0?[1-9]|1[012]):[0-5][0-9](:[0-5][0-9])?\\s*[aApP][mM]$') {
    return casual.time('hh:mm a');
  }

  // 24h time
  if (pattern === '^(0?[0-9]|1[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$') {
    return casual.time('HH:mm');
  }

  // US Phone number
  if (pattern === '^\\d[ -.]?\\(?\\d\\d\\d\\)?[ -.]?\\d\\d\\d[ -.]?\\d\\d\\d\\d$') {
    return faker.phone.number('#-(###)-###-####');
  }

  // US Zip code
  if (pattern === '^\\d{5}$|^\\d{5}-\\d{4}$') {
    return faker.address.zipCode();
  }

  return new RandExp(pattern, flags).gen();
};

export const getTextForId = (id: string) => {
  if (
    [
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
    ].includes(id)
  ) {
    if (typeof casual?.[id] === 'function') {
      return casual?.[id]();
    }

    return casual?.[id] ?? faker.lorem.word();
  }

  if (['uuid', 'uid', 'id'].includes(id)) {
    return casual.uuid;
  }

  return undefined;
};

export const getIntegerFake = async (field: FieldInfo): Promise<number> => {
  return getNumberFake(field, 1);
};

export const getNumberFake = async (field: FieldInfo, precision = 0.005): Promise<number> => {
  const { validations = [] } = field.settings;

  const { in: values } = validations.find((validation) => Boolean(validation?.in)) || {};
  if (values) {
    return oneOf<number>(values as number[]);
  }

  const { range } = validations.find((validation) => Boolean(validation?.range)) || {};
  if (range) {
    const { min, max } = range;
    if (typeof min !== 'undefined' && typeof max !== 'undefined') {
      return faker.datatype.number({ min, max, precision });
    }

    if (typeof min !== 'undefined') {
      return faker.datatype.number({ min, precision });
    }

    if (typeof max !== 'undefined') {
      return faker.datatype.number({ max, precision });
    }
  }

  return faker.datatype.number({ precision });
};

export const getSymbolFake = async (field: FieldInfo): Promise<string> => {
  const { widgetId } = field.interface;
  const { validations = [], id } = field.settings;

  const { in: values } = validations.find((validation) => Boolean(validation?.in)) || {};
  if (values) {
    return oneOf(values as string[]);
  }

  let result = '';

  if (widgetId === 'urlEditor') {
    result = faker.internet.url();
  }

  if (widgetId === 'slugEditor') {
    result = faker.lorem.slug();
  }

  const byId = getTextForId(id);
  if (!result && byId) {
    return byId;
  }

  if (!result && ['dropdown', 'radio'].includes(widgetId)) {
    result = faker.lorem.word();
  }

  const { regexp } = validations.find((validation) => Boolean(validation?.regexp)) || {};
  if (!result && regexp) {
    result = getRegexValue(regexp);
  }

  if (!result) {
    result = faker.lorem.sentence();
  }

  const { size } = validations.find((validation) => Boolean(validation?.size)) || {};
  if (size) {
    const { min = 0, max = 255 } = size;
    const count = randomInt(min, Math.min(255, max));
    result = result.slice(0, count);

    while (result.length < min) {
      result = `${result} ${faker.lorem.sentence()}`.slice(0, count);
    }
  }

  return result.slice(0, 255);
};

export const getTextFake = async (field: FieldInfo): Promise<string> => {
  const { validations = [], id } = field.settings;
  const { in: values } = validations.find((validation) => Boolean(validation?.in)) || {};

  let result = '';
  if (values) {
    result = oneOf(values as string[]);
  }

  const byId = getTextForId(id);
  if (!result && byId) {
    result = byId;
  }

  const { regexp } = validations.find((validation) => Boolean(validation?.regexp)) || {};
  if (!result && regexp) {
    result = getRegexValue(regexp);
  }

  if (!result) {
    result = faker.lorem.lines();
  }

  const { size } = validations.find((validation) => Boolean(validation?.size)) || {};
  if (size) {
    const { min = 0, max = 50000 } = size;
    const count = randomInt(min, max);
    result = result.slice(0, count);

    while (result.length < min) {
      result = `${result} ${faker.lorem.paragraphs(5)}`.slice(0, count);
    }
  }

  return result;
};

export const getAssetFake = async (): Promise<KeyValueMap> => {
  const sizes = [640, 480, 600, 800, 1024];
  const width = oneOf(sizes);
  const height = oneOf(sizes);

  return {
    mime_type: 'image/jpeg',
    url: faker.image.image(width, height),
    title: faker.lorem.words(),
    description: faker.lorem.lines(),
    width,
    height,
    file_size: faker.datatype.number({ min: 1000, max: 200000 }),
  };
};

export const getEntryScheme = async (field: FieldInfo): Promise<KeyValueMap> => {
  const { validations } = field.settings;

  const { linkContentType = [] } =
    validations.find((validation) => Boolean(validation?.linkContentType)) || {};

  if (linkContentType.length > 0) {
    return {
      id: 'default',
      content_type: oneOf(linkContentType),
    };
  }

  return {};
};

export const getLinkFake = async (field: FieldInfo): Promise<KeyValueMap> => {
  if (field?.settings?.linkType === LINK_TYPE_ASSET) {
    return getAssetFake();
  }

  return getEntryScheme(field);
};

export const getRichtextFake = async (field: FieldInfo): Promise<KeyValueMap> => {
  const { validations } = field.settings;

  const { enabledMarks: marks = [] } =
    validations.find((validation) => Boolean(validation?.enabledMarks)) || {};

  const { enabledNodeTypes: nodeTypes = [] } =
    validations.find((validation) => Boolean(validation?.enabledNodeTypes)) || {};

  return {
    node_type: 'document',
    data: {},
    content: [
      ...nodeTypes
        .filter((nodeType) => nodeType.startsWith('heading'))
        .map((nodeType) => ({
          node_type: nodeType,
          content: [
            {
              node_type: 'text',
              value: nodeType,
              marks: [],
              data: {},
            },
          ],
          data: {},
        })),
      ...marks.map((mark) => ({
        node_type: 'paragraph',
        content: [
          {
            node_type: 'text',
            value: mark,
            marks: [mark],
            data: {},
          },
        ],
        data: {},
      })),
      {
        node_type: 'paragraph',
        content: [
          {
            node_type: 'text',
            value: faker.lorem.sentence(),
            marks: [],
            data: {},
          },
        ],
        data: {},
      },
    ],
  };
};

export const getArrayFake = async (field: FieldInfo): Promise<unknown[]> => {
  const { validations } = field.settings;
  const { size } = validations.find((validation) => Boolean(validation?.size)) || {};
  let count = randomInt(0, 5);
  if (size) {
    count = randomInt(size?.min ?? 0, size?.max ?? (size?.min ?? 0) + 5);
  }

  if (field.settings.items.type === FIELD_TYPE_SYMBOL) {
    return Promise.all(
      Array(count)
        .fill('')
        .map(async () =>
          getSymbolFake({
            ...field,
            settings: { ...field.settings.items, id: field.settings.id },
          })
        )
    );
  }

  if (field.settings.items.type === FIELD_TYPE_TEXT) {
    return Promise.all(
      Array(count)
        .fill('')
        .map(async () =>
          getTextFake({
            ...field,
            settings: { ...field.settings.items, id: field.settings.id },
          })
        )
    );
  }

  if (
    field.settings.items.type === FIELD_TYPE_LINK &&
    field.settings.items.linkType === LINK_TYPE_ASSET
  ) {
    return Promise.all(
      Array(count)
        .fill('')
        .map(async () => getAssetFake())
    );
  }

  if (
    field.settings.items.type === FIELD_TYPE_LINK &&
    field.settings.items.linkType === LINK_TYPE_ENTRY
  ) {
    return Promise.all(
      Array(count)
        .fill('')
        .map(async () =>
          getEntryScheme({
            ...field,
            settings: { ...field.settings.items, id: field.settings.id },
          })
        )
    );
  }
};
