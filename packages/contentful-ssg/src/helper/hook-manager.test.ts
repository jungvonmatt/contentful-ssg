import type { Config, RuntimeContext } from '../types.js';
import { getRuntimeContext, getTransformContext, getConfig } from '../__test__/mock.js';
import { HookManager } from './hook-manager';

const getInstance = (overwrite: Partial<Config> = {}, context: Partial<RuntimeContext> = {}) => {
  const config = getConfig(overwrite);
  const runtimeContext = getRuntimeContext({ config, ...context });

  return new HookManager(runtimeContext, config);
};

describe('Hook Manager', () => {
  const transformContext = getTransformContext();

  test('No Hooks & plugins', async () => {
    const hooks = getInstance();

    // We need to check the result as each hook modifies the runtime context
    // and so the second one also alters the result of the first one
    const runtimeUndefined = await hooks.before();
    expect(runtimeUndefined).toEqual(hooks.runtimeContext);
    const runtimeDefault = await hooks.before({test:true});
    expect(runtimeDefault).toEqual({...hooks.runtimeContext, test:true});

    const transformUndefined = await hooks.mapDirectory(getTransformContext());
    expect(transformUndefined).toBeUndefined();
    const transformDefault = await hooks.mapDirectory(getTransformContext(), 'defaultValue');
    expect(transformDefault).toEqual('defaultValue');
  });

  test('Runs before & after hooks in correct order', async () => {
    const hook = (value) => (context) => ({ ...context, test: [...(context.test || []), value] });

    const hooks = getInstance(
      {
        before: hook(5),
        after: hook(10),
        plugins: [
          { before: hook(1), after: hook(6) },
          { before: hook(2), after: hook(7) },
          { before: hook(3), after: hook(8) },
          { before: hook(4), after: hook(9) },
        ],
      },
      { test: [0] }
    );

    const ctxBefore = await hooks.before();
    const ctxAfter = await hooks.after();

    expect(ctxBefore.test).toEqual([0, 1, 2, 3, 4, 5]);
    expect(ctxAfter.test).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  test('Runs async before & after hooks in correct order', async () => {
    const hook = (value) => async (context) => ({
      ...context,
      test: [...(context.test || []), value],
    });

    const hooks = getInstance(
      {
        before: hook(5),
        after: hook(9),
        plugins: [
          { before: hook(1), after: hook(6) },
          { before: hook(2), after: hook(7) },
          { before: hook(3) },
          { before: hook(4), after: hook(8) },
        ],
      },
      { test: [0] }
    );

    const ctxBefore = await hooks.before();
    const ctxAfter = await hooks.after();

    expect(ctxBefore.test).toEqual([0, 1, 2, 3, 4, 5]);
    expect(ctxAfter.test).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  test('Passes transformContext.content to next transform call (default: object)', async () => {
    const asyncHook = (value) => async (context) => {
      return { ...context.content, [value]: true };
    };
    const syncHook = (value) => (context) => {
      return { ...context.content, [value]: true };
    };

    const hooks = getInstance(
      {
        transform: asyncHook('config'),
        plugins: [
          { transform: syncHook('plugin1') },
          { transform: asyncHook('plugin2') },
          { transform: syncHook('plugin3') },
          { transform: asyncHook('plugin4') },
          { transform: syncHook('plugin5') },
        ],
      },
      {}
    );

    const result = await hooks.transform(transformContext, {});

    expect(result).toEqual({
      config: true,
      plugin1: true,
      plugin2: true,
      plugin3: true,
      plugin4: true,
      plugin5: true,
    });
  });

  test('Runs hooks', async () => {
    const hooks = getInstance(
      {
        mapDirectory: (tc,rc,prev) => `wrapped-${prev}`,
        mapFilename: (tc,rc,prev) => `wrapped-${prev}`,
        mapMetaFields: (tc,rc,prev) => ({...prev, wrapped: true}),
        mapAssetLink: (tc,rc,prev) => ({...prev, wrapped: true}),
        mapEntryLink: (tc,rc,prev) => ({...prev, wrapped: true}),
        plugins: [
          { mapDirectory: (tc,rc,prev) => `${prev || ''}plugin-1-directory: ${tc.value}` },
          { mapFilename: (tc,rc,prev) => `${prev || ''}plugin-2-filename: ${tc.value}`  },
          { mapMetaFields: (tc,rc,prev) => ({...prev, mapMetaFields: `plugin-3: ${tc.value}`}) },
          { mapAssetLink: (tc,rc,prev) => ({...prev, mapAssetLink: `plugin-4: ${tc.value}`}) },
          { mapEntryLink: (tc,rc,prev) => ({...prev, mapEntryLink: `plugin-5: ${tc.value}`}) },
          { mapDirectory: (tc,rc,prev) => prev.replace(tc.value, `plugin-6-directory: ${tc.value}`)},
        ],
      },
      {}
    );

    transformContext.value = 'tc-value';

    const mapDirectory = await hooks.mapDirectory(transformContext);
    const mapFilename = await hooks.mapFilename(transformContext,'default-');
    const mapMetaFields = await hooks.mapMetaFields(transformContext, () => ({initial: true}));
    const mapAssetLink = await hooks.mapAssetLink(transformContext, {initial: true});
    const mapEntryLink = await hooks.mapEntryLink(transformContext, async () => Promise.resolve({initial: true}));

    expect(mapDirectory).toEqual('wrapped-plugin-1-directory: plugin-6-directory: tc-value');
    expect(mapFilename).toEqual('wrapped-default-plugin-2-filename: tc-value');
    expect(mapMetaFields).toEqual({ initial: true, mapMetaFields: 'plugin-3: tc-value', wrapped: true });
    expect(mapAssetLink).toEqual({ initial: true, mapAssetLink: 'plugin-4: tc-value', wrapped: true });
    expect(mapEntryLink).toEqual({ initial: true, mapEntryLink: 'plugin-5: tc-value', wrapped: true });

  });
});
