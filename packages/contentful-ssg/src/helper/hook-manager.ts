import type {
  KeyValueMap,
  Config,
  RuntimeHook,
  Hooks,
  RuntimeContext,
  TransformContext,
  TransformHook,
} from '../types.js';
import {reduceAsync} from './array.js';

const resolveValue = (something: any, ...args: any[]): unknown =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  (typeof something === 'function' ? something(...args) : something) as unknown;

const hookUpRuntime = (
  name: keyof Pick<Hooks, 'before' | 'after'>,
  options: Config,
  defaultValue?: any,
): RuntimeHook => {
  const {[name]: configHook} = options;

  const hooks = (options.plugins || [])
    .filter(plugin => Boolean(plugin[name]))
    .map(plugin => plugin[name]);

  return async (runtimeContext: RuntimeContext): Promise<Partial<RuntimeContext>> => {
    if (hooks.length === 0 && !defaultValue) {
      return;
    }

    const initialValue = (await resolveValue(
      defaultValue,
      runtimeContext,
    )) as Partial<RuntimeContext>;

    const value = (await reduceAsync(
      hooks || [],
      async (prev: Partial<RuntimeContext>, hook: RuntimeHook) =>
        hook({...runtimeContext, ...(prev || {})}),
      initialValue || {},
    )) as RuntimeContext;

    if (typeof configHook === 'function') {
      return configHook({...runtimeContext, ...(value || {})});
    }

    return value;
  };
};

const hookUpTransform = <Type = unknown>(
  name: keyof Omit<Hooks, 'before' | 'after'>,
  options: Config,
  defaultValue?: any,
): TransformHook<Type> => {
  const {[name]: configHook} = options;

  const hooks = (options.plugins || [])
    .filter(plugin => Boolean(plugin[name]))
    .map(plugin => plugin[name]) as Array<TransformHook<Type>>;

  return async (
    transformContext: TransformContext,
    runtimeContext: RuntimeContext,
  ): Promise<Type> => {
    if (hooks.length === 0 && !defaultValue) {
      return;
    }

    const initialValue = (await resolveValue(
      defaultValue,
      transformContext,
      runtimeContext,
    )) as Type;

    const value = await reduceAsync(
      hooks || [],
      async (prev: Type, hook: TransformHook<Type>) => {
        if (name === 'transform') {
          transformContext.content = prev;
        }

        return hook(transformContext, runtimeContext, prev);
      },
      initialValue,
    );

    if (name === 'transform') {
      transformContext.content = value;
    }

    if (typeof configHook === 'function') {
      return (configHook as TransformHook<Type>)(transformContext, runtimeContext, value);
    }

    return value;
  };
};

export class HookManager {
  runtimeContext: RuntimeContext;
  config: Config;
  constructor(runtimeContext: RuntimeContext, config: Config) {
    this.runtimeContext = runtimeContext;
    this.config = config;
  }

  has(key: keyof Hooks): boolean {
    const {[key]: hook} = this.config;
    const pluginHooks = (this.config.plugins || []).some(plugin => Boolean(plugin[key]));

    return Boolean(hook) || pluginHooks;
  }

  async before(defauleValue?: KeyValueMap) {
    const method = hookUpRuntime('before', this.config, defauleValue);
    const result = await method(this.runtimeContext);
    this.runtimeContext = {...this.runtimeContext, ...(result || {})};
    return this.runtimeContext;
  }

  async after(defauleValue?: KeyValueMap) {
    const method = hookUpRuntime('after', this.config, defauleValue);
    const result = await method(this.runtimeContext);
    this.runtimeContext = {...this.runtimeContext, ...(result || {})};
    return this.runtimeContext;
  }

  async transform(transformContext: TransformContext, defauleValue?: unknown) {
    const method = hookUpTransform<KeyValueMap>('transform', this.config, defauleValue);
    return method(transformContext, this.runtimeContext);
  }

  async mapMetaFields(transformContext: TransformContext, defauleValue?: unknown) {
    const method = hookUpTransform<KeyValueMap>('mapMetaFields', this.config, defauleValue);
    return method(transformContext, this.runtimeContext);
  }

  async mapDirectory(transformContext: TransformContext, defauleValue?: unknown) {
    const method = hookUpTransform<string>('mapDirectory', this.config, defauleValue);
    return method(transformContext, this.runtimeContext);
  }

  async mapFilename(transformContext: TransformContext, defauleValue?: unknown) {
    const method = hookUpTransform<string>('mapFilename', this.config, defauleValue);
    return method(transformContext, this.runtimeContext);
  }

  async mapAssetLink(transformContext: TransformContext, defauleValue?: unknown) {
    const method = hookUpTransform<KeyValueMap>('mapAssetLink', this.config, defauleValue);
    return method(transformContext, this.runtimeContext);
  }

  async mapEntryLink(transformContext: TransformContext, defauleValue?: unknown) {
    const method = hookUpTransform<KeyValueMap>('mapEntryLink', this.config, defauleValue);
    return method(transformContext, this.runtimeContext);
  }
}
