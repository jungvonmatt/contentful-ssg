import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
  testMatch: ['**/+(*.)+(spec|test).+(ts|js)?(x)'],
  moduleFileExtensions: ['ts', 'js', 'mjs'],
  passWithNoTests: true,
  extensionsToTreatAsEsm: ['.ts'],
  transform: { '^.+\\.(ts|js)$': 'ts-jest' },
  testResultsProcessor: 'jest-sonar-reporter',
  preset: 'ts-jest/presets/default-esm',
  moduleDirectories: ['node_modules', `${__dirname}/packages`],
  coverageReporters: ['text', 'clover', 'json', 'lcov', 'cobertura'],

  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: '<rootDir>/tsconfig.json',
    },
  },

  moduleNameMapper: {
    // Removes .js at the end to match typescript files
    '^(\\.{1,2}/.*)\\.js$': '$1',
    // Typescript packages
    '^@jungvonmatt/(contentful-ssg|contentful-fakes|cssg-plugin-grow)/(.*)$': `${__dirname}/packages/$1/dist/$2`,
    // Javascript packages
    '^@jungvonmatt/(.*)$': `${__dirname}/packages/$1`,
  },
};
