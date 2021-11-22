export default {
  collectCoverage: false,
  // skip helper/create-require.ts as istanbul coverage could not handle imo
  collectCoverageFrom: ['packages/contentful-ssg/**','!packages/contentful-ssg/src/lib/create-require.ts','!**/node_modules/**', '!**/__test__/**', '!**/dist/**'],
  roots: ['packages/'],
  testPathIgnorePatterns: ['/dist/'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  transformIgnorePatterns: ['node_modules/(?!(@jungvonmatt/contentful-ssg))'],
  testRegex: '/src/.*\\.test.(js|ts)$',

  preset: 'ts-jest/presets/default-esm',
  moduleFileExtensions: ['ts', 'js'],

  moduleDirectories: ['node_modules'],

  extensionsToTreatAsEsm: ['.ts'],

  globals: {
    'ts-jest': {
      useESM: true,
    },
  },

  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    "^@jungvonmatt\/(.*)$": "<rootDir>/packages/$1"
  },
};
