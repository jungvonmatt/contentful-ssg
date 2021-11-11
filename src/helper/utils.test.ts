import { Entry, TransformContext } from '../types.js';
import { collect, collectParentValues, collectValues } from './utils.js';

const data = [
  { sys: { id: 1 }, fields: { slug: 'a' } },
  { sys: { id: 2 }, fields: { slug: 'b', parent: 1 } },
  { sys: { id: 3 }, fields: { slug: 'c', parent: 2 } },
  { sys: { id: 4 }, fields: { slug: 'd', parent: 3 } },
  { sys: { id: 5 }, fields: { slug: 'e', parent: 4 } },
] as unknown as Entry[];

const entries = [
  { sys: { id: 1 }, fields: { slug: 'a' } },
  { sys: { id: 2 }, fields: { slug: 'b', parent: { sys: { id: 1 } }, link: { sys: { id: 1 } } } },
  { sys: { id: 3 }, fields: { slug: 'c', parent: { sys: { id: 2 } }, link: { sys: { id: 1 } } } },
  { sys: { id: 4 }, fields: { slug: 'd', parent: { sys: { id: 3 } }, link: { sys: { id: 3 } } } },
  { sys: { id: 5 }, fields: { slug: 'e', parent: { sys: { id: 4 } }, link: { sys: { id: 3 } } } },
] as unknown as Entry[];

const transformContext = { entries } as TransformContext;

describe('Utils', () => {
  test('collectValues', () => {
    const entry = entries[4];
    const slugsReverse = collectValues({ ...transformContext, entry })('fields.slug');
    const slugs = collectValues({ ...transformContext, entry })('fields.slug', { reverse: false });

    expect(slugsReverse).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(slugs).toEqual(['e', 'd', 'c', 'b', 'a']);
  });

  test('collectValues with different link field', () => {
    const entry = entries[4];
    const slugsReverse = collectValues({ ...transformContext, entry })('fields.slug', {
      linkField: 'fields.link',
    });
    const slugs = collectValues({ ...transformContext, entry })('fields.slug', {
      reverse: false,
      linkField: 'fields.link',
    });

    expect(slugsReverse).toEqual(['a', 'c', 'e']);
    expect(slugs).toEqual(['e', 'c', 'a']);
  });

  test('collectParentValues', () => {
    const entry = entries[4];
    const slugsReverse = collectParentValues({ ...transformContext, entry })('fields.slug');
    const slugs = collectParentValues({ ...transformContext, entry })('fields.slug', {
      reverse: false,
    });

    expect(slugsReverse).toEqual(['a', 'b', 'c', 'd']);
    expect(slugs).toEqual(['d', 'c', 'b', 'a']);
  });

  test('collect', () => {
    const getter = {
      getId: (item) => item.sys.id,
      getNextId: (item) => item.fields.parent,
      getValue: (item) => item.fields.slug,
    };

    const a = collect(data[4], data, {
      ...getter,
      reverse: true,
    });
    const b = collect(data[4], data, {
      ...getter,
      reverse: false,
    });

    expect(a).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(b).toEqual(['e', 'd', 'c', 'b', 'a']);
  });
});
