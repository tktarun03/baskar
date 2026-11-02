# Version history

The same list is in the app under **Settings → Version history**. Newest first.

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
