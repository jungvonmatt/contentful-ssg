import type { CollectOptions, Entry, TransformContext } from '../types.js';
import { filter } from 'rxjs';
import dlv from 'dlv';

export const collectValues =
  (transformContext: Pick<TransformContext, 'entry' | 'entryMap'>) =>
  (key, options?: CollectOptions): any[] => {
    const { entry: defaultEntry, entryMap: defaultEntryMap } = transformContext;
    const {
      getNextId,
      linkField,
      entry = defaultEntry,
      entryMap = defaultEntryMap,
    } = options || {};

    const params = {
      getId: (item) => dlv(item, 'sys.id') as string,
      getNextId: (item) => dlv(item, 'fields.parent.sys.id') as string,
      getValue: (item) => dlv(item, key) as unknown,
      reverse: true,
      ...(options || {}),
    };

    if (!getNextId && linkField) {
      params.getNextId = (item) => dlv(item, `${linkField}.sys.id`) as string;
    }

    return collect(entry, entryMap, params);
  };

export const collectParentValues =
  (transformContext: Pick<TransformContext, 'entry' | 'entryMap'>) =>
  (key, options?: CollectOptions): any[] => {
    const { reverse = true } = options || {};
    const values = collectValues(transformContext)(key, options);
    return reverse ? (values || []).slice(0, -1) : (values || []).slice(1);
  };

/**
 * Recursively collect values
 */
export const collect = <T = unknown>(
  entry: Entry,
  entryMap: Map<string, Entry>,
  options: CollectOptions
): T[] => {
  const { getNextId, getValue, reverse } = options;

  const value = getValue(entry) as T;
  const nextId = getNextId(entry);

  if (nextId && entryMap.has(nextId)) {
    const parentValues = collect(entryMap.get(nextId), entryMap, options);
    return (reverse ? [...parentValues, value] : [value, ...parentValues]) as T[];
  }

  return [value];
};

/**
 * Wait for entry to be transformed
 */
export const waitFor =
  (transformContext: Pick<TransformContext, 'entry' | 'observable' | 'entryMap'>) =>
  async (id: string, waitTimeout = 5000) =>
    new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(
          new Error(
            `Exceeded timeout of ${waitTimeout} ms while waiting for entry ${id} to complete`
          )
        );
      }, waitTimeout);
      if (transformContext.entry.sys.id === id) {
        clearTimeout(timeout);
        reject(new Error(`Can't wait for yourself`));
      } else if (transformContext.entryMap.has(id)) {
        transformContext.observable
          .pipe(filter((ctx) => ctx?.entry?.sys?.id === id))
          .subscribe((value) => {
            clearTimeout(timeout);
            resolve(value);
          });
      } else {
        clearTimeout(timeout);
        reject(new Error(`No entry with id "${id}" available`));
      }
    });
