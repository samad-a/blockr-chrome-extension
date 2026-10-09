import { defineManifest } from '@crxjs/vite-plugin'

// This replaces the old root-level manifest.json.
// CRXJS reads it, builds every file it points to, and writes the final
// manifest.json into dist/.
export default defineManifest({
  manifest_version: 3,
  name: 'Blockr - Website Blocker',
  description:
    'Block distracting websites like social media and short-form video, and stay focused. Simple, private, no account needed.',
  version: '1.3',
  // The favicon and declarativeNetRequest redirect features need a reasonably recent Chrome.
  minimum_chrome_version: '116',
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
  options_page: 'options.html',
  // "favicon" lets the options page read site icons from Chrome's local cache.
  permissions: [
    'storage',
    'favicon',
    // Blocking: redirect rules, in-page navigation checks, sweeping open tabs, timed pause.
    'declarativeNetRequest',
    'webNavigation',
    'tabs',
    'alarms',
    // Daily limits: tell whether the user is at the computer (no install warning).
    'idle',
  ],
  // Needed so redirect rules can apply to every site the user may block.
  host_permissions: ['<all_urls>'],
  // The blocked page is the redirect target, so web pages must be able to land on it.
  web_accessible_resources: [{ resources: ['blocked.html'], matches: ['<all_urls>'] }],
})
