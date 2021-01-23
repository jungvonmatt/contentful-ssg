const { TestScheduler } = require('jest');
/* eslint-env jest */
const { groupBy, getContentTypeDirectory, snakeCaseKeys, removeEmpty, omitKeys, collect } = require('../lib/utils');

describe('Utils', () => {
  test('collect', () => {
    const data = [
      { sys: { id: 1 }, fields: { slug: 'a' } },
      { sys: { id: 2 }, fields: { slug: 'b', parent: 1 } },
      { sys: { id: 3 }, fields: { slug: 'c', parent: 2 } },
      { sys: { id: 4 }, fields: { slug: 'd', parent: 3 } },
      { sys: { id: 5 }, fields: { slug: 'e', parent: 4 } },
    ];

    const getter = {
      getId: (item) => item.sys.id,
      getNextId: (item) => item.fields.parent,
      getValue: (item) => item.fields.slug,
    };

    const a = collect(data[4], data, { ...getter, reverse: true });
    const b = collect(data[4], data, { ...getter, reverse: false });

    expect(a).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(b).toEqual(['e', 'd', 'c', 'b', 'a']);
  });

  test('omitKeys', () => {
    const value = omitKeys({ a: 1, b: 2, c: 3 }, 'a', 'c');
    expect(value).toEqual({ b: 2 });
  });

  test('removeEmpty', () => {
    const value = removeEmpty({
      a: { c: undefined },
      b: undefined,
      c: [1, { x: 1, y: undefined, z: [undefined, 7] }, 3, undefined, 5],
    });
    expect(value).toEqual({ a: {}, c: [1, { x: 1, z: [7] }, 3, 5] });
  });

  test('groupBy', () => {
    const value = groupBy(
      [
        { a: 'first', b: 1 },
        { a: 'second', b: 2 },
        { a: 'second', b: 3 },
        { a: 'first', b: 4 },
      ],
      'a'
    );
    expect(value).toEqual({
      first: [
        { a: 'first', b: 1 },
        { a: 'first', b: 4 },
      ],
      second: [
        { a: 'second', b: 2 },
        { a: 'second', b: 3 },
      ],
    });
  });
});