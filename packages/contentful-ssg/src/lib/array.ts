
function series<T, U>(
  reducer: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U | Promise<U>,
  initialValue?: U,
) {
  return async (iterable: T[]) => iterable.reduce(
    async (chain, value, key) => chain.then(async results => reducer(results, value, key, iterable)),
    Promise.resolve(initialValue),
  );
}

/**
 * Async array.map
 * @param iterable
 * @param callback
 */
export async function mapAsync<T, U>(
  iterable: T[],
  callback: (value: T, index?: number, iterable?: T[]) => U | Promise<U>,
): Promise<U[]> {
  const result: U[] = [];
  const promises = iterable.map(async (item, index, array) => callback(
    item,
    index,
    array,
  ));

  for await (const mapped of promises) {
    result.push(mapped);
  }

  return result;
}

/**
 * Async array.forEach
 * @param {Array} array
 * @param {Function} callback
 */
export async function forEachAsync<T>(
  iterable: T[],
  callback: (value: T, index?: number, iterable?: T[]) => void | Promise<void>,
) {
  for (const index of iterable.keys()) {
    await callback(iterable[index], index, iterable); /* eslint-disable-line no-await-in-loop */
  }
}

/**
 * Async array.filter
 * @param iterable
 * @param callback
 */
export async function filterAsync<T>(
  iterable: T[],
  callback: (value: T, index?: number, array?: T[]) => boolean | Promise<boolean>,
): Promise<T[]> {
  return Promise.resolve(iterable).then(async array => array.reduce(async (chain, value, key) => chain.then(
    async (results: T[]) => {
      const active = await callback(value, key, iterable);
      return (active ? [...results, value] : results);
    },
  ),
  Promise.resolve([])));
}

/**
 * Async array.reduce
 * @param iterable
 * @param callback
 * @param initialValue
 */
export async function reduceAsync<T, U>(
  iterable: T[],
  callback: (previousValue: U, currentValue: T, currentIndex?: number, array?: T[]) => U | Promise<U>,
  initialValue?: U,
): Promise<U> {
  return Promise.resolve(iterable).then(series(callback, initialValue));
}
