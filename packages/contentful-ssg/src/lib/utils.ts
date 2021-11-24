import type { CollectOptions, Entry, TransformContext } from '../types.js';
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
