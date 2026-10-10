# Changelog

All notable changes to Blockr are listed here, newest first. The format follows
[Keep a Changelog](https://keepachangelog.com/), and versions follow the number in `manifest.config.ts`.

When you release a new version: add its section here, add a matching short entry to
`react-app-source/src/shared/changelog.ts` (shown once inside the extension after an update), and bump
`version` in `manifest.config.ts`.

## [1.3] - 2026-10-10

Versions 1.1 and 1.2 were never published; everything in them ships in 1.3, together with the changes below.

### Added
- A new icon: a clean red shield with a white "B". The wordmark and the buttons now use exactly the icon's red.
  Colours were re-checked for contrast: text reaches at least 4.5:1 and borders and switches 3:1, in light and dark mode.
- The "Blockr" wordmark is set in Righteous (bundled with the extension, SIL Open Font License) instead of italic.
- Separate tokens for error colours, so they can be changed independently of the brand colour.
- Animations stop when the system's "reduce motion" setting is on.
- A new options layout: a card on the left lists Block list, Presets, Schedule, Password and Settings, and each opens
  its own page. On narrow windows the list opens from a "menu" button. Each page has its own address (`#presets`,
  `#schedule` and so on), so refreshing keeps your place.
- An Adult content preset on the Presets page, switched off until you turn it on. It is controlled only from the
  options page.
- Dark mode, with a Light / Dark / System choice in Settings. Colours are tuned for WCAG AA contrast.
- Optional password protection for the options page and for pausing or turning off blocking. A forgotten
  password can be reset after a cancellable 6-hour wait.
- Block schedule: only block on chosen days and hours, including overnight windows.
- Daily time limits for custom sites. Time counts while the site is in the active tab of the focused window and
  you are not idle (2.5 minutes), or while any tab of it is playing sound. Used-up sites are blocked until midnight.
- Export and import of the custom list (Settings, "Backup and restore").
- A one-time welcome page after a first install (never on updates, never when a synced list already exists).
- A prompt to allow Blockr in private windows, with a link to Blockr's page in `chrome://extensions`.
- A "What's new" note inside the options page after an update.
- New preset sites: Snapchat and Threads (social media); Facebook Reels and Snapchat Spotlight (short-form).

### Changed
- Presets now cover every address of a site (for example X blocks both `x.com` and `twitter.com`; Reddit also
  covers `redd.it`). A preset counts once in the popup however many addresses it has.
- The custom list is stored as one entry per site, so about 400 sites fit instead of about 60. Existing lists are
  upgraded automatically, and a copy of the old data is kept on the device.
- Stored data now has a version number, so future updates can upgrade it safely. Data written by a newer Blockr is
  never modified by an older one.
- The options page fills the window on large screens and switches to a card layout on narrow ones.
- The three preset categories now share one Presets page instead of separate tabs.
- Popup redesigned as a bordered card, with a status line and a pause drop-down.
- "Date added" moved out of the table into the edit row (and the card layout on narrow screens).

### Fixed
- Buttons no longer shift on hover.
- The blocked page only counts blocks for sites that are really on your list.

### Permissions
- Added `idle` (to tell whether you are at the computer, for daily limits). It shows no install warning.

## [1.0] - 2026-10-06

First release: custom block list with enable/disable, edit and delete; social media and short-form presets; popup
with category switches, disable and timed pause; blocked page; catches in-page navigation (for example YouTube
Shorts); per-site "times blocked" counters.
