import { configs } from '@vcsuite/eslint-config';
import globals from 'globals';

export default [
  ...configs.vueTs,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      'n/no-unsupported-features/node-builtins': 'off',
      'import/no-cycle': 'off',
    },
  },
  {
    ignores: ['node_modules/', 'dist/'],
  },
];
