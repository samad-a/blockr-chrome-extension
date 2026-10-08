export type Category = 'social' | 'shortForm' | 'adult'

/** A site the user added by hand on the "Custom Block List" tab. */
export type CustomSite = {
  id: string
  name: string
  /** Normalised host + optional path, e.g. "tiktok.com" or "youtube.com/shorts". */
  url: string
  /** Epoch milliseconds. */
  dateAdded: number
  enabled: boolean
  /** Minutes allowed per day before the site is blocked until midnight. Missing = blocked outright. */
  dailyLimit?: number
}

/** A built-in site. Defined in code (presets.ts); only its on/off flag is stored. */
export type PresetSite = {
  id: string
  name: string
  /** Every address the site is known by, e.g. x.com and twitter.com. */
  urls: string[]
  category: Category
}

/** Everything persisted in chrome.storage.sync. */
export type BlockListState = {
  customSites: CustomSite[]
  /** presetId -> enabled. Missing means on. */
  presetEnabled: Record<string, boolean>
  /** Master switches, shown in the popup. A preset is blocked only if its category is on too. */
  categories: Record<Category, boolean>
}
