# BasKar: guide for AI agents

Start here if you are an AI coding agent (Claude, Codex, Copilot, Cursor, Gemini or similar) working in this repository. Humans can read it too.

## What this is

BasKar is a daily-budget web app. It takes monthly take-home pay, subtracts fixed costs, and shows **one number: what you can safely spend today**. Every spend counts it down. Overspending shrinks tomorrow's number; underspending can be moved into goals.

- It has no server. All data stays in the user's browser.
- It is live on GitHub Pages: https://tktarun03.github.io/baskar/
- Users: individuals in India and the Gulf (the owner is in Qatar and uses QAR). It supports every ISO currency.
- Languages: English, Arabic (right-to-left) and Tamil.
- The app is mobile-first and is mostly used in iPhone Safari, often from the Home Screen.

## Repo map

| Path | What it is |
|---|---|
| `index.html` | **The whole app**: CSS, translations and JavaScript in one file (~3,900 lines, of which ~770 are translation rows). It is the only source; there is no build step. |
| `tests/run-tests.js` | Runs the app's built-in self-check in headless Chromium and exits 1 on failure. |
| `CHANGELOG.md` | Version history, newest first. Mirrors `RELEASES` inside `index.html`. |
| `ROADMAP.md` | What's planned and why. |
| `docs/ARCHITECTURE.md` | How the app works inside: state, rendering, storage, budget maths, i18n, white label. |
| `.claude/skills/*/SKILL.md` | Step-by-step playbooks for common jobs (see below). They are plain Markdown, so any agent can follow them. |
| `manifest.webmanifest`, `*.png` | Home Screen icon and PWA manifest. |
| `.nojekyll` | Tells GitHub Pages to serve files as-is. |

## Playbooks (skills)

Read the matching playbook before you start one of these jobs:

| Job | Playbook |
|---|---|
| Ship any change (version bump, changelog, tests, deploy) | `.claude/skills/baskar-release/SKILL.md` |
| Add or fix a translation, or add a language | `.claude/skills/baskar-translate/SKILL.md` |
| Teach the app a new bank SMS or CSV statement format | `.claude/skills/baskar-bank-formats/SKILL.md` |
| Add a screen, sheet, setting or button | `.claude/skills/baskar-ui-change/SKILL.md` |

Claude Code loads these as skills automatically. Other agents should open the file and follow it.

## Finding your way in `index.html`

Sections start with a banner comment. Search for `/* ---------------- ` to list them:

| Section banner | Contains |
|---|---|
| `Storage:` | `Store`: JSON → lz-string → chunked cookies, with local storage or memory fallback |
| `Password hashing` | PBKDF2 via Web Crypto (`hashPw`) |
| `Currency & formatting` | `money()`, `fmtDate()`, `fmtTime()`, `currencyOptions()`, `relDays()` |
| `Budget maths` | `cycleFor()`, `calc()`, `streakInfo()`, `capStatus()`, `detectSubs()` |
| `Bank SMS reader + CSV` | `parseSms()`, `smsMoney()`, `applyRule()`, `parseCsv()`, `detectCols()`, CSV export |
| `One-line entry` | `parseQuick()` ("15 shawarma lunch") |
| `Insights helpers` | `payeeBoard()`, `todSplit()` |
| `Built-in self-check` | `selfTestSms()` test cases, `runSelfTest()` |
| `Content:` | `CATS` (categories), roasts, `RELEASES` (version history), `MEALS` |
| `Icons & mascot` | `ic(name)` SVG icons, mascot faces |
| `White label` | `BR`, `brandify()`, `applyBrand()` |
| `Languages` | `LANGS`, `trText()`, `normKey()`, `dots()`, MutationObserver translator |
| `State` | `S` (all UI state), `migrate()`, `saveProfile()` |
| `Demo data` | `demoProfile()` |
| `Auth views` | Sign-in, create-account wizard |
| `Main views` | `renderMain()`, `renderToday/Activity/Insights/Money/Plan` |
| `Sheets` | `renderSheet()` router, `sheetFrame()`, every `sheetXxx()` bottom sheet |
| `Charts` | `drawCharts()` (Chart.js) |
| `Render & events` | `renderAll()`, the `ACT` click dispatcher, form handlers, `toast()` |
| `Boot` | Start-up order |

The translations table (`window.BASKAR_I18N_ROWS`) sits in its own `<script>` near the top. It has ~770 rows, one per line.

Tip: never read the whole file at once. Search for the function name or the visible English text you need, then read about 60 lines around it.

## Golden rules

1. **One file, no build.** Edit `index.html` directly. Don't add a bundler, framework or npm dependencies to the app.
2. **Escape everything.** HTML is built as strings. Wrap any user or bank text in `esc()`. Never put raw input into `innerHTML`.
3. **Data stays local.** Never add network calls that send user data anywhere. The only network requests are the pinned CDN libraries (cdnjs) and Google Fonts.
4. **Don't break saved data.** Profiles live in users' cookies. New fields need a default in `migrate()`. Never rename or remove an existing field without a migration.
5. **Write UI text in English, then translate it.** Add a row to `BASKAR_I18N_ROWS` for every new string. Keep user data (names, payees, amounts) out of translatable sentences: put it in its own element (see `dots()`).
6. **Every release updates the history.** Add an entry to `RELEASES` and to `CHANGELOG.md`, following the release playbook.
7. **Tests must pass.** Run `node tests/run-tests.js` before you commit. If you change parsing or budget maths, add a check.
8. **Mobile Safari first.** Use 16px or larger inputs so iOS doesn't zoom, tap targets of 44px or more, and no horizontal scroll at 375px. Test right-to-left in Arabic.
9. **Plain, short UI copy.** Use sentence case, say what happened and what to do, and avoid jargon. The playful "roast" lines are the only exception, and they must have a neutral version for when Roast mode is off.

## Test

```bash
npm install --no-save playwright && npx playwright install chromium   # once
node tests/run-tests.js
```

The same checks run on a phone from **Settings → Run self-check**. If a check fails, fix the code, not the test, unless the test itself is wrong.

## Deploy

Pushing to `main` publishes to GitHub Pages ("Deploy from a branch", root folder) within about a minute. There is no staging, so `main` is production. Users get the new version on their next load or by tapping Refresh. A "What's new" notice shows the top `RELEASES` entry once.

## Known sharp edges

- **Cookie size.** Each profile is compressed and split into cookies of about 3.6 KB each. Large accounts overflow to local storage automatically (`Store.set`). Don't store big blobs per transaction.
- **Safari evicts storage** after about 7 days without a visit. That's why the app nudges users to export CSV.
- **No password recovery.** Passwords are hashed locally; a lost password means deleting the account.
- **Variable shadowing.** Don't name a local variable `dots`, `money`, `esc` or `ic`; all four are global helpers. This has already caused one bug.
- **Re-renders replace the DOM.** Typing into an input that triggers `renderAll()` loses focus. For live input, update elements in place (see the SMS exchange-rate rows) instead of re-rendering.
- **iOS date inputs** ignore `width:100%` unless they have `appearance:none` and `min-width:0`. That's already in the CSS; keep it.
