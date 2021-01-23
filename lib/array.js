/**
 * Async array.map
 * @param {Array} array
 * @param {Function} callback
 */
async function mapAsync(array = [], callback = (a) => a) {
  const result = [];
  for (const index of array.keys()) {
    const mapped = await callback(array[index], index, array); /* eslint-disable-line no-await-in-loop */
    result.push(mapped);
  }

  return result;
}

/**
 * Async array.forEach
 * @param {Array} array
 * @param {Function} callback
 */
async function forEachAsync(array = [], callback = () => {}) {
  for (const index of array.keys()) {
    await callback(array[index], index, array); /* eslint-disable-line no-await-in-loop */
  }
}

/**
 * Async array.filter
 * @param {Array} array
 * @param {Function} callback
 */
async function filterAsync(array = [], filter = (a) => a) {
  const result = [];
  for (const index of array.keys()) {
    const active = await filter(array[index], index, array); /* eslint-disable-line no-await-in-loop */
    if (active) {
      result.push(array[index]);
    }
  }

  return result;
}

module.exports = {
  mapAsync,
  forEachAsync,
  filterAsync,
};
