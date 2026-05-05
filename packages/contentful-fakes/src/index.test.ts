import { vi } from 'vitest';
import { createFakes } from './index.js';

vi.mock('@jungvonmatt/contentful-config', () => ({
  loadContentfulConfig: vi.fn().mockResolvedValue({
    config: {
      managementToken: 'mt',
      environmentId: 'env',
      spaceId: 'space',
    },
  }),
}));

vi.mock('@jungvonmatt/contentful-ssg/lib/contentful', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    getEnvironment: vi.fn().mockResolvedValue({
      getContentTypes: vi.fn().mockResolvedValue({
        items: [
          {
            sys: { id: 'page' },
            fields: [
              { id: 'title', type: 'Symbol', required: true, validations: [] },
              { id: 'body', type: 'Text', required: false, validations: [] },
            ],
          },
          {
            sys: { id: 'author' },
            fields: [{ id: 'name', type: 'Symbol', required: true, validations: [] }],
          },
        ],
      }),
      getEditorInterfaces: vi.fn().mockResolvedValue({
        items: [
          {
            sys: { contentType: { sys: { id: 'page' } } },
            controls: [
              { fieldId: 'title', widgetId: 'singleLine' },
              { fieldId: 'body', widgetId: 'multipleLine' },
            ],
          },
          {
            sys: { contentType: { sys: { id: 'author' } } },
            controls: [{ fieldId: 'name', widgetId: 'singleLine' }],
          },
        ],
      }),
    }),
  };
});

describe('createFakes', () => {
  test('returns fake + minimal data for all content types when no filter', async () => {
    const result = await createFakes([]);
    expect(Object.keys(result).toSorted()).toEqual(['author', 'page']);

    const [pageFull, pageMin] = result.page;
    expect(pageFull).toHaveProperty('title');
    expect(pageFull).toHaveProperty('body');
    // minimal only contains required fields
    expect(pageMin).toHaveProperty('title');
    expect(pageMin).not.toHaveProperty('body');
  });

  test('filters content types by id when ids are given', async () => {
    const result = await createFakes(['page']);
    expect(Object.keys(result)).toEqual(['page']);
  });
});
