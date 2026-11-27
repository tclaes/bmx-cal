import sheriff from '@softarc/eslint-plugin-sheriff';
import svelteParser from 'svelte-eslint-parser';
import tseslint from 'typescript-eslint';
import { createJiti } from 'jiti';
import { createSvelteBoundariesRule } from './eslint-rules/svelte-boundaries.js';

const { sheriffConfig } = await createJiti(import.meta.url).import('./sheriff.config.ts');
const local = { rules: { 'svelte-boundaries': createSvelteBoundariesRule(sheriffConfig) } };

// ESLint only enforces the Sheriff module boundaries (same rules as `sheriff verify`).
// The CLI (`npm run sheriff`) does not read .svelte files; this config does.
// Sheriff cannot resolve imports OF .svelte files (skipped in sheriff.config.ts); the local
// `svelte-boundaries` rule applies the same depRules to those imports.
export default [
  { ignores: ['dist/**', 'node_modules/**', 'supabase/**', 'public/**', 'src/tests/**'] },
  {
    files: ['**/*.ts', '**/*.js'],
    ignores: ['sheriff.config.ts'],
    languageOptions: { parser: tseslint.parser, sourceType: 'module' },
    plugins: { '@softarc/sheriff': { rules: sheriff.rules }, local },
    rules: {
      '@softarc/sheriff/dependency-rule': 'error',
      '@softarc/sheriff/encapsulation': 'error',
      'local/svelte-boundaries': 'error',
    },
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: { parser: tseslint.parser, sourceType: 'module' },
    },
    plugins: { '@softarc/sheriff': { rules: sheriff.rules }, local },
    rules: {
      '@softarc/sheriff/dependency-rule': 'error',
      '@softarc/sheriff/encapsulation': 'error',
      'local/svelte-boundaries': 'error',
    },
  },
];
