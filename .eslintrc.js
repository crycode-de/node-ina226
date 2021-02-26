module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    project: ['./tsconfig.json'],
  },
  extends: [
    'plugin:@typescript-eslint/recommended',
  ],
  plugins: [],
  rules: {
    'indent': 'off',
    '@typescript-eslint/indent': [
      'error',
      2,
      {
        'MemberExpression': 0,
        'SwitchCase': 1,
      }
    ],
    'quotes': [
      'error',
      'single',
      {
        'avoidEscape': true,
        'allowTemplateLiterals': true
      }
    ],
    '@typescript-eslint/no-parameter-properties': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-use-before-define': [
      'error',
      {
        functions: false,
        typedefs: false,
        classes: false,
      },
    ],
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        ignoreRestSiblings: true,
        argsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/explicit-function-return-type': [
      'warn',
      {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
      },
    ],
    '@typescript-eslint/no-inferrable-types': 'off',
    'no-var': 'error',
    'prefer-const': 'error',
    'no-trailing-spaces': 'warn',
  }
};
