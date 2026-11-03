# Version history

The same list is in the app under **Settings → Version history**. Newest first.

## 2.3.1 · 3 Nov 2026
- Favicon: `favicon.svg` (filled coin, thicker strokes so it reads at 16 px) and `favicon.ico` (16/32/48), replacing the 512 px PNG
- `brandFavicon()` swaps the tab icon for the white-label logo, or redraws the coin in the account's theme colour
- `favicon-32.png` kept for tools that want a PNG

## 2.3 · 3 Nov 2026
- Share (`js/features/share.js`): recap (PNG receipt drawn on a canvas + text), weekly review, goal, payment, this cycle, backup and CSV files, app invite
- Uses `navigator.share` (files when `navigator.canShare` allows); otherwise copies to the clipboard, otherwise a sheet with the text to copy. Inside Claude the share sheet isn't available, so it copies.
- Everything before `navigator.share()` is synchronous (image via `toDataURL`), so iPhone keeps the tap's permission
- Shared text goes through the translation table (`T()`), so it's in the chosen language; `money()` keeps "Hide amounts" in effect
- New `share` icon

## 2.2 · 2 Nov 2026
- Edit profile (`js/features/profile.js`): photo (centre-cropped to 160 px JPEG, ~3–8 KB), name, email. Stored in `bk_idx` with the account list, so it shows before unlocking and is not encrypted.
- Change password: checks the current one, derives a new key, re-seals the data on `Vault.queue` before updating the stored hash, so a failure can't lock anyone out. Face ID is turned off (it wrapped the old key) and "Stay unlocked" is moved to the new key.
- Theme colour per account (`settings.accent`), overriding the device's brand colour; `applyAccent()` runs with `applyTheme()`
- Pinch and double-tap zoom disabled: viewport `user-scalable=no`, `touch-action: pan-x pan-y`, and cancelled `gesture*` events for iOS Safari, which ignores the viewport setting
- `avatar()` shows the photo everywhere: header, settings, account picker, sign-in and PIN screens

## 2.1 · 2 Nov 2026
- Face ID / fingerprint unlock (`js/core/passkey.js`): a platform passkey with the WebAuthn PRF extension produces a secret; HKDF turns it into an AES-GCM key that wraps the account's data key, stored per device as `bk_bio_<id>`. Unlocking decrypts the data key, so it's real encryption, not a screen. Shown only where `isUserVerifyingPlatformAuthenticatorAvailable()` is true, on the website (not inside Claude). If Safari needs a second tap to hand over the PRF secret, a "Finish" action completes setup.
- PIN screen lock (`js/features/quick-unlock.js`): only with "Stay unlocked"; asked on a cold open and after 60 s in the background; 5 wrong tries turn "Stay unlocked" off and require the password. Labelled as not adding encryption.
- Sign-in, password, Face ID and PIN all finish through `finishUnlock()`
- Tested end to end in Chromium with a virtual authenticator (PRF); not yet on a real iPhone

## 2.0 · 2 Nov 2026
- Encryption at rest: each account's data is sealed with AES-GCM using a key from its password (PBKDF2-SHA-256, 150,000 rounds, separate salt from the login hash). Data from earlier versions is sealed the first time it's unlocked. New `js/core/vault.js`.
- The key is remembered for the open tab; "Stay unlocked on this device" (Settings → Privacy, off by default) keeps it in local storage instead
- Offline support: `sw.js` caches every file `index.html` loads plus the CDN libraries and fonts; the page is network-first, everything else cache-first
- Backup: "Back up now" saves a JSON file, "Restore from file" reads it back, and Today reminds you after 7 days without a backup (`js/features/backup.js`)
- Files download normally on the website (`js/app/files.js`); inside Claude they still use the downloads capability. Fixes CSV export on GitHub Pages, which used to show text to copy.
- iPhone Safari tip to add the app to the Home Screen
- GitHub Actions runs the tests on every push and pull request
- Tests check that `sw.js` VERSION matches the release; self-check adds 6 encryption checks (150 checks)

## 1.9 · 2 Nov 2026
- The app is split into one file per feature behind a small `index.html`: `css/app.css`, `js/core`, `js/ui`, `js/app` and `js/features` (plain scripts, no build step)
- Every CSS and JS link carries `?v=1.9`, so iPhones fetch the new files together after an update
- `tests/run-tests.js` now also checks the file structure: every file loaded, one version everywhere, no duplicate top-level names
- Self-check: 144 checks

## 1.8 · 2 Nov 2026
- A launch screen while the app loads, showing your own app name, logo and colour
- Translations moved to one easy-to-edit row per sentence (`BASKAR_I18N_ROWS`)
- Guide and playbooks in the repository so any AI assistant or developer can safely update the app: `AGENTS.md`, `docs/ARCHITECTURE.md`, `.claude/skills/`, `ROADMAP.md`
- Self-check: 142 checks

## 1.7 · 2 Nov 2026
- Arabic (right-to-left) and Tamil, picked in Settings or on the sign-in screen; it follows your phone's language the first time
- Dates and currency names follow the chosen language; amounts keep Western digits so they match your bank
- Your own data (payee names, wallets, goals, remarks) is never translated
- Self-check adds language checks (140 checks)
- Translations are machine-written and still need review by native speakers

## 1.6 · 2 Nov 2026
- One-line entry: type "15 shawarma lunch" or "karak 3 cash" and the form fills itself
- Sheet headers stay fixed while the content scrolls
- Insights: top payees this cycle and when in the day you spend
- Built-in self-check in Settings tests the bank-SMS reader, budget maths, one-line entry and CSV (128 checks); also runnable with `node tests/run-tests.js`
- Fixed: SMS saying "from your account …" or "to your account …" now pick the shop as the payee

## 1.5 · 2 Nov 2026
- Settings menu: tap your avatar to change the app name, logo, theme, data and account
- Version history, with a notice when a new version loads
- Quick adds: log a regular spend in one tap from Today
- Undo after deleting a transaction or adding from SMS or CSV
- Payee rules: fix a payee's name or category once and it applies to past and future payments
- Weekly review: last 7 days vs the week before, top payees and one tip
- Bank SMS in another currency now asks for an exchange rate instead of logging the wrong amount

## 1.4 · 2 Nov 2026
- Food spends are tagged Breakfast, Lunch or Dinner from the time
- Remarks on every spend and on each pasted SMS
- Refresh button to load the latest version
- Notices slide up from the bottom and have a close button

## 1.3 · 2 Nov 2026
- Fixed forms shifting sideways on iPhone Safari
- Reads "Debit Card … was used for QAR …" bank messages
- Debit card messages go to your bank wallet

## 1.2 · 2 Nov 2026
- Paste bank SMS to log spends
- Import and export CSV, including bank statements
- Published on GitHub Pages with Home Screen icons

## 1.1 · 2 Nov 2026
- White-label branding: app name, logo, colour, mascot and catchphrase
- Minimalist redesign with a mobile-first layout and the tab bar fixed at the bottom
- Hide amounts, theme setting and quick re-add of recent payees

## 1.0 · 27 Oct 2026
- Accounts on this device, any currency and multiple wallets
- Daily safe-to-spend that adjusts after each day
- Goals, streaks, category limits, subscriptions and a bills calendar
