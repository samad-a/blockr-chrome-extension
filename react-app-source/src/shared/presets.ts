import type { Category, PresetSite } from './types'

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
