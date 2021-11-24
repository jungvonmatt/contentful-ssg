import { createRequire as moduleCreateRequire } from 'module';

export const createRequire = (rootDir: string = null): NodeRequire =>
  rootDir === null
    ? moduleCreateRequire(import.meta.url)
    : moduleCreateRequire(`${rootDir}/:internal:`);
