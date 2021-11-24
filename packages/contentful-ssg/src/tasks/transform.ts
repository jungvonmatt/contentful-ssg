import { mapEntry } from '../mapper/map-entry.js';
import type { Config, RuntimeContext, TransformContext } from '../types.js';

export const transform = async (
  transformContext: TransformContext,
  runtimeContext: RuntimeContext,
  config: Config
) => {
  const initialValue = await mapEntry(transformContext, runtimeContext, config);
  return runtimeContext.hooks.transform(transformContext, initialValue);
};
