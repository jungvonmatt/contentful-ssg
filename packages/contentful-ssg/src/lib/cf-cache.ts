import findCacheDir from 'find-cache-dir';
import { existsSync } from 'fs';
import { outputFile, remove } from 'fs-extra';
import { readFile } from 'fs/promises';
import path from 'path';
import { serializeError, deserializeError } from 'serialize-error';

import { ReplaySubject } from 'rxjs';
import { deserialize as v8Deserialize, serialize as v8Serialize } from 'v8';
import { ContentfulConfig, ObservableContext, RunResult } from '../types.js';
import { getObservableValues } from './observable.js';

export const getCacheDir = (config: Partial<ContentfulConfig>) => {
  const environmentId = config?.environmentId ?? 'master';
  const spaceId = config?.spaceId ?? 'global';

  const name = `contentful-ssg/sync-${spaceId}-${environmentId}`;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const dir: string = findCacheDir({ name }) || path.join(process.cwd(), '.cache', name);

  return dir;
};

const getTokenFile = (config: Partial<ContentfulConfig>): string =>
  path.join(getCacheDir(config), 'sync-token');

export const setSyncToken = async (token: string, config: Partial<ContentfulConfig>) => {
  const file = getTokenFile(config);

  return outputFile(file, token);
};

export const hasSyncToken = (config: Partial<ContentfulConfig>) => {
  const file = getTokenFile(config);
  return existsSync(file);
};

export const getSyncToken = async (config: Partial<ContentfulConfig>) => {
  const file = getTokenFile(config);

  if (existsSync(file)) {
    return readFile(file, 'utf8');
  }
};

const serialize = async (data: RunResult) => {
  const { localized, observables } = data;

  const observableEntries = await Promise.all(
    Object.entries(observables).map(async ([locale, observable]) => {
      const values = await getObservableValues(observable, (ctx) => {
        return {
          id: ctx.id,
          contentTypeId: ctx.contentTypeId,
          content: ctx.content,
          locale: ctx.locale,
          error: ctx.error ? serializeError(ctx.error) : undefined,
        };
      });

      return [locale, values];
    })
  );

  return v8Serialize({ localized, observableEntries });
};

type CachedRunResult = {
  localized: RunResult['localized'];
  observableEntries: Array<[string, ObservableContext[]]>;
};

const deserialize = async (buffer: Buffer): Promise<RunResult> => {
  try {
    const { localized, observableEntries } = v8Deserialize(buffer) as CachedRunResult;

    const observables = Object.fromEntries(
      observableEntries.map(([locale, data]) => {
        const subject$ = new ReplaySubject<ObservableContext>();
        data.forEach((value) => {
          if (value.error) {
            subject$.next({ ...value, error: deserializeError(value.error) });
          } else {
            subject$.next(value);
          }
        });

        return [locale, subject$];
      })
    );

    return {
      localized,
      observables: observables as RunResult['observables'],
    };
  } catch (error: unknown) {
    console.log(error);
    throw error;
  }
};

const getStateFile = (config: Partial<ContentfulConfig>): string =>
  path.join(getCacheDir(config), 'sync-data');

export const setSyncState = async (state: RunResult, config: Partial<ContentfulConfig>) => {
  const data = await serialize(state);
  const file = getStateFile(config);

  return outputFile(file, data);
};

export const hasSyncState = (config: Partial<ContentfulConfig>) => {
  const file = getStateFile(config);

  return existsSync(file);
};

export const getSyncState = async (config: Partial<ContentfulConfig>): Promise<RunResult> => {
  const file = getStateFile(config);
  if (existsSync(file)) {
    const data = await readFile(file);
    return deserialize(data);
  }
};

export const reset = async (config: Partial<ContentfulConfig>) => {
  const stateFile = getStateFile(config);
  const tokenFile = getTokenFile(config);

  return Promise.all([
    existsSync(stateFile) && remove(stateFile),
    existsSync(tokenFile) && remove(tokenFile),
  ]);
};

export const initializeCache = (config: Partial<ContentfulConfig>) => {
  return {
    async setSyncToken(token) {
      return setSyncToken(token, config);
    },

    async getSyncToken() {
      return getSyncToken(config);
    },

    hasSyncToken() {
      return hasSyncToken(config);
    },

    async setSyncState(state: RunResult) {
      return setSyncState(state, config);
    },

    async getSyncState() {
      return getSyncState(config);
    },

    hasSyncState() {
      return hasSyncState(config);
    },

    async reset() {
      return reset(config);
    },
  };
};
