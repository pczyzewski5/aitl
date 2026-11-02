import js from '@eslint/js';
import tseslint from 'typescript-eslint';

const restrict = (name, patterns) => ({
  'no-restricted-imports': ['error', { patterns: patterns.map((group) => ({ group, message: `${name} must not import ${group.join(', ')}` })) }],
});

export default tseslint.config(
  { ignores: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/coverage/**', '**/next-env.d.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': 'error',
      'no-empty': ['error', { allowEmptyCatch: false }],
    },
  },
  {
    files: ['packages/core/src/**/*.{ts,tsx}'],
    rules: restrict('core', [['@aitl/*'], ['next', 'next/*'], ['react', 'react-dom', 'react/*'], ['@mikro-orm/*']]),
  },
  {
    files: ['packages/db/src/**/*.{ts,tsx}'],
    rules: restrict('db', [['@aitl/app', '@aitl/ui'], ['next', 'next/*'], ['react', 'react-dom', 'react/*']]),
  },
  {
    files: ['packages/ui/src/**/*.{ts,tsx}'],
    rules: restrict('ui', [['@aitl/*'], ['@mikro-orm/*']]),
  },
  {
    files: ['packages/app/src/**/*.{ts,tsx}'],
    rules: restrict('app', [['@mikro-orm/*']]),
  },
);
