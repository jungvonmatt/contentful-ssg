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
    getEnvironment: vi.fn().mockResolvedValue({}),
    pagedGet: vi.fn().mockResolvedValue({
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
    }),
  };
});

vi.mock('read-pkg-up', () => ({
  readPackageUp: vi.fn().mockResolvedValue({
    packageJson: { name: 'contentful', version: '10.5.0' },
  }),
}));

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
