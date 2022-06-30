export default {
  displayName: 'contentful-ssg',
  preset: '../../jest.preset.js',
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json',
    },
  },

  transform: {
    '^.+\\.js$': '@swc/jest',
    '^.+\\.ts$': 'ts-jest',
  },

  moduleFileExtensions: ['ts', 'js', 'html'],
};
