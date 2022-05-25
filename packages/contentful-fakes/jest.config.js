export default {
  displayName: 'contentful-fakes',
  preset: '../../jest.preset.js',
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.test.json',
    },
  },
  moduleFileExtensions: ['ts', 'js'],
};
