export type Category = 'social' | 'shortForm'

/** A site the user added by hand on the "Custom Block List" tab. */
export type CustomSite = {
  id: string
  name: string
  /** Normalised host + optional path, e.g. "tiktok.com" or "youtube.com/shorts". */
  url: string
  /** Epoch milliseconds. */
  dateAdded: number
  enabled: boolean
}

/** A built-in site. Defined in code (presets.ts); only its on/off flag is stored. */
export type PresetSite = {
  id: string
  name: string
  url: string
  category: Category
}

/** Everything persisted in chrome.storage.sync. */
export type BlockListState = {
  customSites: CustomSite[]
  /** presetId -> enabled. Missing means off. */
  presetEnabled: Record<string, boolean>
  /** Master switches, shown in the popup. A preset is blocked only if its category is on too. */
  categories: Record<Category, boolean>
}
