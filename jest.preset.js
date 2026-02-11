import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
  testMatch: ['**/+(*.)+(spec|test).+(ts|js)?(x)'],
  moduleFileExtensions: ['ts', 'js', 'mjs'],
  passWithNoTests: true,
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', {
      useESM: true,
      tsconfig: '<rootDir>/tsconfig.json',
    }]
  },
  transformIgnorePatterns: ['node_modules/(?!(\\.pnpm)|(serialize-error)|(exit-hook)|(chalk)|(find-cache-dir)|(pkg-dir)|(find-up)|(locate-path)|(p-locate)|(p-limit)|(yocto-queue)|(path-exists)|(change-case))'],
  preset: 'ts-jest/presets/js-with-ts-esm',
  moduleDirectories: ['node_modules', `${__dirname}/packages`],
  coverageReporters: ['text', 'clover', 'json', 'lcov'],
  coveragePathIgnorePatterns: ['/node_modules/', '__test__'],


  moduleNameMapper: {
    // Removes .js at the end to match typescript files
    '^(\\.{1,2}/.*)\\.js$': '$1',
    // Typescript packages
    '^@jungvonmatt/(contentful-ssg|contentful-fakes|cssg-plugin-grow|cssg-plugin-assets)/(.*)$': `${__dirname}/packages/$1/dist/$2`,
    // Javascript packages
    '^@jungvonmatt/(.*)$': `${__dirname}/packages/$1`,
  },
};
