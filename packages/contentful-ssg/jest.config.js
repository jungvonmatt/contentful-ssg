export default {
  displayName: 'contentful-ssg',
  preset: '../../jest.preset.js',
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json',
    },
  },
  transform: {
    '^.+\\.[tj]s$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**',
    '!src/cli.ts',
    '!src/lib/config.ts',
    // skip helper/create-require.ts as istanbul coverage could not handle imo
    '!src/lib/create-require.ts',
    '!**/node_modules/**',
    '!**/__test__/**',
    '!**/dist/**',
  ],
};
