import type { Category, PresetSite } from './types'
import facebook from '../assets/icons/facebook.svg'
import instagram from '../assets/icons/instagram.svg'
import reddit from '../assets/icons/reddit.svg'
import tiktok from '../assets/icons/tiktok.svg'
import x from '../assets/icons/x.svg'
import youtube from '../assets/icons/youtube.svg'

export const SOCIAL_PRESETS: PresetSite[] = [
  { id: 'social-instagram', name: 'Instagram', url: 'instagram.com', category: 'social' },
  { id: 'social-tiktok', name: 'TikTok', url: 'tiktok.com', category: 'social' },
  { id: 'social-x', name: 'X', url: 'x.com', category: 'social' },
  { id: 'social-facebook', name: 'Facebook', url: 'facebook.com', category: 'social' },
  { id: 'social-reddit', name: 'Reddit', url: 'reddit.com', category: 'social' },
]

export const SHORT_FORM_PRESETS: PresetSite[] = [
  { id: 'short-youtube-shorts', name: 'YouTube Shorts', url: 'youtube.com/shorts', category: 'shortForm' },
  { id: 'short-tiktok', name: 'TikTok', url: 'tiktok.com', category: 'shortForm' },
  { id: 'short-instagram-reels', name: 'Instagram Reels', url: 'instagram.com/reels', category: 'shortForm' },
]

export const ALL_PRESETS: PresetSite[] = [...SOCIAL_PRESETS, ...SHORT_FORM_PRESETS]

export const PRESETS_BY_CATEGORY: Record<Category, PresetSite[]> = {
  social: SOCIAL_PRESETS,
  shortForm: SHORT_FORM_PRESETS,
}

// Bundled brand icons (simple-icons, CC0), keyed by host. Shown instead of
// Chrome's favicon cache so they work for sites you've never visited.
const BUNDLED_ICONS: Record<string, string> = {
  'facebook.com': facebook,
  'instagram.com': instagram,
  'reddit.com': reddit,
  'tiktok.com': tiktok,
  'x.com': x,
  'youtube.com': youtube,
}

/** Bundled icon for a normalised URL (matched on its host), if there is one. */
export function bundledIconFor(url: string): string | undefined {
  return BUNDLED_ICONS[url.split('/')[0]]
}
