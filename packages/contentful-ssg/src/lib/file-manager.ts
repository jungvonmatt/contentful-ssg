import type { WriteFileOptions } from 'fs-extra';
import type { Config, Ignore } from '../types';
import { dirname, resolve, relative, join } from 'path';
import ignore from 'ignore';
import { readFile, readdir, lstat } from 'fs/promises';
import { remove, outputFile } from 'fs-extra';
import { existsSync } from 'fs';

export class FileManager {
  ignoreBase: string = process.cwd();
  ignore?: Ignore;
  files = new Set<string>();
  // eslint-disable-next-line @typescript-eslint/parameter-properties
  config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  get count() {
    return [...this.ignoredFiles].length;
  }

  get ignoredFiles() {
    return [...this.files].filter(
      (file) => !this.ignore || this.ignore.ignores(relative(this.ignoreBase, file)),
    );
  }

  async initialize() {
    const { findUp } = await import('find-up');
    const { globby } = await import('globby');
    const gitignore = await findUp('.gitignore');

    if (gitignore) {
      this.ignoreBase = dirname(gitignore);

      const ignorePatterns = await readFile(gitignore);

      this.ignore = ignore().add(ignorePatterns.toString('utf8'));
    }

    const directories = [
      ...new Set([...(this.config.managedDirectories || []), this.config.directory]),
    ];

    const globPattern = directories.map((directory) =>
      resolve(this.config.rootDir || '', directory, '**/*.*'),
    );
    // Create set of existing files
    const existing = await globby(globPattern);

    this.files = new Set(existing.map((file) => resolve(file)));
  }

  async writeFile(file: string, data: string, options?: WriteFileOptions): Promise<void> {
    await outputFile(file, data, options);
    if (this.files.has(resolve(file))) {
      this.files.delete(resolve(file));
    }
  }

  async deleteFile(file: string) {
    if (this.files.has(resolve(file))) {
      this.files.delete(resolve(file));
    }

    return remove(file);
  }

  /**
   * Recursively removes empty directories from the given directory.
   *
   * If the directory itself is empty, it is also removed.
   *
   * Code taken from: https://gist.github.com/jakub-g/5903dc7e4028133704a4
   *
   * @param {string} directory Path to the directory to clean up
   */
  async removeEmptyDirectories(directory: string) {
    // Lstat does not follow symlinks (in contrast to stat)
    const fileStats = await lstat(directory);
    if (!fileStats.isDirectory()) {
      return;
    }

    let fileNames = await readdir(directory);
    if (fileNames.length > 0) {
      const recursiveRemovalPromises = fileNames.map(async (fileName) =>
        this.removeEmptyDirectories(join(directory, fileName)),
      );
      await Promise.all(recursiveRemovalPromises);

      // Re-evaluate fileNames; after deleting subdirectory
      // we may have parent directory empty now
      fileNames = await readdir(directory);
    }

    if (fileNames.length === 0 && ![this.config.directory, 'data'].includes(directory)) {
      await remove(directory);
    }
  }

  async cleanup() {
    const promises = [...this.ignoredFiles].map(async (file) => this.deleteFile(file));

    await Promise.allSettled(promises);
    await this.removeEmptyDirectories(this.config.directory);
    if (existsSync('data')) {
      await this.removeEmptyDirectories('data');
    }

    return true;
  }
}
