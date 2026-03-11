import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      '@features': path.resolve(__dirname, './src/features'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@data': path.resolve(__dirname, './src/data'),
      '@types': path.resolve(__dirname, './src/types'),
    },
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
