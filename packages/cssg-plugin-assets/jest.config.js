export default {
  displayName: 'cssg-plugin-assets',
  preset: '../../jest.preset.js',
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.test.json',
    },
  },
  moduleFileExtensions: ['ts', 'js'],
};
