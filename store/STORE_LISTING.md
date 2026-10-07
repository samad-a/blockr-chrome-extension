# Chrome Web Store listing text

Copy these into the Developer Dashboard. Check the current field limits there.

## Store listing tab

**Name:** Blockr - Website Blocker

**Short description (max 132 characters):**
Block distracting websites like social media and short-form video, and stay focused. Simple, private, no account needed.

**Category:** Productivity (the first group in the list; "Well-being" is the other reasonable fit)

**Language:** English

**Detailed description:**

Blockr helps you stay focused by blocking the websites that pull you away from your work.

HOW IT WORKS
• Add any site to your own block list, or use the built-in lists for social media (Instagram, TikTok, X, Facebook, Reddit, Snapchat, Threads) and short-form content (YouTube Shorts, TikTok, Instagram Reels, Facebook Reels, Snapchat Spotlight).
• Switch individual sites on or off whenever you like.
• When you visit a blocked site, Blockr shows a calm "blocked" page instead, with a button to go back.
• Need a break? Pause blocking for 15 minutes, 1 hour, or until tomorrow, straight from the popup.
• Optional daily time limits: give a site, say, 20 minutes a day. Time counts while you're watching it or it's playing sound, and it's blocked until midnight once you've used it up.
• Optional block schedule: only block on the days and hours you choose, such as work hours.
• Optional password protection: ask for a password before blocking can be paused, turned off, or changed. Forgot it? A 6-hour cooling-off reset (cancellable) removes it.
• Light and dark themes, or follow your device setting.
• Back up your custom list to a file, and add sites from a file.
• See how many times each site has been blocked.

PRIVATE BY DESIGN
• No account, no tracking, no ads.
• Your block list stays in your browser. Nothing is ever sent to a server.

SIMPLE
• One popup for the essentials: pause, and turn social media or short-form blocking on or off.
• A full options page to manage your list: add, edit, delete, and toggle sites.

Blockr is free. If it helps you, you can support its development with the donate link on the options page.

## Privacy tab

**Single purpose:**
Blockr blocks websites the user chooses, redirecting them to a "blocked" page, to help the user stay focused.

**Permission justifications:**

- **storage:** Saves the user's block list, on/off settings, theme, block counters, pause state, and (if the user enables password protection) a salted password hash, so they persist. Only the block list and settings sync; counters, pause and the password hash stay on the device.
- **declarativeNetRequest:** Redirects page loads of sites on the user's block list to Blockr's blocked page.
- **webNavigation:** Detects in-page navigation on sites that change address without a full reload (for example opening a YouTube Short), so those pages can also be blocked.
- **tabs:** Reads the address, active state and audio state of open tabs (on the device only) to count time toward the user's daily limits, and so a tab already on a newly blocked site can be moved to the blocked page (this updates the tab's address).
- **idle:** Detects when the user is away from the computer (idle or screen locked), so daily-limit time stops counting when nobody is using the site. No idle data is stored.
- **alarms:** Ends a timed pause (for example "15 minutes"), a pending password reset, and switches blocking on or off at the user's schedule times, automatically and on time.
- **favicon:** Shows each site's icon in the block list from Chrome's local favicon cache. No network request is made.
- **Host permissions (all sites):** The user can block any website they enter, so redirect rules and in-page navigation checks must be able to apply to any site. Blockr only acts on sites in the user's own block list and does not read page content.

**Remote code:** No. All code is bundled in the extension.

**Data usage:** Blockr does not collect or transmit user data. In the data-usage form, do not tick any data-collection categories, and tick all three certifications (no selling data, no use unrelated to the single purpose, no creditworthiness use).

**Privacy policy URL:** `https://github.com/samad-a/blockr-chrome-extension/blob/main/PRIVACY.md` (the repository is public).

## Assets (in this folder)

| Dashboard field | File |
|---|---|
| Store icon (128x128) | `store-icon-128x128.png` |
| Screenshots (1280x800, up to 5) | `screenshot-1-options.png`, `screenshot-2-popup.png`, `screenshot-3-blocked.png` |
| Small promo tile (440x280) | `promo-tile-440x280.png` |
| Marquee promo tile (1400x560, optional) | `marquee-promo-tile-1400x560.png` |

The extension package itself is `react-app-source/release/blockr-1.1.zip` (`npm run package`).
