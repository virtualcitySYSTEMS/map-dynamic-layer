import { configs } from '@vcsuite/eslint-config';

export default [
  ...configs.vueTs,
  {
    rules: {
      'import/no-cycle': 'off',
    },
  },
  {
    ignores: ['node_modules/', 'dist/'],
  },
];
