module.exports = {
  env: {
    node: true,
    commonjs: true,
    es2021: true,
    jest: true,
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 2022, // Updated to support class fields
  },
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'no-unused-vars': ['error', { argsIgnorePattern: 'next|req|res|err' }],
    'no-duplicate-imports': 'error',
    'no-constant-condition': 'error',
    'no-unreachable': 'error',
    'curly': ['error', 'multi-line'],
    'eqeqeq': ['error', 'always'],
    'semi': ['error', 'always'],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'arrow-body-style': ['error', 'as-needed'],
  },
};
