import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const here = path.dirname(fileURLToPath(import.meta.url))

// The Chrome extension: the popup (React, sharing the web app's download components), the page script
// for music.youtube.com and the background worker. Build with `npm run build:extension`; load
// dist-extension/ in chrome://extensions with "Load unpacked".
export default defineConfig({
  root: here,
  base: './',
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(here, '../src') } },
  build: {
    outDir: path.resolve(here, '../dist-extension'),
    emptyOutDir: true,
    // The page script must be one plain file (Chrome does not load it as a module), so nothing may be
    // split out of it: it imports only links.ts, which nothing else imports.
    modulePreload: false,
    rollupOptions: {
      input: {
        popup: path.resolve(here, 'popup.html'),
        content: path.resolve(here, 'src/content.ts'),
        background: path.resolve(here, 'src/background.ts'),
      },
      output: { entryFileNames: '[name].js', chunkFileNames: 'chunks/[name]-[hash].js', assetFileNames: 'assets/[name]-[hash][extname]' },
    },
  },
})
