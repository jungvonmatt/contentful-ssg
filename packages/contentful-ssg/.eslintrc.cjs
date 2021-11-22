module.exports = {
  root: true,
  extends: ['xo', 'xo-typescript/space'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
    extraFileExtensions: [".cjs"]
  },
  ignorePatterns: ['**/*.cjs','src/**/*.test.ts', 'src/__test__/*'],
  env: {
    node: true,
    jest: true,
  }
};
