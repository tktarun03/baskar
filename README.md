# BasKar

A daily budget app: it turns your monthly income into one number, what you can safely spend today, and counts it down as you spend.

This is a single-page web app with no server. All data stays in the browser that opens it (compressed JSON in cookies, falling back to local storage).

## For developers and AI assistants

- `AGENTS.md`: how the code is organised, the rules, and how to test and ship. Start here.
- `docs/ARCHITECTURE.md`: how the app works inside.
- `.claude/skills/`: step-by-step playbooks for releasing, translating, adding bank formats and changing the UI.
- `ROADMAP.md`: what's next and why.

## Files

- `index.html` is the page; the app is in `css/app.css` and `js/` (one file per feature, plain scripts, no build step)
- `apple-touch-icon.png`, `icon-512.png` and `manifest.webmanifest` let you add it to an iPhone home screen

## Publish with GitHub Pages

1. In the repository, open **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**, pick the `main` branch and the `/ (root)` folder, then **Save**.
3. After a minute the site is live at `https://<your-username>.github.io/<repo-name>/`.

Pages from a private repository needs a paid GitHub plan (Pro, Team or Enterprise). On a free plan the repository must be public for Pages to work. A published Pages site is public to anyone with the link, even when the repository is private, unless you use GitHub Enterprise Cloud access control.

## Languages

English, Arabic (right-to-left) and Tamil. Pick one under **Settings → Language** or on the sign-in screen; the first visit follows the phone's language.

The interface is written in English. After each render, the app swaps every English text node for its translation from the table in `js/i18n-rows.js`. Keys are the English text with numbers replaced by `{0}`, `{1}` and names by `{*}`. To fix or add a translation, edit that object; English text with no entry stays in English. Payee names, wallets, goals and remarks are never translated. The translations were machine-written and need review by native speakers.

## Tests

The app has a built-in self-check covering the bank-SMS reader, the daily-budget maths, one-line entry, CSV parsing and the translation dictionaries. Run it on a phone from **Settings → Run self-check**, or from a computer:

```
npm install --no-save playwright && npx playwright install chromium
node tests/run-tests.js
```

The bank messages in the checks are examples written in common formats, not real messages. Add new formats to `selfTestSms()` in `js/core/selftest.js`.

## Version history

See `CHANGELOG.md`, or **Settings → Version history** in the app.

## Open-source libraries (loaded from cdnjs)

- js-cookie 3.0.5 (MIT)
- lz-string 1.5.0 (MIT)
- Chart.js 4.4.1 (MIT)
- PapaParse 5.4.1 (MIT)

Fonts: Hanken Grotesk, IBM Plex Mono, Noto Sans Arabic and Noto Sans Tamil from Google Fonts (SIL Open Font License).
