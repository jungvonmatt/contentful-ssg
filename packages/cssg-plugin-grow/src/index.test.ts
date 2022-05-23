import plugin, { TypeConfigEntry } from './index.js';

import {
  getContent,
  getConfig,
  getTransformContext,
  getRuntimeContext,
} from '@jungvonmatt/contentful-ssg/__test__/mock';
import { HookManager } from '@jungvonmatt/contentful-ssg/lib/hook-manager';
import { Hooks, Config, RuntimeContext } from '@jungvonmatt/contentful-ssg';

const directory = process.cwd();

const getPluginSource = async (
  typeConfig: Record<string, TypeConfigEntry> = {}
): Promise<Hooks> => {
  if (typeof plugin === 'function') {
    return plugin({ typeConfig });
  }

  return plugin;
};

describe('Grow Plugin', () => {
  const runtimeContext = getRuntimeContext();
  const config = getConfig({
    directory,
  });
  const getHookedRuntime = (configMock: Partial<Config> = {}): RuntimeContext => ({
    ...runtimeContext,
    hooks: new HookManager(runtimeContext, { ...config, ...configMock }),
  });

  test('mapGrowLink (doc)', async () => {
    const { mapEntryLink } = await getPluginSource({ test: { view: '', path: '' } });
    const { entry } = await getContent();
    const entryMap = new Map([[entry.sys.id, entry]]);
    const value = await mapEntryLink(
      getTransformContext({
        entry,
        entryMap,
        contentTypeId: 'test',
      }),
      getHookedRuntime({
        mapDirectory: () => '',
      })
    );

    expect(value).toEqual(`!g.doc /test/${entry.sys.id}.yaml`);
  });

  test('mapGrowLink (yaml)', async () => {
    const { mapEntryLink } = await getPluginSource({});
    const { entry } = await getContent();
    const entryMap = new Map([[entry.sys.id, entry]]);
    const value = await mapEntryLink(
      getTransformContext({
        entry,
        entryMap,
        contentTypeId: 'test',
      }),
      getHookedRuntime({
        mapDirectory: () => '',
      })
    );

    expect(value).toEqual(`!g.yaml /test/${entry.sys.id}.yaml`);
  });

  test('mapGrowLink (invalid)', async () => {
    const { mapEntryLink } = await getPluginSource({});
    const { entry } = await getContent();
    const entryMap = new Map();
    const value = await mapEntryLink(
      getTransformContext({
        entry,
        entryMap,
        contentTypeId: 'test',
      }),
      getHookedRuntime({
        mapDirectory: () => '',
      })
    );
    expect(value).toBe(undefined);
  });
});
