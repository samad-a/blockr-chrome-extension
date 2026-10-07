import { describe, expect, it } from 'vitest'
import { trackedSiteUrls } from './tracking'
import type { TabInfo } from './tracking'

const sites = [
  { name: 'YouTube', url: 'youtube.com', limitMinutes: 20 },
  { name: 'Shorts', url: 'youtube.com/shorts', limitMinutes: 10 },
  { name: 'X', url: 'x.com', limitMinutes: 5 },
]

const tab = (url: string, overrides: Partial<TabInfo> = {}): TabInfo => ({
  url,
  active: false,
  windowId: 1,
  audible: false,
  ...overrides,
})

describe('trackedSiteUrls', () => {
  it('counts the active tab of the focused window while the user is active', () => {
    const tabs = [tab('https://x.com/home', { active: true })]
    expect(trackedSiteUrls(tabs, 1, true, sites)).toEqual(['x.com'])
  })

  it('ignores a background tab that is silent', () => {
    expect(trackedSiteUrls([tab('https://x.com/home')], 1, true, sites)).toEqual([])
  })

  it('counts a background tab that is playing sound', () => {
    const tabs = [tab('https://www.youtube.com/watch?v=1', { audible: true })]
    expect(trackedSiteUrls(tabs, 1, true, sites)).toEqual(['youtube.com'])
  })

  it('counts audio even when no window is focused or the user is idle', () => {
    const tabs = [tab('https://www.youtube.com/watch?v=1', { audible: true })]
    expect(trackedSiteUrls(tabs, null, false, sites)).toEqual(['youtube.com'])
  })

  it('does not count the active tab when the browser is not focused or the user is idle', () => {
    const tabs = [tab('https://x.com/home', { active: true })]
    expect(trackedSiteUrls(tabs, null, true, sites)).toEqual([])
    expect(trackedSiteUrls(tabs, 1, false, sites)).toEqual([])
  })

  it('ignores the active tab of a window that is not the focused one', () => {
    const tabs = [tab('https://x.com/home', { active: true, windowId: 2 })]
    expect(trackedSiteUrls(tabs, 1, true, sites)).toEqual([])
  })

  it('credits each site once however many tabs it has', () => {
    const tabs = [
      tab('https://x.com/a', { audible: true }),
      tab('https://x.com/b', { active: true }),
      tab('https://twitter-clone.example/', { active: true }),
    ]
    expect(trackedSiteUrls(tabs, 1, true, sites)).toEqual(['x.com'])
  })

  it('credits every overlapping limit that matches the page', () => {
    const tabs = [tab('https://www.youtube.com/shorts/abc', { active: true })]
    expect(trackedSiteUrls(tabs, 1, true, sites).sort()).toEqual(['youtube.com', 'youtube.com/shorts'])
  })

  it('skips tabs without a URL and non-web pages', () => {
    const tabs = [{ active: true, windowId: 1 }, tab('chrome://extensions', { active: true })]
    expect(trackedSiteUrls(tabs, 1, true, sites)).toEqual([])
  })
})
