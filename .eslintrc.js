module.exports = {
  root: true,
  extends: [
    'xo',
    'xo-typescript/space',
  ],
  parserOptions: {
    project: ['./tsconfig.eslint.json'],
  },
  env: {
    browser: true,
    jest: true,
  },

};
