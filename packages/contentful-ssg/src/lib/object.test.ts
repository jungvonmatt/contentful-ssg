/* eslint-disable @typescript-eslint/naming-convention */
import { isObject, omitKeys, removeEmpty, snakeCaseKeys, groupBy } from './object';

test('isObject', async () => {
  const arr = [];
  const obj = {};
  const str = '';
  const num = 1;
  expect(isObject(arr)).toEqual(false);
  expect(isObject(str)).toEqual(false);
  expect(isObject(num)).toEqual(false);
  expect(isObject(obj)).toEqual(true);
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

test('snakeCaseKeys', () => {
  const value = { aTest: [{ testOne: 1, t: 2 }], A: 'b' };
  const expected = { a_test: [{ test_one: 1, t: 2 }], a: 'b' };

  expect(snakeCaseKeys(value)).toEqual(expected);
});
