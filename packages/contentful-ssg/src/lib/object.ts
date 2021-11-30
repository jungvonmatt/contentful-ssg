import dlv from 'dlv';
import { snakeCase } from 'snake-case';

type Entries<T> = Array<
  {
    [K in keyof T]: [K, T[K]];
  }[keyof T]
>;

/**
 *
 * @param something The object to check
 * @returns boolean
 */
export const isObject = (something: any): boolean =>
  Object.prototype.toString.call(something) === '[object Object]';

export const getEntries = <T>(obj: T): Entries<T> => Object.entries(obj) as Entries<T>;
export const fromEntries = <T = Array<[string, unknown]>>(entries: Entries<T>): T =>
  Object.fromEntries(entries) as unknown as T;

/**
 * Omit values by key from object
 * @param {*} obj
 * @param {*} keys
 */
export const omitKeys = <T, K extends keyof T>(obj: T, ...keys: K[]): T => {
  const entries: Entries<T> = getEntries(obj);
  const filtered = entries.filter(([key]) => !keys.includes(key as K));
  return fromEntries(filtered);
};

/**
 * Filter values by key from object
 * @param {*} obj
 * @param {*} keys
 */
export const filterKeys = <T, K extends keyof T>(obj: T, ...keys: K[]): T => {
  const entries: Entries<T> = getEntries(obj);
  const filtered = entries.filter(([key]) => keys.includes(key as K));
  return fromEntries(filtered);
};

/**
 * Recursive remove empty items (null,undefined) from object
 * @param iterable Source object
 * @returns Cleaned object
 */
export const removeEmpty = <T>(iterable: T, strict = true): T => {
  if (Array.isArray(iterable)) {
    return (
      iterable
        .filter((v) => v !== null && v !== undefined && (strict || Boolean(v)))
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        .map((v) => (v === Object(v) ? removeEmpty(v) : v)) as unknown as T
    );
  }

  return fromEntries(
    getEntries(iterable)
      .filter(([, v]) => v !== null && v !== undefined && (strict || Boolean(v)))
      .map(([k, v]) => [k, v === Object(v) ? removeEmpty(v) : v])
  );
};

/**
 * Convert keys in object to shake_case
 * @param {Object} obj
 * @returns {Object}
 */
export const snakeCaseKeys = <T>(iterable: T): T => {
  if (Array.isArray(iterable)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return iterable.map((item) => snakeCaseKeys(item)) as unknown as T;
  }

  if (isObject(iterable)) {
    return fromEntries(
      getEntries(iterable).map(([key, value]) => [
        snakeCase(key as string),
        snakeCaseKeys(value),
      ]) as Entries<T>
    );
  }

  return iterable;
};

/**
 * Group list of objects by a common key
 * e.g.: [{a:'de',b:2},{a:'en',b:3}, {a:'de',b:5}] => {de: [{a:'de',b:2},{a:'de',b:5}], en: [{a:'en',b:3}]}
 * @param {Array} array Array of similar objects
 * @param {String} key Object key to group by
 * @returns {Object} Grouped Object
 */
export const groupBy = <T extends Record<string, unknown>>(
  array: T[],
  key: keyof T
): Record<string, T[]> =>
  array.reduce((acc, value) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const k = dlv(value, key as string);
    // Group initialization
    if (!acc[k]) {
      acc[k] = [];
    }

    // Grouping
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    acc[k].push(value);

    return acc;
  }, {});
