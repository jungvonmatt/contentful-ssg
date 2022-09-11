import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const esModules = ['serialize-error', 'got', '@sindresorhus/is', 'p-cancelable', '@szmarczak/http-timer', 'form-data-encoder','lowercase-keys'].join('|');

export default {
  testMatch: ['**/+(*.)+(spec|test).+(ts|js)?(x)'],
  moduleFileExtensions: ['ts', 'js', 'mjs'],
  passWithNoTests: true,
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
  },
  transformIgnorePatterns: [`/node_modules/(?!${esModules})`],
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
