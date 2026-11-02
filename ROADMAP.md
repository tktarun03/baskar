# BasKar roadmap

Updated 2 Nov 2026, at version 1.8. Items are ordered by value to users, then by risk. Each item says why it matters and what "done" means. Change this file in the same commit that ships or reprioritizes an item.

**Status key:** ✅ shipped · 🔨 in progress · ⏭ next · 🧊 later · ❓ needs a decision

## Where we are

BasKar is a single-file web app on GitHub Pages:

- one daily number, goals, category limits, bills and subscriptions
- bank SMS and CSV import, payee rules, weekly review
- white label
- English, Arabic and Tamil

All data lives in the user's browser. That makes it private and free to run, and it is also the biggest weakness: data can vanish (Safari storage eviction, cleared site data), and it doesn't sync between devices.

## Now (1.9 – 2.0): make it safe to depend on

| # | Item | Why | Done when |
|---|---|---|---|
| 1 | ❓ **Split `index.html` into modules** | ~3,100 lines in one file slows every change and makes conflicts likely. | `index.html` is a small shell. CSS is in `css/`, code in `js/` as native ES modules (no build step), and translations in `js/i18n.js`. Tests pass. The Claude artifact is published as a multi-file bundle. |
| 2 | ⏭ **Offline support (service worker)** | It fails offline today, and iOS Home Screen users expect an app to open without signal. | The app opens and logs spends in airplane mode. The CDN libraries and fonts are cached. An update prompt appears when a new version is deployed. |
| 3 | ⏭ **Backup you can't forget** | Safari can delete site data after about 7 days without a visit. | A one-tap backup file (`.baskar.json`, optional password encryption). A reminder appears when the last backup is more than 7 days old. Restore is tested. |
| 4 | ⏭ **Native review of Arabic and Tamil** | The 1.7 translations were machine-written. | A fluent speaker for each language has reviewed every row, and plural forms are fixed (Arabic needs 1, 2, 3–10 and 11+ forms). |
| 5 | ⏭ **Arabic-language bank SMS** | Gulf banks often send Arabic texts. | QNB, Doha Bank, CBQ and Emirates NBD Arabic messages are read, Arabic-Indic digits ٠–٩ are handled, and there are self-check cases for each. |
| 6 | ⏭ **CI on every push** | Nothing stops a broken commit reaching production. | A GitHub Action runs `tests/run-tests.js` on pull requests, and `main` is protected by it. |

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
- **1.8:** we will **not** split the app into one HTML page per feature. Separate pages would reload the libraries and lose in-memory state on every tab change, and they would break the bottom-sheet flow. Splitting into JS/CSS modules behind one page is the plan instead (item 1).

## Known limits we accept for now

- No password recovery (passwords are hashed locally).
- One user per account. Sharing a device means separate accounts.
- Charts need the Chart.js CDN on first load.
