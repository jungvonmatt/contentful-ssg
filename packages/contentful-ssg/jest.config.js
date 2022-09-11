export default {
  displayName: 'contentful-ssg',
  preset: '../../jest.preset.js',
  transform: {
    '^.+\\.js$': '@swc/jest',
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
  },

  moduleFileExtensions: ['ts', 'js', 'html'],
};
