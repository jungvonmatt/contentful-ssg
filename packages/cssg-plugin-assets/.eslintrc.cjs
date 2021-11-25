module.exports = {
  root: true,
  plugins: ['prettier'],
  extends: ["xo-space", 'plugin:prettier/recommended'],
  ignorePatterns: ['**/*.cjs', 'src/**/*.test.js', 'src/__test__/*'],
  env: {
    node: true,
    jest: true,
  }
};
