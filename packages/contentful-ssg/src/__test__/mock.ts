import fs from 'fs-extra';
import path from 'path';
import {
  FIELD_TYPE_LINK,
  getFieldSettings,
  LINK_TYPE_ASSET,
  LINK_TYPE_ENTRY,
} from '../helper/contentful.js';
import { HookManager } from '../helper/hook-manager.js';
import type { Config, RuntimeContext, TransformContext } from '../types.js';

const cache = new Map();

export const readFixture = async (file) => {
  if (!cache.has(file)) {
    const content = await fs.readJSON(path.join(__dirname, 'fixtures', file));
    cache.set(file, content);
  }

  return cache.get(file);
};

export const readFixtureSync = (file) => {
  if (!cache.has(file)) {
    const content = fs.readJSONSync(path.join(__dirname, 'fixtures', file));
    cache.set(file, content);
  }

  return cache.get(file);
};

export const getContent = async () => {
  const assets = await readFixture('assets.json');
  const entries = await readFixture('entries.json');
  const locales = await readFixture('locales.json');
  const contentTypes = await readFixture('content_types.json');

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

  return { entries, assets, contentTypes, locales, assetLink, entryLink, entry, asset };
};

export const getConfig = (fixture: Partial<Config> = {}): Config =>
  ({
    plugins: [],
    ...fixture,
  } as Config);

export const getRuntimeContext = (fixture: Partial<RuntimeContext> = {}): RuntimeContext => {
  const assets = readFixtureSync('assets.json');
  const entries = readFixtureSync('entries.json');
  const locales = readFixtureSync('locales.json');
  const contentTypes = readFixtureSync('content_types.json');

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

  const hooks = new HookManager(result as RuntimeContext, getConfig());

  return { ...result, hooks } as RuntimeContext;
};

export const getTransformContext = (fixture: Partial<TransformContext> = {}): TransformContext =>
  ({
    assets: [],
    entries: [],
    assetMap: new Map(),
    entryMap: new Map(),
    ...fixture,
  } as TransformContext);
