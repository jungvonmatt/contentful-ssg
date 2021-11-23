import type {WriteFileOptions} from 'fs-extra';
import type {Config, Ignore} from '../types';
import {dirname, resolve, relative} from 'path';
import ignore from 'ignore';
import {readFile, readdir} from 'fs/promises';
import {remove, outputFile} from 'fs-extra';

export class FileManager {
  ignoreBase: string = process.cwd();
  ignore?: Ignore;
  files: Set<string> = new Set();
  config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  get count() {
    return [...this.ignoredFiles].length;
  }

  get ignoredFiles() {
    return [...this.files].filter(file => !this.ignore || this.ignore.ignores(relative(this.ignoreBase, file)));
  }

  async initialize() {
    const {findUp} = await import('find-up');
    const {globby} = await import('globby');
    const gitignore = await findUp('.gitignore');

    if (gitignore) {
      this.ignoreBase = dirname(gitignore);

      const ignorePatterns = await readFile(gitignore);

      this.ignore = ignore().add(ignorePatterns.toString('utf8'));
    }

    // Create set of existing files
    const existing = await globby(`${this.config.directory}/**/*.*`);

    this.files = new Set(existing.map(file => resolve(file)));
  }

  async writeFile(file: string, data: any, options?: WriteFileOptions | BufferEncoding | string): Promise<void> {
    await outputFile(file, data, options);
    if (this.files.has(resolve(file))) {
      this.files.delete(resolve(file));
    }
  }

  async deleteFile(file: string) {
    await remove(file);

    if (this.files.has(resolve(file))) {
      this.files.delete(resolve(file));
    }

    const dir = dirname(file);
    try {
      const files = await readdir(dirname(file));
      if ((files || []).length === 0) {
        await remove(dir);
      }
    } catch {}
  }

  async cleanup() {
    const promises = [...this.ignoredFiles].map(async file => this.deleteFile(file));

    return Promise.allSettled(promises);
  }
}
