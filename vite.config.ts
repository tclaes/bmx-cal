import { defineConfig } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      '@features': path.resolve(__dirname, './src/features'),
      '@ui': path.resolve(__dirname, './src/lib/ui'),
      '@core': path.resolve(__dirname, './src/lib/core'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@data': path.resolve(__dirname, './src/data'),
      '@types': path.resolve(__dirname, './src/types'),
      '@config': path.resolve(__dirname, './src/config'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/tests/**/*.test.ts'],
    // Let tests import Supabase Edge Functions, which use Deno-style specifiers
    alias: [
      { find: /^(npm|jsr):@supabase\/supabase-js@2$/, replacement: '@supabase/supabase-js' },
      {
        find: /^jsr:@supabase\/functions-js\/edge-runtime\.d\.ts$/,
        replacement: path.resolve(__dirname, './src/tests/stubs/empty.ts'),
      },
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('@supabase/supabase-js')) return 'vendor';
          if (id.includes('papaparse') || id.includes('xlsx')) return 'utils';
          return undefined;
        }
      }
    }
  }
})
