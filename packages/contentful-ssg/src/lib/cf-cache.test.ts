import { ReplaySubject } from 'rxjs';
import { Config, Locale, ObservableContext, RunResult } from '../types.js';
import { getContent } from '../__test__/mock.js';
import { getObservableCount } from './observable.js';
import { getCacheDir, initializeCache } from './cf-cache.js';
import { remove } from 'fs-extra';

const config = {
  spaceId: 'test-space',
  environmentId: 'test-environment',
} as Config;

const cache = initializeCache(config);

jest.mock('find-cache-dir', () => jest.fn().mockImplementation(({ name }) => `CACHE-TEST/${name}`));

afterEach(async () => {
  await remove('CACHE-TEST');
});

test('getCacheDir', async () => {
  const expected = `CACHE-TEST/contentful-ssg/sync-${config.spaceId}-${config.environmentId}`;
  const value = await getCacheDir(config);
  expect(value).toEqual(expected);
});

test('syncToken', async () => {
  const token = 'TEST-TOKEN';
  expect(cache.hasSyncToken()).toBe(false);
  await cache.setSyncToken(token);
  expect(cache.hasSyncToken()).toBe(true);
  const result = await cache.getSyncToken();
  expect(result).toEqual(token);
  await cache.reset();
  expect(cache.hasSyncToken()).toBe(false);
});

test('syncState', async () => {
  const { entries, assets, entryMap, assetMap } = await getContent();
  const subject$ = new ReplaySubject<ObservableContext>();

  const locale: Locale = {
    name: `Locale: en`,
    code: `en`,
    default: false,
    fallbackCode: null,
    sys: {
      id: `locale-en`,
      type: 'Locale',
      version: 1,
    },
  };

  entries.forEach((entry) => {
    subject$.next({ id: entry.sys.id, contentTypeId: entry.sys.contentType.sys.id, locale });
  });

  const state: RunResult = {
    localized: {
      en: { entries, assets, entryMap, assetMap },
    },
    observables: {
      en: subject$,
    },
  };

  expect(cache.hasSyncState()).toBe(false);
  await cache.setSyncState(state);
  expect(cache.hasSyncState()).toBe(true);
  const result = await cache.getSyncState();
  expect(result.localized.en.entries).toEqual(state.localized.en.entries);
  expect(result.localized.en.assets).toEqual(state.localized.en.assets);

  const observableCount = await getObservableCount(result.observables.en);
  expect(observableCount).toEqual(entries.length);

  await cache.reset();
  expect(cache.hasSyncToken()).toBe(false);
});
