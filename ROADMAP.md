# BasKar roadmap

Updated 2 Nov 2026, at version 2.1. Items are ordered by value to users, then by risk. Each item says why it matters and what "done" means. Change this file in the same commit that ships or reprioritizes an item.

**Status key:** ✅ shipped · 🔨 in progress · ⏭ next · 🧊 later · ❓ needs a decision

## Where we are

BasKar is a no-build web app on GitHub Pages (one small page, a CSS file and one script per feature):

- one daily number, goals, category limits, bills and subscriptions
- bank SMS and CSV import, payee rules, weekly review
- white label
- English, Arabic and Tamil

All data lives in the user's browser. That makes it private and free to run, and it is also the biggest weakness: data can vanish (Safari storage eviction, cleared site data), and it doesn't sync between devices.

## Now (1.9 – 2.0): make it safe to depend on

| # | Item | Why | Done when |
|---|---|---|---|
| 1 | ✅ **Split `index.html` into feature files** (1.9) | ~3,100 lines in one file slowed every change and made conflicts likely. | Done: `index.html` is a ~110-line shell, with `css/app.css`, `js/core`, `js/ui`, `js/app` and 22 files in `js/features`. Plain scripts share one global scope; structure tests guard load order, versions and name clashes. |
| 2 | ✅ **Offline support (service worker)** (2.0) | It fails offline today, and iOS Home Screen users expect an app to open without signal. | The app opens and logs spends in airplane mode. The CDN libraries and fonts are cached. An update prompt appears when a new version is deployed. |
| 3 | ✅ **Backup you can't forget** (2.0: plain JSON file, encrypted backups still to do) | Safari can delete site data after about 7 days without a visit. | A one-tap backup file (`.baskar.json`, optional password encryption). A reminder appears when the last backup is more than 7 days old. Restore is tested. |
| 4 | ⏭ **Native review of Arabic and Tamil** | The 1.7 translations were machine-written. | A fluent speaker for each language has reviewed every row, and plural forms are fixed (Arabic needs 1, 2, 3–10 and 11+ forms). |
| 5 | ⏭ **Arabic-language bank SMS** | Gulf banks often send Arabic texts. | QNB, Doha Bank, CBQ and Emirates NBD Arabic messages are read, Arabic-Indic digits ٠–٩ are handled, and there are self-check cases for each. |
| 6 | 🔨 **CI on every push** (2.0: tests run on every push. To *block* a bad deploy, switch Settings → Pages → Source to "GitHub Actions" and add a deploy job after the tests) | Nothing stops a broken commit reaching production. | A GitHub Action runs `tests/run-tests.js` on pull requests, and `main` is protected by it. |

| 6a | ✅ **Encrypt saved data** (2.0) | Every Pages site under `tktarun03.github.io` shares one origin, so any of them could read BasKar's storage. | Account data is sealed with AES-GCM using a key from the password. The account list (names, emails) is still plain. |
| 6d | ✅ **Face ID unlock and PIN screen lock** (2.1) | Typing the password every time is friction. | Face ID unwraps the real data key (passkey PRF); PIN is a labelled screen lock on top of Stay unlocked. Needs testing on a real iPhone. |
| 6b | ⏭ **Encrypted backup files** | The backup file is plain JSON today. | An option to protect the backup with the account password; restore asks for it. |
| 6c | 🧊 **Own domain** | It would also isolate storage from other `github.io` pages, and looks more trustworthy. | Custom domain on Pages with HTTPS. |

## Next (2.x): fewer taps, better advice

| # | Item | Why |
|---|---|---|
| 7 | 🧊 **Share-to-BasKar** | Paste is clumsy. The Web Share Target API (Android) and an iOS Shortcut can send an SMS straight in. |
| 8 | 🧊 **Daily reminder notification** | Web Push works on iOS 16.4+ for Home Screen apps. A 10 pm nudge would remind people to check tonight's recap. |
| 9 | 🧊 **Recurring income and irregular pay** | Freelancers and commission earners don't have one salary day. |
| 10 | 🧊 **Wallets in different currencies** | Expats hold QAR and INR accounts. Each wallet needs its own currency, with totals converted at a saved rate. |
| 11 | 🧊 **Split and shared expenses** | Roommates and couples. Start with "I paid, they owe me"; full shared budgets come later. |
| 12 | 🧊 **Smarter insights** | Month-over-month trends, a "safe to spend this weekend" figure, and a list of subscriptions with how often each was used. |
| 13 | 🧊 **More languages** | Hindi, Malayalam and Urdu (RTL). The i18n system already supports adding them (see the translate playbook). |

## Later (3.x): needs a server and a business decision

| # | Item | Notes |
|---|---|---|
| 14 | ❓ **Sync between devices** | Needs accounts on a server, or user-owned storage (an iCloud or Google Drive file). End-to-end encryption keeps the privacy promise. |
| 15 | ❓ **Automatic bank feeds** | India: the RBI Account Aggregator framework, through a licensed partner. Qatar and the Gulf: depends on each central bank's open-banking rules; check current status before planning. Requires a backend, consent flows and compliance work. |
| 16 | 🧊 **Receipt photo to transaction** | On-device OCR to stay private. Large download; measure the performance cost first. |
| 17 | 🧊 **Native app wrapper** | Capacitor or similar, for App Store presence and better notifications. Only once the web app is stable. |

## Decisions log

- **1.0:** no server; data stays on the device. That's still true. Revisit only for item 14 or 15.
- **1.7:** translations are applied after render (English is the source). This is cheap to maintain, but every new string needs a row.
- **1.9:** split into plain scripts that share one global scope, **not** ES modules (`import`/`export`). ES modules don't load from `file://`, which would break opening the app locally and the simple test runner, and they need every cross-file name listed by hand. Moving to ES modules later is mechanical if the app outgrows this.
- **1.8:** we will **not** split the app into one HTML page per feature. Separate pages would reload the libraries and lose in-memory state on every tab change, and they would break the bottom-sheet flow. Splitting into JS/CSS modules behind one page is the plan instead (item 1).

## Known limits we accept for now

- No password recovery (passwords are hashed locally).
- One user per account. Sharing a device means separate accounts.
- Charts need the Chart.js CDN on first load.
