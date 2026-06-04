import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { svelteTesting } from '@testing-library/svelte/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte(), svelteTesting()],
  resolve: {
    alias: {
      '@features': path.resolve(__dirname, './src/features'),
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
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['@supabase/supabase-js'],
          'utils': ['papaparse', 'xlsx']
        }
      }
    }
  }
})
