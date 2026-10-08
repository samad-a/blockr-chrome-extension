import type { Category, PresetSite } from './types'

// Ids are stored in users' settings (presetEnabled), so never rename or reuse one.
export const SOCIAL_PRESETS: PresetSite[] = [
  { id: 'social-instagram', name: 'Instagram', urls: ['instagram.com'], category: 'social' },
  { id: 'social-tiktok', name: 'TikTok', urls: ['tiktok.com'], category: 'social' },
  { id: 'social-x', name: 'X', urls: ['x.com', 'twitter.com'], category: 'social' },
  { id: 'social-facebook', name: 'Facebook', urls: ['facebook.com', 'fb.com'], category: 'social' },
  { id: 'social-reddit', name: 'Reddit', urls: ['reddit.com', 'redd.it'], category: 'social' },
  { id: 'social-snapchat', name: 'Snapchat', urls: ['snapchat.com'], category: 'social' },
  { id: 'social-threads', name: 'Threads', urls: ['threads.net', 'threads.com'], category: 'social' },
]

export const SHORT_FORM_PRESETS: PresetSite[] = [
  { id: 'short-youtube-shorts', name: 'YouTube Shorts', urls: ['youtube.com/shorts'], category: 'shortForm' },
  { id: 'short-tiktok', name: 'TikTok', urls: ['tiktok.com'], category: 'shortForm' },
  {
    id: 'short-instagram-reels',
    name: 'Instagram Reels',
    // A single reel's own address uses the singular, "reel".
    urls: ['instagram.com/reels', 'instagram.com/reel'],
    category: 'shortForm',
  },
  {
    id: 'short-facebook-reels',
    name: 'Facebook Reels',
    urls: ['facebook.com/reel', 'facebook.com/reels'],
    category: 'shortForm',
  },
  { id: 'short-snapchat-spotlight', name: 'Snapchat Spotlight', urls: ['snapchat.com/spotlight'], category: 'shortForm' },
]

// Only the best-known sites. Shown on the options page; the popup and store listing don't mention this category.
export const ADULT_PRESETS: PresetSite[] = [
  { id: 'adult-pornhub', name: 'Pornhub', urls: ['pornhub.com'], category: 'adult' },
  { id: 'adult-xvideos', name: 'XVideos', urls: ['xvideos.com'], category: 'adult' },
  { id: 'adult-xnxx', name: 'XNXX', urls: ['xnxx.com'], category: 'adult' },
  { id: 'adult-xhamster', name: 'xHamster', urls: ['xhamster.com'], category: 'adult' },
  { id: 'adult-redtube', name: 'RedTube', urls: ['redtube.com'], category: 'adult' },
  { id: 'adult-youporn', name: 'YouPorn', urls: ['youporn.com'], category: 'adult' },
  { id: 'adult-spankbang', name: 'SpankBang', urls: ['spankbang.com'], category: 'adult' },
  { id: 'adult-onlyfans', name: 'OnlyFans', urls: ['onlyfans.com'], category: 'adult' },
  { id: 'adult-chaturbate', name: 'Chaturbate', urls: ['chaturbate.com'], category: 'adult' },
  { id: 'adult-stripchat', name: 'Stripchat', urls: ['stripchat.com'], category: 'adult' },
]

export const ALL_PRESETS: PresetSite[] = [...SOCIAL_PRESETS, ...SHORT_FORM_PRESETS, ...ADULT_PRESETS]

export const PRESETS_BY_CATEGORY: Record<Category, PresetSite[]> = {
  social: SOCIAL_PRESETS,
  shortForm: SHORT_FORM_PRESETS,
  adult: ADULT_PRESETS,
}
