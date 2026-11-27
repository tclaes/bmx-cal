import { defineConfig } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'path'
import fs from 'fs'
import type { Plugin } from 'vite'

const releaseFile = path.resolve(__dirname, './src/config/release.json')

function readRelease(): { version: string } {
  return JSON.parse(fs.readFileSync(releaseFile, 'utf-8'))
}

function manifestSource(): string {
  return JSON.stringify({ ...readRelease(), builtAt: new Date().toISOString() }, null, 2)
}

/**
 * Publishes the release definition as /version.json and stamps the version
 * into the service worker so every release ships a byte-different sw.js.
 */
function releaseManifest(): Plugin {
  let outDir = 'dist'
  return {
    name: 'release-manifest',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
    },
    configureServer(server) {
      server.middlewares.use('/version.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Cache-Control', 'no-cache')
        res.end(manifestSource())
      })
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: manifestSource() })
    },
    closeBundle() {
      const swPath = path.join(outDir, 'sw.js')
      // Without a stamped sw.js every release would share one cache, so fail the build instead.
      if (!fs.existsSync(swPath)) throw new Error(`release-manifest: ${swPath} not found`)
      const sw = fs.readFileSync(swPath, 'utf-8')
      if (!sw.includes('__APP_VERSION__')) {
        throw new Error('release-manifest: __APP_VERSION__ placeholder missing in sw.js')
      }
      fs.writeFileSync(swPath, sw.split('__APP_VERSION__').join(readRelease().version))
    },
  }
}

const GA_BLOCK = /[ \t]*<!-- ga:start[\s\S]*?<!-- ga:end -->\n?/

/**
 * Fills the Google Analytics tag in index.html from VITE_GA_MEASUREMENT_ID,
 * or removes it when the variable is empty (local dev, deploy previews), so
 * those builds never load gtag.js or send hits.
 */
function analyticsTag(): Plugin {
  let measurementId = ''
  return {
    name: 'analytics-tag',
    configResolved(config) {
      measurementId = String(config.env.VITE_GA_MEASUREMENT_ID ?? '')
      // analytics.ts reads the same raw value at runtime, so fail instead of trimming here.
      if (measurementId !== measurementId.trim()) {
        throw new Error('analytics-tag: VITE_GA_MEASUREMENT_ID has leading or trailing whitespace')
      }
    },
    transformIndexHtml(html) {
      if (!GA_BLOCK.test(html)) throw new Error('analytics-tag: ga:start/ga:end block missing in index.html')
      if (!measurementId) return html.replace(GA_BLOCK, '')
      return html.split('__GA_MEASUREMENT_ID__').join(measurementId)
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte(), releaseManifest(), analyticsTag()],
  resolve: {
    // Svelte resolves to its SSR build under vitest unless the browser condition is set;
    // without it onMount never runs in component tests.
    conditions: process.env.VITEST ? ['browser'] : [],
    alias: {
      '@features': path.resolve(__dirname, './src/features'),
      '@ui': path.resolve(__dirname, './src/libs/ui'),
      '@core': path.resolve(__dirname, './src/libs/core'),
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
