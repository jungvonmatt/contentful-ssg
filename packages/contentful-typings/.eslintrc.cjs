module.exports = {
  root: true,
  plugins: ['prettier'],
  extends: ['xo', 'xo-typescript/space', 'plugin:prettier/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
    extraFileExtensions: ['.cjs'],
  },
  ignorePatterns: ['**/jest.config.js', '**/*.cjs', 'src/**/*.test.ts', 'src/__test__/*'],
  env: {
    node: true,
    jest: true,
  },
};