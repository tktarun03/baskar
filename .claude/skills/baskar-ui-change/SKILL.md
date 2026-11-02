---
name: baskar-ui-change
description: Add or change a BasKar screen, bottom sheet, setting, button, notice or chart while keeping its patterns (string-built HTML, data-act dispatcher, fixed sheet headers, toasts, RTL and translations). Use for any visible UI work.
---

# Change BasKar's UI

## Patterns to reuse

### Button or link

Give it `data-act="my-action"`, then add a handler to `ACT` (section `Render & events`):

```js
'my-action': function (el) { /* change S or S.p */ saveProfile(); renderAll(); toast('Done', 'What happened.'); },
```

Read extra data from `el.dataset`.

### Bottom sheet

1. Write `function sheetMine(sh) { return sheetHead('Title') + body; }`. `sheetHead` emits the `<!--/head-->` marker, so the title and close button stay fixed while the body scrolls.
2. Route it in `renderSheet()`: `else if (sh.type === 'mine') inner = sheetMine(sh);`
3. Open it from an action with `S.sheet = { type: 'mine' }; renderSheet();`.
4. A sub-page of Settings uses `openSub('mine')` and gets a back button (`back-settings`).

### Settings entry

Use `setItem(act, icon, label, value)` inside `sheetSettings()`.

### Tab content

Edit the matching `renderToday`, `renderActivity`, `renderInsights`, `renderMoney` or `renderPlan`. They receive `c = calc(S.p)`.

### Notice

`toast(title, body, { undo: fn })` or `{ action: { label, fn } }`.

- Title: a few words saying what happened.
- Body: the consequence or the next step.

### Building blocks

| Kind | Classes |
|---|---|
| Layout | `.card`, `.card.tight`, `.row`, `.grow`, `.stack`, `.duo` |
| Text | `.hint`, `.eyebrow`, `.label` |
| Buttons | `.btn`, `.btn.ghost`, `.btn.quiet`, `.btn.sm`, `.icon-btn` |
| Controls | `.seg`, `.chip`, `.switch`, `.input` |
| Pills | `.pillx.good/.bad/.info/.gold` |

### Icons

`ic('name', size)`. To add one, put an SVG path into `P`. Back and chevron icons get the class `mir` so they mirror in right-to-left.

### Charts

Charts go only in Insights, inside `drawCharts()`. Take colours from `cssVar('--…')` so dark mode works, and use `reverse` on the x axis when `LANGS[LANG].dir === 'rtl'`.

## Rules

- **Escape** all dynamic text with `esc()`. Use `dots([...])` for " · " lists that include user data.
- **Translate**: every new English string gets a row in `BASKAR_I18N_ROWS` (see the translate playbook). Keep names and amounts out of fixed sentences.
- **Right-to-left**:
  - Use logical CSS (`inset-inline-start`, `margin-inline-end`, `text-align: start`), not `left` and `right`.
  - Put amounts in `.num`, `.amt` or `.iso` so they stay readable left-to-right.
  - Check the screen in Arabic.
- **White label**: write "BasKar", "Chillar" and "Bas kar bhai." literally; `brandify()` swaps them.
- **Mobile**:
  - Tap targets of 44px or more, inputs at 16px or larger (iOS zooms below that).
  - Nothing wider than 375px.
  - The + button and toasts must not cover the main action. The tab bar stays at the bottom.
- **Roast mode**: any joke copy needs a plain version, used when `S.p.settings.roast` is false.
- **Accessibility**: icon-only buttons need an `aria-label`. Groups of toggles use `role="group"` and `aria-pressed`. Status changes use `toast` (it's `aria-live`).
- **State**:
  - New profile fields need a default in `migrate()`.
  - Call `saveProfile()` after changing `S.p`.
  - Device-wide settings go in their own `Store` key, like `bk_brand` or `bk_lang`.
- **Live inputs**: don't call `renderAll()` on every keystroke, because it resets focus. Update the affected elements in place instead.

## Check

1. Run `node tests/run-tests.js`.
2. Look at the change at 375×812 in English, Arabic and Tamil, in light and dark mode.
3. Ship with the release playbook.
