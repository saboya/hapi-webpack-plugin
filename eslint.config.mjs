// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import parserTs from '@typescript-eslint/parser'
import stylistic from '@stylistic/eslint-plugin'
import stylisticTs from '@stylistic/eslint-plugin-ts'

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  stylistic.configs.recommended,
  {
    plugins: {
      '@stylistic/ts': stylisticTs,
    },
    languageOptions: {
      parser: parserTs,
    },
    rules: {
      "@typescript-eslint/no-require-imports": ['off'],
      "@typescript-eslint/no-unused-vars": [
        'error',
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true
        }
      ]
    }
  }
)
