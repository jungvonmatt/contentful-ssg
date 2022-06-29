import { ReplaySubject } from 'rxjs';
import { getObservableValues, getObservableCount } from './observable.js';

test('getObservableValues', async () => {
  const subject$ = new ReplaySubject<Record<string, number>>();

  const values = [
    { a: 1, b: 2, c: 3 },
    { a: 4, b: 5, c: 6 },
    { a: 7, b: 8, c: 9 },
  ];

  values.forEach((value) => subject$.next(value));

  const result = await getObservableValues(subject$);

  expect(result).toEqual(values);
});

test('getObservableValues callback', async () => {
  const values = [
    { a: 1, b: 2, c: 3 },
    { a: 4, b: 5, c: 6 },
    { a: 7, b: 8, c: 9 },
  ];

  const subject$ = new ReplaySubject<typeof values[0]>();

  const cb = (input: typeof values[0]) => {
    return input.a + input.b + input.c;
  };

  const expected = values.map((value) => cb(value));

  values.forEach((value) => subject$.next(value));

  const result = await getObservableValues<typeof values[0], number>(subject$, cb);

  expect(result).toEqual(expected);
});

test('getObservableCount', async () => {
  const values = [
    { a: 1, b: 2, c: 3 },
    { a: 4, b: 5, c: 6 },
    { a: 7, b: 8, c: 9 },
  ];

  const subject$ = new ReplaySubject<typeof values[0]>();

  values.forEach((value) => subject$.next(value));

  const result = await getObservableCount(subject$);

  expect(result).toEqual(values.length);
});

test('getObservableCount filter', async () => {
  const values = [
    { a: 1, b: 2, c: 3 },
    { a: 4, b: 5, c: 6 },
    { a: 7, b: 8, c: 9 },
  ];

  const subject$ = new ReplaySubject<typeof values[0]>();

  values.forEach((value) => subject$.next(value));

  const result = await getObservableCount(subject$, (value) => value.b > 4);

  expect(result).toEqual(2);
});
