# BasKar: guide for AI agents

Start here if you are an AI coding agent (Claude, Codex, Copilot, Cursor, Gemini or similar) working in this repository. Humans can read it too.

## What this is

BasKar is a daily-budget web app. It takes monthly take-home pay, subtracts fixed costs, and shows **one number: what you can safely spend today**. Every spend counts it down. Overspending shrinks tomorrow's number; underspending can be moved into goals.

- It has no server. All data stays in the user's browser, encrypted with the account password (since 2.0).
- It works offline once opened (service worker, `sw.js`).
- It is live on GitHub Pages: https://tktarun03.github.io/baskar/
- Users: individuals in India and the Gulf (the owner is in Qatar and uses QAR). It supports every ISO currency.
- Languages: English, Arabic (right-to-left) and Tamil.
- The app is mobile-first and is mostly used in iPhone Safari, often from the Home Screen.

## Repo map

| Path | What it is |
|---|---|
| `index.html` | The page shell: head, launch screen, mount points, then every script tag in load order. Small; rarely changes. |
| `css/app.css` | All styles. Colour tokens are on `:root`, dark mode redefines them, and right-to-left/Tamil rules are near the end. |
| `js/i18n-rows.js` | The translation table: one `[English, Arabic, Tamil]` row per string. |
| `js/core/` | Logic with no UI: storage, encryption (`vault.js`), money formatting, budget maths, parsing (SMS, CSV, one-line entry), insights, self-check, content (categories), release history. |
| `js/ui/` | Cross-cutting UI: icons and mascot, white label, the translator. |
| `js/app/` | The app frame: state and profiles, demo data, rendering and sheets framework, file saving (`files.js`), the action dispatcher, boot. |
| `sw.js` | Service worker for offline use. Its `VERSION` must match the release. |
| `.github/workflows/tests.yml` | Runs `tests/run-tests.js` on every push and pull request. |
| `js/features/` | **One file per feature**: its screen or sheet, its save logic and its button actions. |
| `tests/run-tests.js` | Checks the file structure, then runs the built-in self-check in headless Chromium. Exits 1 on failure. |
| `CHANGELOG.md` | Version history, newest first. Mirrors `js/core/releases.js`. |
| `ROADMAP.md` | What's planned and why. |
| `docs/ARCHITECTURE.md` | How the app works inside. |
| `.claude/skills/*/SKILL.md` | Step-by-step playbooks (below). Plain Markdown, so any agent can follow them. |
| `manifest.webmanifest`, `*.png`, `.nojekyll` | Home Screen icon, PWA manifest, and "serve files as-is" for GitHub Pages. |

## Playbooks (skills)

Read the matching playbook before you start one of these jobs:

| Job | Playbook |
|---|---|
| Ship any change (version bump, changelog, tests, deploy) | `.claude/skills/baskar-release/SKILL.md` |
| Add or fix a translation, or add a language | `.claude/skills/baskar-translate/SKILL.md` |
| Teach the app a new bank SMS or CSV statement format | `.claude/skills/baskar-bank-formats/SKILL.md` |
| Add a screen, sheet, setting or button | `.claude/skills/baskar-ui-change/SKILL.md` |

Claude Code loads these as skills automatically. Other agents should open the file and follow it.

## How the code is loaded

There is **no build step and no bundler**. `index.html` loads plain `<script>` files in a fixed order: libraries, translations, `js/core`, `js/ui`, `js/app` (except boot), every `js/features` file A–Z, and finally `js/app/boot.js`.

- All app files share **one global scope**: a top-level `function` or `var` in any file is visible to every other file. That's why files have no `import`/`export`, and why every top-level name must be unique across the whole app (the test enforces this).
- Code that runs at load time may only use things from files loaded **before** it. Function bodies run later, so they can call anything.
- Actions: `js/app/actions.js` creates `var ACT = {}` and the click listener. Each feature adds its own buttons with `Object.assign(ACT, { 'my-action': function (el) { … } })`.

## Where things are

| Feature or concern | File |
|---|---|
| Today tab | `js/features/today.js` |
| Activity tab, transaction rows | `js/features/activity.js` |
| Insights tab and charts | `js/features/insights.js` (helpers in `js/core/insights.js`) |
| Money tab → Goals / Bills / Wallets | `js/features/money.js`, `goals.js`, `bills.js`, `wallets.js` |
| Plan tab | `js/features/plan.js` |
| Add or edit a spend, one-line entry, spend notices | `js/features/add-spend.js` (parser in `js/core/parse.js`) |
| Paste bank SMS | `js/features/bank-sms.js` (parser in `js/core/parse.js`) |
| CSV import and export | `js/features/csv.js` |
| Quick adds | `js/features/quick-adds.js` |
| Weekly review | `js/features/weekly-review.js` |
| Tonight's recap | `js/features/recap.js` |
| Sign in, create account | `js/features/auth.js` |
| Switch account, sign out | `js/features/accounts.js` |
| Settings and its sub-pages | `settings.js`, `branding.js`, `payee-rules.js`, `storage-backup.js`, `self-check.js`, `version-history.js` in `js/features/` |
| Budget maths | `js/core/budget.js` |
| Storage, password hashing | `js/core/storage.js` |
| Encryption of saved data | `js/core/vault.js` (used by `saveProfile` / `openProfile` in `js/app/state.js`) |
| Backup file, restore, Today reminders | `js/features/backup.js` |
| Saving a file (download) | `js/app/files.js` |
| Offline caching | `sw.js` |
| Money and date formatting | `js/core/format.js` |
| Categories, meals, roasts | `js/core/content.js` |
| Version history | `js/core/releases.js` |
| Self-check cases | `js/core/selftest.js` |
| State, profiles, `migrate()` | `js/app/state.js` |
| `renderAll`, tabs, sheet framework, `toast` | `js/app/render.js` |
| Start-up | `js/app/boot.js` |

Every file starts with a one-line description. To find where some text or function lives, search the repo for it: `grep -rn "Tonight’s recap" js/`.

## Golden rules

1. **No build, no framework.** Edit the files directly. Don't add a bundler, framework, `import`/`export`, or npm dependencies to the app.
2. **New file?** Add its `<script src="js/…?v=<current version>">` tag to `index.html` in the right place: features A–Z, before `boot.js`. Start it with the standard header comment and `'use strict';`. Keep top-level names unique.
3. **Escape everything.** HTML is built as strings. Wrap any user or bank text in `esc()`. Never put raw input into `innerHTML`.
4. **Data stays local.** Never add network calls that send user data anywhere. The only network requests are the pinned CDN libraries (cdnjs) and Google Fonts.
5. **Don't break saved data.** Profiles live in users' cookies, sealed with their password. New fields need a default in `migrate()`. Never rename or remove an existing field without a migration. Always save through `saveProfile()` (it encrypts); never write `bk_p_<id>` directly, and never store or log the key anywhere new.
6. **Write UI text in English, then translate it.** Add a row to `BASKAR_I18N_ROWS` for every new string. Keep user data (names, payees, amounts) out of translatable sentences: put it in its own element (see `dots()`).
7. **Every release updates the history.** Add an entry to `RELEASES` (`js/core/releases.js`) and to `CHANGELOG.md`, bump every `?v=` in `index.html`, and bump `VERSION` in `sw.js`. The release playbook covers it all.
8. **Tests must pass.** Run `node tests/run-tests.js` before you commit. If you change parsing or budget maths, add a check.
9. **Mobile Safari first.** Use 16px or larger inputs so iOS doesn't zoom, tap targets of 44px or more, and no horizontal scroll at 375px. Test right-to-left in Arabic.
10. **Plain, short UI copy.** Use sentence case, say what happened and what to do, and avoid jargon. The playful "roast" lines are the only exception, and they must have a neutral version for when Roast mode is off.

## Test

```bash
npm install --no-save playwright && npx playwright install chromium   # once
node tests/run-tests.js
```

The same checks run on a phone from **Settings → Run self-check**. If a check fails, fix the code, not the test, unless the test itself is wrong.

## Deploy

Pushing to `main` publishes to GitHub Pages ("Deploy from a branch", root folder) within about a minute. Every CSS and JS link in `index.html` carries `?v=<version>`. Change them all at each release, or iPhones may keep running cached old files next to a new page. There is no staging, so `main` is production. Users get the new version on their next load or by tapping Refresh. A "What's new" notice shows the top `RELEASES` entry once.

## Known sharp edges

- **Cookie size.** Each profile is compressed and split into cookies of about 3.6 KB each. Large accounts overflow to local storage automatically (`Store.set`). Don't store big blobs per transaction.
- **Safari evicts storage** after about 7 days without a visit (Home Screen apps are exempt). That's why Today shows a backup reminder and an Add to Home Screen tip.
- **Saving is asynchronous.** With encryption on, `saveProfile()` snapshots the data and seals it in the background, in order (`Vault.queue`). Don't read `bk_p_<id>` back right after saving and expect plain JSON.
- **Locked state.** After a cold start without a remembered key, `S.p` is null and the unlock screen shows. Code that runs at boot must not assume an open account.
- **Offline cache.** The page is network-first; app files are cache-first by their `?v=` URL. Forgetting to bump `?v=` means phones keep old files.
- **No password recovery.** Passwords are hashed locally, and the data is encrypted with them; a lost password means the data is gone. Backup files are plain JSON.
- **Shared global scope.** Don't name a local variable after a global helper (`dots`, `money`, `esc`, `ic`, `S`…); this has caused a bug before. Don't reuse a top-level name in another file: the later file silently wins (the test catches it).
- **Re-renders replace the DOM.** Typing into an input that triggers `renderAll()` loses focus. For live input, update elements in place (see the SMS exchange-rate rows) instead of re-rendering.
- **iOS date inputs** ignore `width:100%` unless they have `appearance:none` and `min-width:0`. That's already in the CSS; keep it.
