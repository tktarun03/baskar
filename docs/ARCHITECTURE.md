# BasKar architecture

How the app works inside. Read `AGENTS.md` first for the repo map and rules. Everything described here lives in `index.html`.

## Start-up order (`Boot` section)

0. The launch screen (`#splash`) paints at once. A small inline script fills in this device's app name, logo and colour from `localStorage.bk_splash`, before the CDN libraries load. It removes itself after 8 s even if start-up fails.
1. `Store.init()` picks the storage mode: cookies, then local storage, then memory.
2. `applyBrand()` loads white-label settings from `bk_brand`.
3. The language comes from `bk_lang`, or from the phone language on the first visit. `applyLang()` sets `<html lang dir>`.
4. The session (`bk_sess`) reopens the last profile, or the sign-in screen appears.
5. `renderAll()` draws the page, then `hideSplash()` fades the launch screen. It waits at least 400 ms from page start so the screen doesn't flash, and at most 1.2 s for fonts. If `localStorage.bk_seen_v` differs from `APP_VERSION`, a "What's new" notice shows.

## State

All UI state is one object, `S`:

| Field | Meaning |
|---|---|
| `S.index` | List of profiles on this device (`bk_idx`): id, name, email, password hash, demo flag |
| `S.pid`, `S.p` | Signed-in profile id and its data |
| `S.tab` | `today`, `activity`, `insights`, `money` or `plan` |
| `S.sheet` | The open bottom sheet, e.g. `{ type: 'txn', id }`; `null` when closed |
| `S.plan`, `S.draft`, `S.auth` | Unsaved form state for Plan, account creation and sign-in |
| `S.filter` | Activity filters |

## Profile data (`S.p`, saved as `bk_p_<id>`)

```js
{
  v: 3, currency: 'QAR', income: 12000, cycleStart: 25,      // the pay cycle starts on this day of the month (1–28)
  fixed:   [{ id, label, amount, day }],                     // rent, loans, subscriptions: set aside first; day = due day
  wallets: [{ id, name, type: 'bank'|'card'|'cash'|'wallet', opening }],
  txns:    [{ id, ts, kind: 'expense'|'income'|'save', amt, cat, merchant, wallet, note, meal, goal, orig: { amt, cur } }],
  caps:    [{ cat, amount }],                                // limits per category per cycle
  goals:   [{ id, name, target, createdAt }],                // savings are txns with kind 'save' and a goal id
  rules:   [{ match, from, name, cat }],                     // payee rules: rename and set the category
  templates: [{ id, merchant, amt, cat, wallet }],           // quick adds, max 8
  fx: { INR: 0.044 },                                        // remembered exchange rates for SMS in other currencies
  dismissedSubs: [], createdAt, demo,
  settings: { roast: true, hide: false, theme: 'system' }
}
```

`migrate()` fills in defaults for every field. When you add a field, add its default there.

Category keys (`CATS`) are `food`, `groceries`, `shopping`, `transport`, `coffee`, `fun`, `health`, `travel`, `other` and `bills`. `bills` counts as a fixed cost, not against the daily budget.

## Budget maths (`calc()`)

```
disc        = max(income − Σ fixed, 0)                    money for the cycle
base        = disc / days in cycle                        the "normal" daily budget
before      = Σ spends + goal savings this cycle, before today (bills excluded)
todayBudget = max(disc − before, 0) / days left (including today)
left        = todayBudget − (spent today + saved today)
tomorrow    = max(disc − before − used today, 0) / (days left − 1)
```

Overspending spreads itself over the remaining days automatically. Money moved to a goal counts as used, so it can't be spent twice. The self-check has fixed examples for these formulas; keep them passing.

## Rendering

- The app builds plain HTML strings and has no framework. `renderAll()` rebuilds `#app` as the scroller (`renderMain()` or an auth view), the tab bar and the + button.
- `renderSheet()` routes `S.sheet.type` to a `sheetXxx()` function. `sheetFrame()` splits the output at `<!--/head-->` into a fixed header (`.sheet-top`) and a scrolling body (`.sheet-body`).
- Clicks go through one delegated listener. Elements carry `data-act="name"`, and `ACT[name](el)` handles them. Forms submit through their own handlers in the same section.
- `toast(title, body, { undo | action })` shows the bottom notice. Undo uses `undoAdd()` or `undoDelete()`.
- Charts (Chart.js) are drawn only on the Insights tab by `drawCharts()`, and destroyed on other tabs.
- Icons are inline SVG from `ic(name, size)`. Back and chevron icons get the class `mir`, which mirrors them in right-to-left.

## Storage (`Store`)

- `Store.set(key, obj)`: `JSON.stringify` → `LZString.compressToEncodedURIComponent` → chunks of 3,600 characters → cookies `key_0…key_n` plus `key_n` (the count). The limit is 45 chunks; past that, or if cookies are refused, the value goes to local storage.
- At the top level (GitHub Pages) cookies are first-party: `SameSite=Lax`, with the path scoped to the app folder. When embedded in an iframe they are `SameSite=None; Secure; Partitioned`.
- Device-wide keys: `bk_idx`, `bk_sess`, `bk_brand`, `bk_lang`. Per profile: `bk_p_<id>`. Local storage only: `bk_seen_v`, and `bk_splash` (a plain copy of the brand for the launch screen, written by `applyBrand()`).

## Bank SMS and CSV

- `parseSms(text)` normalizes whitespace and skips OTPs and promos (`SMS_SKIP`). It then reads the amount and currency (`smsMoney`), decides debit or credit (`SMS_DEBIT` / `SMS_CREDIT`, whichever comes first), and gets the payee from "at / to / VPA / Info" patterns. It also reads the date and time, guesses the category (`guessCat`), the meal from the time, and the wallet from the last four card digits found in wallet names. Payee rules (`applyRule`) apply last.
- If the SMS currency differs from the account's, the user enters an exchange rate. It's saved in `fx`, and the original amount stays in `txn.orig`.
- `parseCsv()` uses PapaParse and finds the header row below any junk lines. `detectCols()` guesses the date, description, debit, credit and amount columns. The user confirms the column mapping before import. Possible duplicates (same amount, day and payee) are unticked by default.

## Translation (i18n)

- The UI is written in English. A `MutationObserver` on `document.body` passes every new text node, plus the `placeholder`, `aria-label`, `title` and `alt` attributes, through `trText()`.
- `trText()` swaps the white-label names back to the defaults. It then normalizes numbers and amounts to `{0}`, `{1}` (`NUM_RE`), looks up `BASKAR_I18N[lang][key]`, and falls back to wildcard keys with `{*}` for names. Finally it refills the numbers. In Arabic, numbers are wrapped in direction isolates so amounts like ₹1,250 don't reverse.
- Skipped: elements with `data-noi18n`, `<pre>` and `<textarea>`.
- **Consequence:** a sentence that mixes fixed text with user data must be split into separate elements, or the key never matches. Use `dots([a, b, c])`, which joins the parts with " · ", each in its own `<span>`.
- Dates use `toLocaleDateString(LOC())`: `ar-u-nu-latn` (Arabic with 0–9 digits) or `ta-IN`. Currency names come from `Intl.DisplayNames`.

## White label

`BR` holds the app name, logo (a data URL, shrunk to fit in a cookie), accent colour, mascot name and catchphrase. These are stored per device in `bk_brand`. `brandify(html)` replaces "BasKar", "Chillar" and "Bas kar bhai." in rendered output. Write the default names in code and let `brandify` swap them.

## Libraries (pinned, from cdnjs)

| Library | Version | Used for |
|---|---|---|
| js-cookie | 3.0.5 | Cookies |
| lz-string | 1.5.0 | Compression |
| Chart.js | 4.4.1 | Insights charts |
| PapaParse | 5.4.1 | CSV |

Fonts come from Google Fonts: Hanken Grotesk, IBM Plex Mono, Noto Sans Arabic and Noto Sans Tamil. If a CDN is down, the app still runs: storage falls back to local storage and charts are skipped.
