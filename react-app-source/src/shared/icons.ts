import facebook from '../assets/icons/facebook.svg'
import instagram from '../assets/icons/instagram.svg'
import reddit from '../assets/icons/reddit.svg'
import snapchat from '../assets/icons/snapchat.svg'
import threads from '../assets/icons/threads.svg'
import tiktok from '../assets/icons/tiktok.svg'
import x from '../assets/icons/x.svg'
import youtube from '../assets/icons/youtube.svg'

// Bundled brand icons (simple-icons, CC0), keyed by host. Shown instead of
// Chrome's favicon cache so they work for sites you've never visited.
const BUNDLED_ICONS: Record<string, string> = {
  'facebook.com': facebook,
  'fb.com': facebook,
  'instagram.com': instagram,
  'reddit.com': reddit,
  'redd.it': reddit,
  'snapchat.com': snapchat,
  'threads.net': threads,
  'threads.com': threads,
  'tiktok.com': tiktok,
  'x.com': x,
  'twitter.com': x,
  'youtube.com': youtube,
}

/** Bundled icon for a normalised URL (matched on its host), if there is one. */
export function bundledIconFor(url: string): string | undefined {
  return BUNDLED_ICONS[url.split('/')[0]]
}
