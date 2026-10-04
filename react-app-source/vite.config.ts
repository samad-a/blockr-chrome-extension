import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.config.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), crx({ manifest })],
  server: {
    // Lets the extension load scripts from the dev server during `npm run dev`
    cors: { origin: [/chrome-extension:\/\//] },
  },
})
