import fs from 'fs-extra';
import path from 'path';
import {
  FIELD_TYPE_LINK,
  getFieldSettings,
  LINK_TYPE_ASSET,
  LINK_TYPE_ENTRY,
} from '../lib/contentful.js';
import { FileManager } from '../lib/file-manager.js';
import { HookManager } from '../lib/hook-manager.js';
import type {
  ContentType,
  Locale,
  Asset,
  Entry,
  Config,
  RuntimeContext,
  TransformContext,
} from '../types.js';

const cache = new Map();

export const readFixture = async (file) => {
  if (!cache.has(file)) {
    const content = await fs.readJSON(path.join(__dirname, '../../src/__test__/fixtures', file));
    cache.set(file, content);
  }

  return cache.get(file);
};

export const readFixtureSync = (file) => {
  if (!cache.has(file)) {
    const content = fs.readJSONSync(path.join(__dirname, '../../src/__test__/fixtures', file));
    cache.set(file, content);
  }

  return cache.get(file);
};

export const getContent = async () => {
  const assets = (await readFixture('assets.json')) as Asset[];
  const entries = (await readFixture('entries.json')) as Entry[];
  const locales = (await readFixture('locales.json')) as Locale[];
  const contentTypes = (await readFixture('content_types.json')) as ContentType[];

  const [entry] = entries;
  const [asset] = assets;
  const assetLink = {
    sys: {
      id: 'asset-id',
      type: FIELD_TYPE_LINK,
      linkType: LINK_TYPE_ASSET,
    },
  };

  const entryLink = {
    sys: {
      id: 'entry-id',
      type: FIELD_TYPE_LINK,
      linkType: LINK_TYPE_ENTRY,
    },
  };

  const assetMap = new Map(assets.map((asset) => [asset.sys.id, asset]));
  const entryMap = new Map(entries.map((entry) => [entry.sys.id, entry]));

  return {
    entries,
    assets,
    contentTypes,
    locales,
    assetLink,
    entryLink,
    entry,
    asset,
    assetMap,
    entryMap,
  };
};

export const getConfig = (fixture: Partial<Config> = {}): Config => ({
  directory: 'test',
  plugins: [],
  ...fixture,
});

export const getRuntimeContext = (fixture: Partial<RuntimeContext> = {}): RuntimeContext => {
  const assets = readFixtureSync('assets.json') as Asset[];
  const entries = readFixtureSync('entries.json') as Entry[];
  const locales = readFixtureSync('locales.json') as Locale[];
  const contentTypes = readFixtureSync('content_types.json') as ContentType[];

  const fieldSettings = getFieldSettings(contentTypes);
  const { code: defaultLocale } = locales.find((locale) => locale.default) || locales[0];

  const result = {
    config: getConfig(),
    localized: new Map(),
    data: {
      assets,
      entries,
      contentTypes,
      locales,
      fieldSettings,
    },
    defaultLocale,
    ...fixture,
  };

  const hooks = new HookManager(result as RuntimeContext, result.config);
  const fileManager = new FileManager({ directory: '/testbase' });
  fileManager.cleanup = jest.fn();
  fileManager.initialize = jest.fn();
  fileManager.deleteFile = jest.fn();
  fileManager.writeFile = jest.fn();

  return { ...result, hooks, fileManager } as RuntimeContext;
};

export const getTransformContext = (fixture: Partial<TransformContext> = {}): TransformContext =>
  ({
    assets: [],
    entries: [],
    assetMap: new Map(),
    entryMap: new Map(),
    ...fixture,
  } as TransformContext);
