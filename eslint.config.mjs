import js from '@eslint/js';
import next from '@next/eslint-plugin-next';
import ts from 'typescript-eslint';

export default ts.config(
  { ignores: ['.next/**', 'node_modules/**', 'out/**', 'next-env.d.ts'] },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    plugins: { '@next/next': next },
    rules: {
      ...next.configs.recommended.rules,
      ...next.configs['core-web-vitals'].rules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: { globals: { process: 'readonly', console: 'readonly' } },
  }
);
