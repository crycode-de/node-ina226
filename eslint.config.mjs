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
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/promise-function-async': 'off',
    },
  },

  /**
   * Special rules for the examples
   */
  {
    files: [
      'examples/**/*',
    ],
    languageOptions: {
      globals: {
        console: true,
        require: true, // needed for js example
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'no-console': 'off',
      '@stylistic/operator-linebreak': 'off',
    },
  },
  {
    files: [
      'examples/**/*.js',
    ],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
);
