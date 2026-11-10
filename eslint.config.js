import sheriff from '@softarc/eslint-plugin-sheriff';
import svelteParser from 'svelte-eslint-parser';
import tseslint from 'typescript-eslint';

// ESLint only enforces the Sheriff module boundaries (same rules as `sheriff verify`).
// The CLI (`npm run sheriff`) does not read .svelte files; this config does.
// Note: imports OF .svelte files are not resolvable by Sheriff and are skipped (see sheriff.config.ts).
export default [
  { ignores: ['dist/**', 'node_modules/**', 'supabase/**', 'public/**', 'src/tests/**'] },
  {
    files: ['**/*.ts', '**/*.js'],
    ignores: ['sheriff.config.ts'],
    languageOptions: { parser: tseslint.parser, sourceType: 'module' },
    plugins: { '@softarc/sheriff': { rules: sheriff.rules } },
    rules: {
      '@softarc/sheriff/dependency-rule': 'error',
      '@softarc/sheriff/encapsulation': 'error',
    },
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: { parser: tseslint.parser, sourceType: 'module' },
    },
    plugins: { '@softarc/sheriff': { rules: sheriff.rules } },
    rules: {
      '@softarc/sheriff/dependency-rule': 'error',
      '@softarc/sheriff/encapsulation': 'error',
    },
  },
];
