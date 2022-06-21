import { Config, RuntimeContext } from '../types';
import { fetch } from './fetch';

import { getEntriesLinkedToEntry, getEntriesLinkedToAsset } from '../lib/contentful.js';

jest.mock('../lib/contentful.js', () => {
  return {
    getContent: jest
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
    getFieldSettings: jest.fn().mockReturnValue({ fields: 'TEST' }),
    getEntriesLinkedToEntry: jest.fn().mockReturnValue({ fields: 'TEST' }),
    getEntriesLinkedToAsset: jest.fn().mockReturnValue({ fields: 'TEST' }),
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
