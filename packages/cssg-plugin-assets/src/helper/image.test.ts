import { Asset } from '@jungvonmatt/contentful-ssg';
import { mapAssetLink } from '@jungvonmatt/contentful-ssg/mapper/map-reference-field';
import { localizeEntry } from '@jungvonmatt/contentful-ssg/tasks/localize';
import {
  getContent,
  getRuntimeContext,
  getTransformContext,
} from '@jungvonmatt/contentful-ssg/__test__/mock';

import { EntryConfig, FocusAreaConfig, PluginConfig } from '../types.js';

import { getRatioConfig, getFocusArea } from './image.js';

/**
 * Get transformcontext with a mock entry andf fieldId media
 * @param fields fields available in entry
 * @returns
 */
const getTransformContextMock = async (fields: Record<string, string> = {}) => {
  const content = await getContent();
  const runtimeContext = getRuntimeContext();
  const entry = localizeEntry(content.entry, 'en-US', runtimeContext.data);

  entry.sys.contentType.sys.id = 'ct';

  const transformContext = getTransformContext({
    entry: { ...entry, fields },
    fieldId: 'media',
  });

  return transformContext;
};

const getTestFocusArea = async (
  test:
    | {
        fields?: Record<string, string>;
        config?: FocusAreaConfig;
      }
    | undefined
) => {
  const transformContext = await getTransformContextMock(test?.fields ?? {});
  return getFocusArea(transformContext, test?.config ?? {});
};

describe('getFocusArea', () => {
  test('default', async () => {
    const focusArea = await getTestFocusArea({
      config: {},
      fields: {},
    });

    expect(focusArea).toEqual('center');
  });

  test('backwards compatibility', async () => {
    const focusArea = await getTestFocusArea({
      config: {},
      fields: { focus_area: 'face' },
    });

    expect(focusArea).toEqual('face');
  });

  test('media_focus_area field', async () => {
    const focusArea = await getTestFocusArea({
      config: {},
      fields: { media_focus_area: 'top' },
    });

    expect(focusArea).toEqual('top');
  });

  test('configured field - default', async () => {
    const focusArea = await getTestFocusArea({
      config: { default: 'field:reference' },
      fields: { reference: 'bottom' },
    });

    expect(focusArea).toEqual('bottom');
  });

  test('configured field - content-type default', async () => {
    const focusArea = await getTestFocusArea({
      config: { default: 'field:a', contentTypes: { ct: { default: 'field:b' } } },
      fields: { a: 'bottom', b: 'right' },
    });

    expect(focusArea).toEqual('right');
  });

  test('configured field - content-type fieldId', async () => {
    const focusArea = await getTestFocusArea({
      config: {
        default: 'field:a',
        contentTypes: { ct: { default: 'field:b', fields: { media: 'field:c' } } },
      },
      fields: { a: 'bottom', b: 'right', c: 'top_right' },
    });

    expect(focusArea).toEqual('top_right');
  });

  test('field by naming convention', async () => {
    const focusArea = await getTestFocusArea({
      config: {
        default: 'field:a',
        contentTypes: { ct: { default: 'field:b', fields: { media: 'top' } } },
      },
      fields: { a: 'bottom', b: 'right', media_focus_area: 'top_left' },
    });

    expect(focusArea).toEqual('top_left');
  });

  test('config default', async () => {
    const focusArea = await getTestFocusArea({
      config: { default: 'bottom' },
      fields: {},
    });

    expect(focusArea).toEqual('bottom');
  });

  test('config content-type default', async () => {
    const focusArea = await getTestFocusArea({
      config: { default: 'top_left', contentTypes: { ct: { default: 'top_right' } } },
      fields: {},
    });

    expect(focusArea).toEqual('top_right');
  });

  test('config field', async () => {
    const focusArea = await getTestFocusArea({
      config: {
        default: 'top_left',
        contentTypes: { ct: { default: 'top_right', fields: { media: 'top' } } },
      },
      fields: {},
    });

    expect(focusArea).toEqual('top');
  });

  test('config field fallback ct', async () => {
    const focusArea = await getTestFocusArea({
      config: {
        default: 'top_left',
        contentTypes: { ct: { default: 'top_right', fields: { media: 'field:b' } } },
      },
      fields: {},
    });

    expect(focusArea).toEqual('top_right');
  });

  test('config field fallback default', async () => {
    const focusArea = await getTestFocusArea({
      config: {
        default: 'top_left',
        contentTypes: { ct: { default: 'field:a', fields: { media: 'field:b' } } },
      },
      fields: {},
    });

    expect(focusArea).toEqual('top_left');
  });

  test('config field fallback center', async () => {
    const focusArea = await getTestFocusArea({
      config: {
        contentTypes: { ct: { default: 'field:a', fields: { media: 'field:b' } } },
      },
      fields: {},
    });

    expect(focusArea).toEqual('center');
  });
});

describe('getRatioConfig', () => {
  test('empty', async () => {
    const transformContext = await getTransformContextMock();
    const c = undefined;
    const ratios = getRatioConfig(transformContext, c);

    expect(ratios).toEqual({});
  });

  test('default', async () => {
    const transformContext = await getTransformContextMock();
    const ratios = getRatioConfig(transformContext, {
      default: { square: 1 },
    });

    expect(ratios).toEqual({ square: 1 });
  });

  test('ct default', async () => {
    const transformContext = await getTransformContextMock();
    const ratios = getRatioConfig(transformContext, {
      default: { square: 1 },
      contentTypes: {
        ct: { default: { rect: 4 / 3 } },
      },
    });

    expect(ratios).toEqual({ rect: 4 / 3 });
  });

  test('field default', async () => {
    const transformContext = await getTransformContextMock();
    const ratios = getRatioConfig(transformContext, {
      default: { square: 1 },
      contentTypes: {
        ct: { default: { rect: 4 / 3 }, fields: { media: { portrait: 2 / 3 } } },
      },
    });

    expect(ratios).toEqual({ portrait: 2 / 3 });
  });
});
