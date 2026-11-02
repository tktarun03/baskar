---
name: baskar-bank-formats
description: Teach BasKar to read a new bank SMS format or CSV bank statement, or fix one it reads wrongly. Use when a user pastes a message or statement that is skipped, gets the wrong amount, payee, date, category or wallet.
---

# Add or fix a bank SMS or statement format

Always start with a failing self-check case, then change the parser until everything passes. The parser is shared by every bank, so a fix for one format must not break the others.

## Bank SMS

### 1. Make the sample safe

Copy the user's message and replace anything personal:

- card or account digits → `4821`
- names → generic shops
- reference numbers → anything plausible

Keep the exact wording, spacing, line breaks, capitalization and date format. Those are what the parser reads.

### 2. Add a test case

Open `js/core/selftest.js`, find `function selfTestSms()` and add an object to the returned array:

```js
{ name: 'QNB debit card, Arabic month', acct: 'QAR',
  sms: 'Debit Card **4821 \nwas used for QAR 15.00\nat SALUTARY FOOD TRADIN\nat 07:34\n' + D.ddmon,
  want: { kind: 'expense', amt: 15, cur: '', merchant: 'Salutary Food Tradin', cat: 'food', wallet: 'bank', day: 'y', hm: '07:34', meal: 'breakfast' } },
```

- **Dates:** always build them from `D.*` (dates relative to yesterday) so the test keeps passing over time. Formats on offer:
  - `ddmmyy`, `ddmon`, `DDMON4`, `slash4`, `slash2`, `iso`
  - Add a new one to `D` if your bank uses another format.
- **`want` fields:** include only what you want to check.
  - `kind` (`expense`/`income`), `amt`, `cur` (`''` when it matches the account, else the code), `merchant`, `cat`, `wallet`, `day: 'y'` (yesterday), `hm`, `meal`.
  - Use `ok: false` for messages that must be skipped (OTPs, promos, failed payments).

### 3. Run the tests and watch your case fail

```bash
node tests/run-tests.js
```

### 4. Fix the parser (`js/core/parse.js`)

| Problem | Where to look |
|---|---|
| Message skipped as OTP or promo | `SMS_SKIP` |
| Wrong in or out | `SMS_DEBIT`, `SMS_CREDIT`. The earliest match wins. |
| Wrong amount or currency | `smsMoney()`: it prefers the amount next to the debit or credit verb over "Avl bal" or "limit" amounts |
| Wrong payee | the payee patterns in `parseSms()`, `PSP` (UPI handle suffixes to drop), `NOT_NAME` (words that are never a payee), and the "your account" skip regex |
| Wrong date or time | the date block in `parseSms()`. Add the format and keep day-first as the default. |
| Wrong category | `guessCat()` keyword map |
| Wrong wallet | wallet matching uses the last 4 digits found in wallet names, and debit card messages go to a bank wallet |

Keep regexes case-insensitive and tolerant of extra spaces; `parseSms` collapses whitespace first.

### 5. Re-run the tests

Every check must pass, not just yours.

## CSV statements

- `parseCsv()` finds the header row below junk lines, and `detectCols()` guesses the columns from header names.
- If a bank uses a new header name (e.g. "Txn Particulars", "Dr Amount"), add it to the matching list in `detectCols()`.
- Add a test with a minimal CSV next to the existing `CSV` checks in `runSelfTest()`: three or four lines, anonymized.

## Formats known to be unsupported

- **Arabic-language SMS** (Gulf banks often send Arabic and English versions). This needs Arabic debit/credit words, Arabic-Indic digits (٠–٩ → 0–9) and Arabic month names. It's on the roadmap.
- PDF statements. These need a PDF library; ask the owner before adding a dependency.

## Then

Release it with `.claude/skills/baskar-release/SKILL.md`. The note can be: "Reads <Bank> “…” messages".
