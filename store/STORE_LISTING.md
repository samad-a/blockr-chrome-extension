# Chrome Web Store listing text

Copy these into the Developer Dashboard. Check the current field limits there.

## Store listing tab

**Name:** Blockr - Website Blocker

**Short description (max 132 characters):**
Block distracting websites like social media and short-form video, and stay focused. Simple, private, no account needed.

**Category:** Productivity

**Language:** English

**Detailed description:**

Blockr helps you stay focused by blocking the websites that pull you away from your work.

HOW IT WORKS
• Add any site to your own block list, or use the built-in lists for social media (Instagram, TikTok, X, Facebook, Reddit) and short-form content (YouTube Shorts, TikTok, Instagram Reels).
• Switch individual sites on or off whenever you like.
• When you visit a blocked site, Blockr shows a calm "blocked" page instead, with a button to go back.
• Need a break? Pause blocking for 15 minutes, 1 hour, or until tomorrow, straight from the popup.
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

- **storage:** Saves the user's block list, on/off settings, block counters, and pause state so they persist and sync across the user's own Chrome profile.
- **declarativeNetRequest:** Redirects page loads of sites on the user's block list to Blockr's blocked page.
- **webNavigation:** Detects in-page navigation on sites that change address without a full reload (for example opening a YouTube Short), so those pages can also be blocked.
- **tabs:** Reads the address of open tabs so a tab already on a newly blocked site can be moved to the blocked page, and updates the tab's address to do so.
- **alarms:** Ends a timed pause (for example "15 minutes") automatically so blocking resumes on time.
- **favicon:** Shows each site's icon in the block list from Chrome's local favicon cache. No network request is made.
- **Host permissions (all sites):** The user can block any website they enter, so redirect rules and in-page navigation checks must be able to apply to any site. Blockr only acts on sites in the user's own block list and does not read page content.

**Remote code:** No. All code is bundled in the extension.

**Data usage:** Blockr does not collect or transmit user data. In the data-usage form, do not tick any data-collection categories, and tick all three certifications (no selling data, no use unrelated to the single purpose, no creditworthiness use).

**Privacy policy URL:** `https://github.com/samad-a/blockr-chrome-extension/blob/main/PRIVACY.md` (the repository must be public for this link to work, otherwise host the policy somewhere public).

## Assets (in this folder)

- `screenshot-1-options.png`, `screenshot-2-popup.png`, `screenshot-3-blocked.png`: 1280x800 screenshots.
- `promo-tile-440x280.png`: small promo tile.
- Icon: `react-app-source/public/icons/icon-128.png`.
