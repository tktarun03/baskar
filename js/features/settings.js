/* BasKar · js/features/settings.js
   Settings sheet: language, theme, privacy, roast mode, account.
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

function sheetSettings() {
  var m = meta() || {}, th = S.p.settings.theme || 'system', u = Store.usage('bk_p_' + S.pid, S.p), c = calc(S.p);
  var whereTxt = u.where === 'cookie' ? 'Cookies' : u.where === 'local' ? 'Local storage' : 'Not saved';
  return sheetHead('Settings') +
    '<section class="card"><button type="button" class="row prow-btn" data-act="profile-edit">' + avatar(m, 52) + '<span class="grow"><strong style="font-size:16px">' + esc(m.name) + '</strong><span class="hint">' + dots([m.email || 'No email', S.p.demo ? 'Example data' : '']) + '</span><span class="hint link">Edit profile</span></span>' + ic('chev', 18) + '</button>' +
    '<div class="duo"><button type="button" class="btn quiet" data-act="profiles">' + ic('users', 18) + ' Switch</button><button type="button" class="btn quiet" data-act="signout">' + ic('logout', 18) + ' Sign out</button></div></section>' +
    '<span class="eyebrow pad">App</span>' +
    '<section class="card tight">' + setItem('brand', 'pen', 'App name and branding', esc(BR.name) + (BR.logo ? ' · logo set' : '') + (BR.accent ? ' · custom colour' : '')) +
    '<div class="set-row stack-xs"><span class="label">Language</span>' + langSeg() + '</div>' +
    '<div class="set-row stack-xs"><span class="label">Colour</span>' + colourRow() + '</div>' +
    '<div class="set-row stack-xs"><span class="label">Theme</span><div class="seg three" role="group" aria-label="Theme">' + [['system', 'System'], ['light', 'Light'], ['dark', 'Dark']].map(function (x) { return '<button type="button" data-act="theme" data-k="' + x[0] + '" aria-pressed="' + (th === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div></div>' +
    '<div class="set-row setrow"><div class="grow"><span class="label" id="hide-lbl">Hide amounts</span><span class="hint">Masks every number. The eye at the top does the same.</span></div><button type="button" class="switch" role="switch" aria-labelledby="hide-lbl" aria-checked="' + hidden() + '" data-act="privacy"><span></span></button></div>' +
    '<div class="set-row setrow"><div class="grow"><span class="label" id="roast-lbl">Roast mode</span><span class="hint">Chillar comments on your spending. Off gives plain, neutral messages.</span></div><button type="button" class="switch" role="switch" aria-labelledby="roast-lbl" aria-checked="' + !!S.p.settings.roast + '" data-act="set-roast"><span></span></button></div></section>' +
    '<span class="eyebrow pad">Privacy</span>' +
    '<section class="card tight"><div class="set-row stack-xs"><span class="label">' + (Vault.key ? 'Encrypted with your password' : 'Not encrypted in this browser') + '</span><span class="hint">' + (Vault.key ? 'Saved data can only be read after unlocking. Without the password it can’t be recovered.' : 'This browser can’t encrypt here, so your data is saved as plain text.') + '</span></div>' +
    (Vault.key && Passkey.ok ? '<div class="set-row setrow"><div class="grow"><span class="label" id="bio-lbl"><span>Unlock with ' + esc(bioName()) + '</span></span><span class="hint">Uses a passkey on this device to open your encrypted data. Your password still works.</span></div><button type="button" class="switch" role="switch" aria-labelledby="bio-lbl" aria-checked="' + !!bioGet(S.pid) + '" data-act="bio-toggle"><span></span></button></div>' : '') +
    (Vault.key ? '<div class="set-row setrow"><div class="grow"><span class="label" id="keep-lbl">Stay unlocked on this device</span><span class="hint">Opens without your password. Less private: the key is then saved in this browser.</span></div><button type="button" class="switch" role="switch" aria-labelledby="keep-lbl" aria-checked="' + vaultStaysUnlocked(S.pid) + '" data-act="keep-unlocked"><span></span></button></div>' : '') +
    (Vault.key && vaultStaysUnlocked(S.pid) ? '<div class="set-row setrow"><div class="grow"><span class="label" id="pin-lbl">PIN lock</span><span class="hint">Asks for a 4-digit PIN when you open the app or come back after a minute. Stops someone using your phone; it doesn’t add encryption.</span></div><button type="button" class="switch" role="switch" aria-labelledby="pin-lbl" aria-checked="' + !!pinGet(S.pid) + '" data-act="pin-toggle"><span></span></button></div>' : '') + '</section>' +
    '<span class="eyebrow pad">Spending</span>' +
    '<section class="card tight">' + setItem('go-plan', 'sliders', 'Budget plan', esc(money(c.base)) + ' a day · income, fixed costs and limits') +
    setItem('tpl-manage', 'plus', 'Quick adds', plural(S.p.templates.length, 'saved spend')) +
    setItem('rules', 'repeat', 'Payee rules', plural(S.p.rules.length, 'rule')) + '</section>' +
    '<span class="eyebrow pad">Data</span>' +
    '<section class="card tight">' + setItem('open-sms', 'message', 'Paste bank SMS', 'Log spends from bank messages') +
    setItem('open-csv', 'upload', 'Import CSV', 'Bank statements or a BasKar export') +
    setItem('export-csv', 'income', 'Export CSV', plural(S.p.txns.length, 'transaction')) +
    setItem('backup', 'database', 'Back up now', lastBackupText()) +
    setItem('storage', 'database', 'Storage and backup', whereTxt + ' · ' + kb(u.raw)) + '</section>' +
    '<span class="eyebrow pad">About</span>' +
    '<section class="card tight">' + setItem('history', 'info', 'Version history', 'Version ' + esc(APP_VERSION)) +
    setItem('selftest', 'check', 'Run self-check', 'Tests the bank-SMS reader, budget maths, one-line entry and CSV') +
    setItem('refresh', 'refresh', 'Refresh app', 'Load the latest version. Your data stays.') + '</section>' +
    (S.p.demo ? '<button type="button" class="btn ghost block" data-act="reset-demo">Reset demo data</button>' : '') +
    '<button type="button" class="btn ghost block danger-text" data-act="acct-delete">' + (S.sheet.confirmDel ? 'Tap again to delete this account forever' : 'Delete this account') + '</button>';
}

/* Actions (data-act="…") for this feature. */
Object.assign(ACT, {
  privacy: function () {
    S.p.settings.hide = !S.p.settings.hide; saveProfile(); renderAll();
    toast(S.p.settings.hide ? 'Amounts hidden' : 'Amounts visible', S.p.settings.hide ? 'Tap the eye again to show them.' : '');
  },
  theme: function (el) { S.p.settings.theme = el.dataset.k; saveProfile(); applyTheme(); renderAll(); },
  settings: function () { S.sheet = { type: 'settings' }; renderSheet(); },
  lang: function (el) {
    var k = el.dataset.k; if (!LANGS[k] || k === LANG) return;
    LANG = k; Store.set('bk_lang', { lang: k }); applyLang(); renderAll(); if (S.tab === 'insights') drawCharts();
    toast(k === 'ar' ? 'تم تغيير اللغة إلى العربية' : k === 'ta' ? 'மொழி தமிழுக்கு மாற்றப்பட்டது' : 'Language set to English');
  },
  'back-settings': function () { if (S.sheet && S.sheet.type === 'brand') { S.brandDraft = null; applyBrand(); } S.showJson = false; S.showImport = false; S.sheet = { type: 'settings' }; renderSheet(); },
  'keep-unlocked': function () {
    var on = !vaultStaysUnlocked(S.pid);
    if (on) vaultRemember(S.pid, Vault.raw, true);
    else { vaultForget(S.pid, true); vaultRemember(S.pid, Vault.raw, false); pinClear(S.pid); }
    renderSheet();
    toast(on ? 'Stays unlocked' : 'Asks for your password', on ? 'This device opens your account without the password.' : 'You’ll unlock with your password each time you open the app.');
  },
  'set-roast': function () { S.p.settings.roast = !S.p.settings.roast; saveProfile(); renderAll(); },
  'acct-delete': function (el) {
    if (!S.sheet.confirmDel) { S.sheet.confirmDel = true; el.textContent = 'Tap again to delete this account forever'; return; }
    var id = S.pid; signOut(true); deleteProfile(id); renderAll(); toast('Account deleted', 'Its data was removed from this browser.');
  },
  more: function () { S.actLimit += 60; $('#act-list').innerHTML = activityList(); }
});
