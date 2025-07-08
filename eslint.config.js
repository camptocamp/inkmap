import js from '@eslint/js';
import globals from 'globals';
import { defineConfig } from 'eslint/config';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import { FlatCompat } from '@eslint/eslintrc';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default defineConfig([
  {
    files: ['**/*.js'],
    plugins: { js },
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.serviceworker,
      },
    },
  },
  eslintPluginPrettierRecommended,
  ...compat.plugins('require-extensions'),
  ...compat.extends('plugin:require-extensions/recommended'),
]);
