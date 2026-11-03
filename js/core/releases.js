/* BasKar · js/core/releases.js
   Version history. Add a new entry at the top with every release (see .claude/skills/baskar-release).
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

/* Version history: add a new entry at the top with every release. */
var RELEASES = [
  { v: '2.3.1', date: '3 Nov 2026', notes: [
    'New browser-tab icon: the coin in your theme colour, or your own logo if you set one'
  ] },
  { v: '2.3', date: '3 Nov 2026', notes: [
    'Share from the app: tonight’s recap as a receipt image, your week, a goal, a payment, this cycle’s spending',
    'Share a backup or CSV straight to Files, WhatsApp or Mail',
    'Invite a friend from Settings → Share BasKar',
    'Shared text follows your language, and “Hide amounts” hides amounts in what you share'
  ] },
  { v: '2.2', date: '2 Nov 2026', notes: [
    'Profile: add a photo and edit your name and email (tap your name in Settings)',
    'Change password: your data is re-encrypted with the new one',
    'Theme colour for each account: Brass, Ocean, Forest, Rose, Grape, Saffron or Graphite',
    'Pinch and double-tap zoom are turned off so the app feels like a native one'
  ] },
  { v: '2.1', date: '2 Nov 2026', notes: [
    'Unlock with Face ID: your face opens your encrypted data, and your password still works (iOS 18.4 or later, on the website)',
    'PIN lock: with “Stay unlocked” on, a 4-digit PIN guards the app when you open it or come back after a minute'
  ] },
  { v: '2.0', date: '2 Nov 2026', notes: [
    'Your data is now encrypted with your password, so other pages on this web address can’t read it',
    'Works offline: once opened, the app loads and saves without signal',
    'Back up to a file, restore from it, and a reminder when you haven’t backed up for a week',
    'Export CSV now downloads a file on the website instead of showing text to copy',
    'Option to stay unlocked on this device, and a tip to add the app to your iPhone Home Screen'
  ] },
  { v: '1.9', date: '2 Nov 2026', notes: [
    'Faster, safer updates: the app is now split into one file per feature behind a small page',
    'After an update, your phone always loads the new files together, never a mix of old and new'
  ] },
  { v: '1.8', date: '2 Nov 2026', notes: [
    'A launch screen while the app loads, showing your own app name, logo and colour',
    'Translations moved to one easy-to-edit row per sentence',
    'Guide and playbooks in the repository so any AI assistant or developer can safely update the app'
  ] },
  { v: '1.7', date: '2 Nov 2026', notes: [
    'Arabic (right-to-left) and Tamil, picked in Settings or on the sign-in screen; it follows your phone’s language the first time',
    'Dates and currency names follow the chosen language; amounts keep Western digits so they match your bank',
    'Your own data (payee names, wallets, goals, remarks) is never translated',
    'Self-check adds language checks (140 checks)'
  ] },
  { v: '1.6', date: '2 Nov 2026', notes: [
    'One-line entry: type “15 shawarma lunch” or “karak 3 cash” and the form fills itself',
    'Sheet headers stay fixed while the content scrolls',
    'Insights: top payees this cycle and when in the day you spend',
    'Built-in self-check in Settings tests the bank-SMS reader, budget maths, one-line entry and CSV (128 checks)',
    'Fixed: SMS saying “from your account …” or “to your account …” now pick the shop as the payee'] },
  { v: '1.5', date: '2 Nov 2026', notes: [
    'Settings menu: tap your avatar to change the app name, logo, theme, data and account',
    'Version history, with a notice when a new version loads',
    'Quick adds: log a regular spend in one tap from Today',
    'Undo after deleting a transaction or adding from SMS or CSV',
    'Payee rules: fix a payee’s name or category once and it applies to past and future payments',
    'Weekly review: last 7 days vs the week before, top payees and one tip',
    'Bank SMS in another currency now asks for an exchange rate instead of logging the wrong amount'] },
  { v: '1.4', date: '2 Nov 2026', notes: [
    'Food spends are tagged Breakfast, Lunch or Dinner from the time',
    'Remarks on every spend and on each pasted SMS',
    'Refresh button to load the latest version',
    'Notices slide up from the bottom and have a close button'] },
  { v: '1.3', date: '2 Nov 2026', notes: [
    'Fixed forms shifting sideways on iPhone Safari',
    'Reads “Debit Card … was used for QAR …” bank messages',
    'Debit card messages go to your bank wallet'] },
  { v: '1.2', date: '2 Nov 2026', notes: [
    'Paste bank SMS to log spends',
    'Import and export CSV, including bank statements',
    'Published on GitHub Pages with Home Screen icons'] },
  { v: '1.1', date: '2 Nov 2026', notes: [
    'White-label branding: app name, logo, colour, mascot and catchphrase',
    'Minimalist redesign with a mobile-first layout and the tab bar fixed at the bottom',
    'Hide amounts, theme setting and quick re-add of recent payees'] },
  { v: '1.0', date: '27 Oct 2026', notes: [
    'Accounts on this device, any currency and multiple wallets',
    'Daily safe-to-spend that adjusts after each day',
    'Goals, streaks, category limits, subscriptions and a bills calendar'] }
];

var APP_VERSION = RELEASES[0].v + ' · ' + RELEASES[0].date;
