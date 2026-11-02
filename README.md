# BasKar

A daily budget app: it turns your monthly income into one number, what you can safely spend today, and counts it down as you spend.

This is a single-page web app with no server. All data stays in the browser that opens it (compressed JSON in cookies, falling back to local storage).

## Files

- `index.html` is the whole app
- `apple-touch-icon.png`, `icon-512.png` and `manifest.webmanifest` let you add it to an iPhone home screen

## Publish with GitHub Pages

1. In the repository, open **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**, pick the `main` branch and the `/ (root)` folder, then **Save**.
3. After a minute the site is live at `https://<your-username>.github.io/<repo-name>/`.

Pages from a private repository needs a paid GitHub plan (Pro, Team or Enterprise). On a free plan the repository must be public for Pages to work. A published Pages site is public to anyone with the link, even when the repository is private, unless you use GitHub Enterprise Cloud access control.

## Tests

The app has a built-in self-check covering the bank-SMS reader, the daily-budget maths, one-line entry and CSV parsing. Run it on a phone from **Settings → Run self-check**, or from a computer:

```
npm install --no-save playwright && npx playwright install chromium
node tests/run-tests.js
```

The bank messages in the checks are examples written in common formats, not real messages. Add new formats to `selfTestSms()` in `index.html`.

## Version history

See `CHANGELOG.md`, or **Settings → Version history** in the app.

## Open-source libraries (loaded from cdnjs)

- js-cookie 3.0.5 (MIT)
- lz-string 1.5.0 (MIT)
- Chart.js 4.4.1 (MIT)
- PapaParse 5.4.1 (MIT)

Fonts: Hanken Grotesk and IBM Plex Mono from Google Fonts (SIL Open Font License).
