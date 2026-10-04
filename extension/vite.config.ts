import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const here = path.dirname(fileURLToPath(import.meta.url))

// The Chrome extension's popup (React, sharing the web app's download components). Build with `npm run build:extension`; load
// dist-extension/ in chrome://extensions with "Load unpacked".
export default defineConfig({
  root: here,
  base: './',
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(here, '../src') } },
  build: {
    outDir: path.resolve(here, '../dist-extension'),
    emptyOutDir: true,
    modulePreload: false,
    rollupOptions: {
      input: {
        popup: path.resolve(here, 'popup.html'),
      },
      output: { entryFileNames: '[name].js', chunkFileNames: 'chunks/[name]-[hash].js', assetFileNames: 'assets/[name]-[hash][extname]' },
    },
  },
})
