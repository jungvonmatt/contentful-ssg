import type { CollectOptions, Entry, TransformContext } from '../types.js';
import { getContentId, getContentTypeId } from './contentful.js';
import { ReplaySubject, map, distinct, filter } from 'rxjs';
import dlv from 'dlv';

// eslint-disable-next-line @typescript-eslint/naming-convention
const DEFAULT_WAIT_TIMEOUT = 20000;

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

const dependencies: Record<string, string[]> = {};

const buildDependencies = (v: { source: string; dest: string }) => {
  if ((dependencies?.[v.source] ?? []).includes(v.dest)) {
    return dependencies;
  }

  if (dependencies[v.source]) {
    dependencies[v.source] = [...dependencies[v.source], v.dest];
  } else {
    dependencies[v.source] = [v.dest];
  }

  Object.entries({ ...dependencies })
    .filter(([, value]) => value.includes(v.source))
    .forEach(([key, value]) => {
      dependencies[key] = [...new Set([...value, v.dest, ...(dependencies[v.dest] || [])])];
    });

  return dependencies;
};

const waitForSubject = new ReplaySubject<{ source: string; dest: string }>();

const cyclicErrorObservable = waitForSubject
  .asObservable()
  .pipe(map((value) => buildDependencies(value)));

/**
 * Wait for entry to be transformed
 */
export const waitFor = (
  transformContext: Pick<TransformContext, 'entry' | 'observable' | 'entryMap'>
) => {
  const sourceEntry = transformContext.entry;
  const sourceId = getContentId(sourceEntry);
  const sourceContentTypeId = getContentTypeId(sourceEntry);
  const source = `${sourceId} (${sourceContentTypeId})`;

  return async (id: string, waitTimeout = DEFAULT_WAIT_TIMEOUT) => {
    // Make sure we don't try to wait for the current entry
    if (sourceId === id) {
      const source = `${sourceId} (${sourceContentTypeId})`;
      throw new Error(`Can't wait for yourself.
Entry ${source} waiting for ${source}.`);
    }

    waitForSubject.next({ source: getContentId(sourceEntry), dest: id });
    const destEntry = transformContext.entryMap.get(id);
    const destId = getContentId(destEntry);
    const destContentTypeId = getContentTypeId(destEntry);
    const dest = `${destId} (${destContentTypeId})`;

    return new Promise((resolve, reject) => {
      // If anything goes wrong, reject promise after waitTimeout
      const timeout = setTimeout(() => {
        reject(
          new Error(
            `Exceeded timeout of ${waitTimeout} ms while waiting for entry ${id} to complete.
Entry ${source} waiting for ${dest}.`
          )
        );
      }, waitTimeout);

      if (transformContext.entryMap.has(id)) {
        transformContext.observable
          .pipe(filter((ctx) => ctx?.entry?.sys?.id === id))
          .subscribe((value) => {
            clearTimeout(timeout);
            if (value.error) {
              reject(new Error(`Awaited entry ${dest} errored: ${value?.error?.message ?? ''}`));
            } else {
              resolve(value);
            }
          });

        cyclicErrorObservable
          .pipe(filter((v) => v?.[sourceId]?.includes(sourceId)))
          .pipe(distinct())
          .subscribe((v) => {
            clearTimeout(timeout);
            const deps = v?.[sourceId] ?? [];
            reject(
              new Error(`Found cyclic dependency in ${source}: ${[sourceId, ...deps].join(' -> ')}`)
            );
          });
      } else {
        clearTimeout(timeout);
        reject(new Error(`No entry with id "${id}" available`));
      }
    });
  };
};
