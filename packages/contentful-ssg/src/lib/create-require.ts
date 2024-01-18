import { dirname } from 'path';
import { transform, transformSync, type Options } from '@swc/core';
import { addHook } from 'pirates';
import { createRequire as moduleCreateRequire } from 'module';

const defaultExtensions = ['.js', '.jsx', '.es6', '.es', '.mjs', '.ts', '.tsx'];

const getTsOptions = (filename: string): Options => ({
  module: {
    type: 'commonjs',
  },
  cwd: dirname(filename),
  jsc: {
    parser: {
      syntax: 'typescript',
      dynamicImport: true,
    },
  },
});

export function compile(sourcecode: string, filename: string, async?: false): string;

export function compile(
  sourcecode: string,
  filename: string,
  async?: boolean,
): string | Promise<string>;

export function compile(sourcecode: string, filename: string, async = false) {
  if (filename.endsWith('.d.ts')) {
    return '';
  }

  if (async) {
    return transform(sourcecode, getTsOptions(filename)).then(({ code }) => {
      return code;
    });
  }

  const { code } = transformSync(sourcecode, getTsOptions(filename));

  return code;
}

export function registerRequireHook(hookOpts = {}) {
  return addHook((code, filename) => compile(code, filename), {
    exts: defaultExtensions,
    ignoreNodeModules: true,
    ...hookOpts,
  });
}

export const createRequire = (rootDir: string = null): NodeRequire => {
  registerRequireHook();

  return rootDir === null
    ? moduleCreateRequire(import.meta.url)
    : moduleCreateRequire(`${rootDir}/:internal:`);
};
