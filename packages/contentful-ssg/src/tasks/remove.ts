import type { TransformContext, RuntimeContext, Config } from '../types';
import { getFilepath } from './write.js';

export const remove = async (
  transformContext: TransformContext,
  runtimeContext: RuntimeContext,
  config: Config
) => {
  const filepath = await getFilepath(transformContext, runtimeContext, config);

  await runtimeContext.fileManager.deleteFile(filepath);
};
