import { Asset } from '@jungvonmatt/contentful-ssg';
import { mapAssetLink } from '@jungvonmatt/contentful-ssg/mapper/map-reference-field';
import { localizeEntry } from '@jungvonmatt/contentful-ssg/tasks/localize';
import {
  getContent,
  getRuntimeContext,
  getTransformContext,
} from '@jungvonmatt/contentful-ssg/__test__/mock';

import { EntryConfig, PluginConfig } from '../types.js';

import { getRatioConfig, getFocusArea } from './image.js';

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

describe('getFocusArea', () => {
  test('default', async () => {
    const transformContext = await getTransformContextMock();
    const focusArea = getFocusArea(transformContext, {});

    expect(focusArea).toEqual('center');
  });

  test('backwards compatibility', async () => {
    const transformContext = await getTransformContextMock({ focus_area: 'face' });
    const focusArea = getFocusArea(transformContext, {});

    expect(focusArea).toEqual('face');
  });

  test('media_focus_area field', async () => {
    const transformContext = await getTransformContextMock({ media_focus_area: 'top' });
    const focusArea = getFocusArea(transformContext, {});

    expect(focusArea).toEqual('top');
  });

  test('configured field - default', async () => {
    const transformContext = await getTransformContextMock({ reference: 'bottom' });
    const focusArea = getFocusArea(transformContext, { default: 'field:reference' });

    expect(focusArea).toEqual('bottom');
  });

  test('configured field - content-type default', async () => {
    const transformContext = await getTransformContextMock({ a: 'bottom', b: 'right' });
    const focusArea = getFocusArea(transformContext, {
      default: 'field:a',
      contentTypes: { ct: { default: 'field:b' } },
    });

    expect(focusArea).toEqual('right');
  });

  test('configured field - content-type fieldId', async () => {
    const transformContext = await getTransformContextMock({
      a: 'bottom',
      b: 'right',
      c: 'top_right',
    });
    const focusArea = getFocusArea(transformContext, {
      default: 'field:a',
      contentTypes: { ct: { default: 'field:b', fields: { media: 'field:c' } } },
    });

    expect(focusArea).toEqual('top_right');
  });

  test('field by naming convention', async () => {
    const transformContext = await getTransformContextMock({
      a: 'bottom',
      b: 'right',
      media_focus_area: 'top_left',
    });
    const focusArea = getFocusArea(transformContext, {
      default: 'field:a',
      contentTypes: { ct: { default: 'field:b', fields: { media: 'top' } } },
    });

    expect(focusArea).toEqual('top_left');
  });

  test('config default', async () => {
    const transformContext = await getTransformContextMock();
    const focusArea = getFocusArea(transformContext, {
      default: 'bottom',
    });

    expect(focusArea).toEqual('bottom');
  });

  test('config content-type default', async () => {
    const transformContext = await getTransformContextMock();
    const focusArea = getFocusArea(transformContext, {
      default: 'top_left',
      contentTypes: { ct: { default: 'top_right' } },
    });

    expect(focusArea).toEqual('top_right');
  });

  test('config field', async () => {
    const transformContext = await getTransformContextMock();
    const focusArea = getFocusArea(transformContext, {
      default: 'top_left',
      contentTypes: { ct: { default: 'top_right', fields: { media: 'top' } } },
    });

    expect(focusArea).toEqual('top');
  });

  test('config field fallback ct', async () => {
    const transformContext = await getTransformContextMock();
    const focusArea = getFocusArea(transformContext, {
      default: 'top_left',
      contentTypes: { ct: { default: 'top_right', fields: { media: 'field:b' } } },
    });

    expect(focusArea).toEqual('top_right');
  });

  test('config field fallback default', async () => {
    const transformContext = await getTransformContextMock();
    const focusArea = getFocusArea(transformContext, {
      default: 'top_left',
      contentTypes: { ct: { default: 'field:a', fields: { media: 'field:b' } } },
    });

    expect(focusArea).toEqual('top_left');
  });

  test('config field fallback center', async () => {
    const transformContext = await getTransformContextMock();
    const focusArea = getFocusArea(transformContext, {
      contentTypes: { ct: { default: 'field:a', fields: { media: 'field:b' } } },
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
