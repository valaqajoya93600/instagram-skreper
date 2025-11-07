'use strict';

module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'script',
  },
  extends: ['eslint:recommended'],
  ignorePatterns: ['coverage/', 'node_modules/'],
  overrides: [
    {
      files: ['tests/**/*.test.js', 'tests/integration/setup.js'],
      env: {
        jest: true,
      },
    },
  ],
};
