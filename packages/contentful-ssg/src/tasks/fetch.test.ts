import { vi } from 'vitest';
import { Config, RuntimeContext } from '../types';
import { fetch } from './fetch';

import { getEntriesLinkedToEntry, getEntriesLinkedToAsset } from '@jungvonmatt/contentful-client';

vi.mock('@jungvonmatt/contentful-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@jungvonmatt/contentful-client')>();
  return {
    ...actual,
    getEntriesLinkedToEntry: vi.fn().mockReturnValue({ fields: 'TEST' }),
    getEntriesLinkedToAsset: vi.fn().mockReturnValue({ fields: 'TEST' }),
    getFieldSettings: vi.fn().mockReturnValue({ fields: 'TEST' }),
  };
});

vi.mock('../lib/contentful.js', () => {
  return {
    getContent: vi
      .fn()
      .mockReturnValueOnce({
        locales: [{ default: true, code: 'en' }],
        contentTypes: [],
        somethingelse: false,
      })
      .mockReturnValue({
        locales: [{ default: true, code: 'en' }],
        contentTypes: [],
        somethingelse: false,
        entries: Array(5),
        assets: Array(3),
        deletedEntries: [{ sys: { id: 'entry' } }],
        deletedAssets: [{ sys: { id: 'asset' } }],
      }),
  };
});

describe('Fetch', () => {
  test('fetch content', async () => {
    const context = { defaultLocale: 'en' } as RuntimeContext;
    await fetch(context, {} as Config);

    expect(context).toEqual({
      defaultLocale: 'en',
      data: {
        locales: [{ default: true, code: 'en' }],
        entries: [],
        contentTypes: [],
        somethingelse: false,
        fieldSettings: { fields: 'TEST' },
      },
    });

    expect(getEntriesLinkedToEntry).not.toHaveBeenCalled();
    expect(getEntriesLinkedToAsset).not.toHaveBeenCalled();
  });

  test('fetch content (sync)', async () => {
    const context = { defaultLocale: 'en' } as RuntimeContext;
    await fetch(context, {} as Config);
    expect(getEntriesLinkedToEntry).toHaveBeenCalled();
    expect(getEntriesLinkedToAsset).toHaveBeenCalled();
  });
});
