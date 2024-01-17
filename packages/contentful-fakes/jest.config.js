export default {
  displayName: 'contentful-fakes',
  preset: '../../jest.preset.js',
  transform: {
    '^.+\\.js$': '@swc/jest',
    '^.+\\.ts$': ['ts-jest',{
      tsconfig: '<rootDir>/tsconfig.test.json'
    }],
  },
  moduleFileExtensions: ['ts', 'js'],
};
