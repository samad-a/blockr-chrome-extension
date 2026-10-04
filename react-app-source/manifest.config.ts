import { defineManifest } from '@crxjs/vite-plugin'

// This replaces the old root-level manifest.json.
// CRXJS reads it, builds every file it points to, and writes the final
// manifest.json into dist/.
export default defineManifest({
  manifest_version: 3,
  name: 'Blockr - Website Blocker',
  description:
    'Extension that allows the user to block websites, to stay productive and focused.',
  version: '1.0',
  icons: {
    16: 'public/icons/icon-16.png',
    32: 'public/icons/icon-32.png',
    48: 'public/icons/icon-48.png',
    128: 'public/icons/icon-128.png',
  },
  action: {
    default_popup: 'index.html',
  },
  background: {
    service_worker: 'src/background.ts',
    type: 'module',
  },
  permissions: ['storage'],
})
