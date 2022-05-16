import { Config, RuntimeContext } from '../types';
import { fetch } from './fetch';

jest.mock('../lib/contentful.js', () => {
  return {
    getContent: jest.fn().mockResolvedValue({
      locales: [{ default: true, code: 'en' }],
      contentTypes: [],
      somethingelse: false,
    }),
    getFieldSettings: jest.fn().mockReturnValue({ fields: 'TEST' }),
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
  });
});
