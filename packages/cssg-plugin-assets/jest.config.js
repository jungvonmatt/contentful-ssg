export default {
  displayName: 'cssg-plugin-assets',
  preset: '../../jest.preset.js',
  transform: {
    '^.+\\.js$': '@swc/jest',
    '^.+\\.ts$': ['ts-jest',{
      tsconfig: '<rootDir>/tsconfig.test.json'
    }],
  },
  moduleFileExtensions: ['ts', 'js'],
};
