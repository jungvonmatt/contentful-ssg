module.exports = {
  root: true,
  extends: ['xo', 'xo-typescript/space'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
    extraFileExtensions: [".cjs"]
  },
  ignorePatterns: ['**/jest.config.js', '**/*.cjs','src/**/*.test.ts', 'src/__test__/*',"src/**/*.test.ts"],
  env: {
    node: true,
    jest: true,
  },
};
