import tseslint from 'typescript-eslint';
import crycode from '@crycode/eslint-config';

export default tseslint.config(
  ...crycode.configs.ts,
  ...crycode.configs.stylistic,

  {
    ignores: [
      'dist/',
    ],
  },

  {
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: [
          './tsconfig.check.json',
        ],
      },
    },

    rules: {
      '@typescript-eslint/promise-function-async': 'off',
    },
  },
);
