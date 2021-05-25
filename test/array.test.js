/* eslint-disable unicorn/consistent-function-scoping */
/* eslint-env jest */
import { filterAsync, forEachAsync, mapAsync } from '../lib/array';

const waitFor = (ms) => new Promise((resolve) => setTimeout(resolve, ms)); // eslint-disable-line no-promise-executor-return
const waitRandom = () => waitFor(Math.floor(Math.random() * Math.floor(50)));

test('async map', async () => {
  const afunc = async (value) => {
    await waitRandom();
    return value * value;
  };

  const function_ = (value) => value * value;
  const array = [1, 2, 3, 4, 5, 6, 7, 8];
  const expected = array.map((value) => function_(value));

  const result1 = await mapAsync(array, (v) => function_(v));
  const result2 = await mapAsync(array, (v) => afunc(v));

  expect(result1).toEqual(expected);
  expect(result2).toEqual(expected);
});

test('async map (default)', async () => {
  const array = [1, 2, 3, 4, 5, 6, 7, 8];

  const result = await mapAsync(array);
  expect(result).toEqual(array);
});

test('async map (empty)', async () => {
  const result = await mapAsync();
  expect(result).toEqual([]);
});

test('async filter', async () => {
  const afunc = async (value) => {
    await waitRandom();
    return value % 2;
  };

  const function_ = (value) => value % 2;
  const array = [1, 2, 3, 4, 5, 6, 7, 8];
  const expected = array.filter((value) => function_(value));

  const result1 = await filterAsync(array, function_);
  const result2 = await filterAsync(array, afunc);

  expect(result1).toEqual(expected);
  expect(result2).toEqual(expected);
});

test('async filter (default)', async () => {
  // eslint-disable-next-line unicorn/no-null
  const array = [1, 0, 3, false, 5, undefined, 7, null];

  const result = await filterAsync(array);
  expect(result).toEqual([1, 3, 5, 7]);
});

test('async filter (empty)', async () => {
  const result = await filterAsync();
  expect(result).toEqual([]);
});

test('async forEach', async () => {
  const array = [1, 2, 3, 4, 5, 6, 7, 8];
  const expected = [];
  const result1 = [];
  const result2 = [];
  for (const v of array) expected.push(v);

  await forEachAsync(array, (v) => result1.push(v));
  await forEachAsync(array, async (v) => {
    await waitRandom();
    result2.push(v);
  });

  expect(result1).toEqual(expected);
  expect(result2).toEqual(expected);
});
