# Blockr Privacy Policy

_Last updated: 10 October 2026_

Blockr is a Chrome extension that blocks websites you choose, to help you stay focused.
**Blockr does not collect, transmit, or share any personal data.** It has no servers, no
analytics, and no advertising.

## What Blockr stores

Everything Blockr stores stays inside your browser, using Chrome's extension storage:

| Data | Where | Why |
|---|---|---|
| The sites you add to your block list (name, URL, date added, on/off) | `chrome.storage.sync` | So your list persists. Chrome may sync it across your own devices through your Google account; Blockr itself never sees or sends it. |
| Which preset sites and categories (social media, short-form content) are switched on | `chrome.storage.sync` | So your choices persist. |
| Your colour theme choice (system, light or dark) | `chrome.storage.sync` | So the popup, options page and blocked page match. |
| How many times each site was blocked, and whether blocking is paused | `chrome.storage.local` | To show "times blocked" and to resume after a pause. Stays on this device. |
| If you turn on password protection: a salted hash of your password, plus failed-attempt and reset timers | `chrome.storage.local` | To check the password and to enforce waiting periods. The password itself is never stored, and the hash never leaves this device. |
| Whether Blockr is currently unlocked | `chrome.storage.session` | Kept in memory only and cleared when the browser closes. |

## What Blockr does not do

- It does not send your block list, browsing history, or any other data to the developer or any third party.
- It does not read the content of pages you visit. To block a site it only compares page addresses against your block list, on your device.
- It does not use cookies, tracking, or analytics.

## Why Blockr needs its permissions

- **Access to all websites:** so a block rule can apply to whichever site you choose to block. Blockr only acts on sites in your list.
- **declarativeNetRequest, webNavigation, tabs:** to redirect blocked sites to Blockr's "blocked" page, including when a site changes page without a full reload (for example YouTube Shorts), and to move already-open tabs on a newly blocked site to that page.
- **storage:** to save your settings (see above).
- **alarms:** to end a timed pause automatically.
- **favicon:** to show site icons from Chrome's local icon cache. No request is sent to any website for this.

## Links to other sites

The options page has a "donate" link. It opens an external page in a new tab only if you click it.
That site has its own privacy policy, and Blockr shares nothing with it.

## Your control

You can edit or delete any site, switch blocking off, or pause it at any time. Removing the
extension deletes the data Blockr stored on this device. Data synced through your Google
account can be cleared in Chrome's sync settings.

## Changes and contact

If this policy changes, the updated version will be published at this location with a new date.

Questions: **samadali.developer@gmail.com**
