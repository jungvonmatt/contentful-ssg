/* eslint-env jest */
import {mapAsync, reduceAsync, forEachAsync, filterAsync} from './array';

const waitFor = async ms => new Promise(resolve => {
  setTimeout(resolve, ms);
});
const waitRandom = async () => waitFor(Math.floor(Math.random() * Math.floor(50)));

test('async map', async () => {
  const afunc = async value => {
    await waitRandom();
    return value * value;
  };

  const func = async value => value * value;
  const array = [1, 2, 3, 4, 5, 6, 7, 8];
  const expected = array.map(value => value * value);

  const result1 = await mapAsync(array, func);
  const result2 = await mapAsync(array, afunc);

  expect(result1).toEqual(expected);
  expect(result2).toEqual(expected);
});

test('async forEach', async () => {
  const array = [1, 2, 3, 4, 5, 6, 7, 8];
  const expected = [];
  const result1 = [];
  const result2 = [];
  array.forEach(v => expected.push(v));

  await forEachAsync(array, v => {
    result1.push(v);
  });
  await forEachAsync(array, async v => {
    await waitRandom();
    result2.push(v);
  });

  expect(result1).toEqual(expected);
  expect(result2).toEqual(expected);
});

test('async filter', async () => {
  const afunc = async value => {
    await waitRandom();
    return Boolean(value % 2);
  };

  const func = async value => Boolean(value % 2);
  const array = [1, 2, 3, 4, 5, 6, 7, 8];
  const expected = array.filter(value => Boolean(value % 2));

  const result1 = await filterAsync(array, func);
  const result2 = await filterAsync(array, afunc);

  expect(result1).toEqual(expected);
  expect(result2).toEqual(expected);
});

test('async reduce (initial value)', async () => {
  const array = [1, 2, 3, 4, 5, 6];
  const expected = '0!1!2!3!4!5!6!';
  const results = await reduceAsync(
    array,
    async (str, i) => {
      await waitRandom();
      const val = await Promise.resolve(`${i}!`);
      return str + val;
    },
    '0!',
  );

  const results2 = await reduceAsync(
    array,
    (str, i) => {
      const val = `${i}!`;
      return `${typeof str === 'string' ? str : ''}${val}`;
    },
    '0!',
  );

  expect(results).toEqual(expected);
  expect(results2).toEqual(expected);
});

test('async reduce', async () => {
  const array = [1, 2, 3, 4, 5, 6];
  const expected = '1!2!3!4!5!6!';
  const results = await reduceAsync(
    array,
    async (str, i) => {
      await waitRandom();
      const val = await Promise.resolve(`${i}!`);
      return `${typeof str === 'string' ? str : ''}${val}`;
    },
  );

  const results2 = await reduceAsync(
    array,
    (str, i) => {
      const val = `${i}!`;
      return `${typeof str === 'string' ? str : ''}${val}`;
    },
  );

  expect(results).toEqual(expected);
  expect(results2).toEqual(expected);
});
