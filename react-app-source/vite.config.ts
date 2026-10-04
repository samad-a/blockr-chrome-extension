import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.config.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), crx({ manifest })],
  build: {
    // Extension pages load from disk, so preload hints add nothing, and Chrome
    // warns about them ("cross-world extension resource mismatch").
    modulePreload: false,
  },
  server: {
    // Lets the extension load scripts from the dev server during `npm run dev`
    cors: { origin: [/chrome-extension:\/\//] },
  },
})
