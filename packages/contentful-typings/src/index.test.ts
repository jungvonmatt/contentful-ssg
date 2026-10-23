import { vi } from 'vitest';
import { generateTypings } from './index.js';

vi.mock('@jungvonmatt/contentful-config', () => ({
  loadContentfulConfig: vi.fn().mockResolvedValue({
    config: {
      managementToken: 'mt',
      environmentId: 'master',
      spaceId: 'space',
    },
  }),
}));

vi.mock('@jungvonmatt/contentful-ssg/lib/contentful', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    getEnvironment: vi.fn().mockResolvedValue({ sys: { id: 'master' } }),
  };
});

vi.mock('contentful-management', async (importOriginal) => {
  const actual = await importOriginal<typeof import('contentful-management')>();
  return {
    ...actual,
  };
});

vi.mock('@jungvonmatt/contentful-client', () => ({
  getManagementClient: vi.fn().mockReturnValue({
    contentType: {
      getMany: vi.fn().mockResolvedValue({
        items: [
          {
            sys: { id: 'page', type: 'ContentType' },
            name: 'Page',
            displayField: 'title',
            description: '',
            fields: [
              {
                id: 'title',
                name: 'Title',
                type: 'Symbol',
                required: true,
                localized: false,
                omitted: false,
                disabled: false,
                validations: [],
              },
            ],
          },
        ],
        total: 1,
        skip: 0,
        limit: 100,
      }),
    },
  }),
}));

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual,
    readFile: vi.fn().mockImplementation((filePath: string) => {
      if (typeof filePath === 'string' && filePath.includes('contentful/package.json')) {
        return Promise.resolve(JSON.stringify({ name: 'contentful', version: '10.5.0' }));
      }
      return actual.readFile(filePath, 'utf-8');
    }),
  };
});

describe('generateTypings', () => {
  test('renders V10 skeleton types by default', async () => {
    console.log = vi.fn();
    const out = await generateTypings({});
    expect(out).toContain('Page');
    expect(out).toContain('Skeleton');
  });

  test('legacy: true forces DefaultContentTypeRenderer', async () => {
    console.log = vi.fn();
    const out = await generateTypings({ legacy: true });
    expect(out).toContain('Page');
  });

  test('typeguard option emits guards', async () => {
    console.log = vi.fn();
    const out = await generateTypings({ typeguard: true });
    expect(out).toContain('export function isPage');
  });

  test('jsdoc + localized options work together', async () => {
    console.log = vi.fn();
    const out = await generateTypings({ jsdoc: true, localized: true });
    expect(out).toContain('Page');
  });
});
