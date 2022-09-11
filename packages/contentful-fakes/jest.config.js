export default {
  displayName: 'contentful-fakes',
  preset: '../../jest.preset.js',
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: '<rootDir>/tsconfig.test.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js'],
};
