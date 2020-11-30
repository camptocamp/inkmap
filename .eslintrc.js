module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    "no-constant-condition": ["error", { "checkLoops": false }]
  },
  extends: ['eslint:recommended', 'prettier'],
  globals: { WorkerGlobalScope: true },
};
