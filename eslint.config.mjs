import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default [
  { ignores: ['.nx', '**/node_modules', '**/dist', 'static', 'package-lock.json', 'docs', '**/.vitepress/cache'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    files: ['**/*.cjs', '**/*.config.js', '.*rc.js'],
    languageOptions: {
      globals: { module: 'readonly', require: 'readonly', __dirname: 'readonly' },
    },
  },
];
