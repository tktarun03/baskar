---
name: baskar-translate
description: Add or fix BasKar translations (Arabic, Tamil) or add a new language. Use whenever UI text is added or changed, when a screen shows English in another language, or when a translation needs correcting.
---

# Translate BasKar

## How it works (one minute)

- The UI is written in English. After every render, a MutationObserver swaps each English text node, and the `placeholder`, `aria-label`, `title` and `alt` attributes, for its translation.
- The table is `window.BASKAR_I18N_ROWS` near the top of `index.html`. It has one row per string: `[English, Arabic, Tamil]`, sorted A–Z.
- In the English key:
  - Numbers and amounts become `{0}`, `{1}`… in order: "₹1,250", "QAR 15.50", "80%", "3".
  - A name or category becomes `{*}`. Use this only when a node mixes fixed text with a name you can't split out.
- At lookup, `{0}` is refilled with the real value. `{*}` is filled with the captured text, and that text is translated too if it is itself a key (for example, a category name).
- No row means the text stays in English. Nothing breaks.

## Add or fix a string

1. Find the exact English text as rendered. Copy it from the code, keeping curly quotes `’ “ ”` and the ` · ` separators.
2. Replace every number or amount with `{0}`, `{1}`… in order of appearance.
3. Add the row in A–Z position (case-insensitive), or edit the existing row:
   ```js
   ["Safe to spend today: {0}.", "المبلغ الآمن للإنفاق اليوم: {0}.", "இன்று பாதுகாப்பாகச் செலவழிக்கக்கூடியது: {0}."],
   ```
4. Every placeholder in the English must appear in each translation. Arabic singular forms may drop `{0}` when the count is spelled out ("دفعة واحدة").
5. Keep these exactly as they are in every language:
   - **BasKar**, **Chillar** and **Bas kar bhai.** (white-label replaces them later)
   - **CSV**, **JSON**, **SMS**, **OTP**, **UPI**, currency codes, and example inputs such as “15 shawarma lunch”.
6. In Arabic, write quotes as “ ”. They are converted to « » at load.

## When the text has user data in it

A key can't match if a sentence contains a payee, wallet or goal name, unless you use `{*}`. Prefer splitting the sentence in the render code:

```js
// Bad: one text node with a name inside
'<span class="hint">' + esc(cat.short + ' · ' + walletName(t.wallet)) + '</span>'
// Good: each part is its own node; the fixed parts translate and the names stay as typed
'<span class="hint">' + dots([cat.short, walletName(t.wallet)]) + '</span>'
```

For whole sentences, put each sentence in its own `<span>`. Mark user-entered or developer-only blocks with `data-noi18n`.

## Plurals

`plural(n, 'day')` produces "1 day" or "3 days", so add both keys: `{0} day` and `{0} days`. Arabic has more plural forms than this. Use the 3–10 form ("أيام") for the plural row. Native review is still pending for these rows.

## Find what's missing

Switch the app to Arabic or Tamil, open the screen, and look for English. To list them all automatically, crawl the app in Playwright with the language set. Collect text nodes outside `[data-noi18n]` that still contain `[A-Za-z]`, and ignore user data, brand names and CSV/JSON.

## Add a new language (e.g. Hindi `hi`, Malayalam `ml`, Urdu `ur`)

1. In `LANGS` (the `Languages` section), add `{ name: 'हिन्दी', dir: 'ltr', locale: 'hi-IN' }`. Urdu uses `dir: 'rtl'` and `locale: 'ur-u-nu-latn'`.
2. Make rows 4 columns wide, `[English, Arabic, Tamil, Hindi]`. Update the loader block under the table and the self-check `Languages` group to read column 4.
3. Add the language to `langSeg()` (the picker), using class `four` or a `<select>` if there are more than 3 options. Also add it to `detectLang()`.
4. Load a Google Noto font for the script in the `<link>` near the top, and add any `:lang(xx)` CSS (line height, letter-spacing reset).
5. Translate every row. Run the tests, then follow the release playbook.

## Check

`node tests/run-tests.js` runs the `Languages` checks:

- every row has all columns
- no duplicate English keys
- `{*}` counts match
- amounts and names carry over
- unknown text stays as typed
