/* BasKar · js/features/quick-unlock.js
   Quick ways back in: Face ID (see js/core/passkey.js) and a 4-digit PIN screen lock.
   The PIN only exists together with "Stay unlocked on this device". It stops someone who picks up the phone;
   it adds no encryption (a 4-digit code can't protect data a page can copy). 5 wrong tries → password needed.
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

var PIN_LEN = 4, PIN_TRIES = 5, PIN_AFTER = 60 * 1000;

function pinGet(pid) { try { var r = JSON.parse(localStorage.getItem('bk_pin_' + pid) || 'null'); return r && r.hash ? r : null; } catch (e) { return null; } }
function pinPut(pid, r) { try { localStorage.setItem('bk_pin_' + pid, JSON.stringify(r)); } catch (e) { } }
function pinClear(pid) { try { localStorage.removeItem('bk_pin_' + pid); } catch (e) { } }

function pinDots(n, bad) {
  var h = '<div class="pin-dots' + (bad ? ' bad' : '') + '" aria-hidden="true">';
  for (var i = 0; i < PIN_LEN; i++) h += '<i class="' + (i < n ? 'on' : '') + '"></i>';
  return h + '</div>';
}
function pinPad(extra) {
  var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', extra || '', '0', 'del'];
  return '<div class="pin-pad" role="group" aria-label="PIN keypad" data-noi18n>' + keys.map(function (k) {
    if (!k) return '<span></span>';
    if (k === 'del') return '<button type="button" class="pin-key ghost" data-act="pin-del" aria-label="Delete">' + ic('back', 22) + '</button>';
    if (k === 'bio') return '<button type="button" class="pin-key ghost" data-act="bio-unlock" aria-label="Unlock with ' + esc(bioName()) + '">' + ic('face', 26) + '</button>';
    return '<button type="button" class="pin-key" data-act="pin-key" data-k="' + k + '">' + k + '</button>';
  }).join('') + '</div>';
}

/* The lock screen (cold open with a remembered key, or back after a minute away). */
function renderPinLock() {
  var L = S.lock, m = meta(L.pid) || {};
  return '<section class="pin-wrap">' + avatar(m, 64) + '<h1 class="h3">' + esc(m.name || '') + '</h1>' +
    '<p class="hint" id="pin-msg">' + (L.err ? '<span class="error">' + esc(L.err) + '</span>' : 'Enter your PIN') + '</p>' +
    pinDots(L.entry.length, !!L.err) + pinPad(Passkey.ok && bioGet(L.pid) ? 'bio' : '') +
    '<button type="button" class="btn-link" data-act="pin-password">Use password instead</button></section>';
}

/* Setting a PIN (sheet): enter, then confirm. */
function sheetPinSetup(sh) {
  return sheetHead(sh.step === 2 ? 'Confirm your PIN' : 'Choose a PIN') +
    '<section class="pin-wrap in-sheet"><p class="hint">' + (sh.err ? '<span class="error">' + esc(sh.err) + '</span>' : sh.step === 2 ? 'Enter the same 4 digits again.' : 'Asked when you open the app, and after a minute away.') + '</p>' +
    pinDots(sh.entry.length, !!sh.err) + pinPad('') + '</section>' +
    '<p class="fine">A PIN stops someone using your phone. It doesn’t add encryption: your data stays readable on this device while “Stay unlocked” is on.</p>';
}

function pinEntered(target) {
  if (target.entry.length < PIN_LEN) return;
  var pin = target.entry;
  if (S.sheet && S.sheet.type === 'pin-setup' && target === S.sheet) {
    var sh = S.sheet;
    if (sh.step === 1) { sh.first = pin; sh.entry = ''; sh.step = 2; sh.err = ''; renderSheet(); return; }
    if (pin !== sh.first) { sh.step = 1; sh.first = ''; sh.entry = ''; sh.err = 'Those didn’t match. Choose a PIN again.'; renderSheet(); return; }
    var salt = uid();
    hashPw(pin, 'pin:' + salt).then(function (hash) {
      pinPut(S.pid, { salt: salt, hash: hash, fails: 0 });
      S.sheet = { type: 'settings' }; renderSheet(); toast('PIN set', 'You’ll enter it when you open the app.');
    });
    return;
  }
  var L = S.lock, rec = pinGet(L.pid);
  if (!rec) { lockToPassword(L.pid, ''); return; }
  hashPw(pin, 'pin:' + rec.salt).then(function (hash) {
    if (hash === rec.hash) {
      rec.fails = 0; pinPut(L.pid, rec);
      if (S.p && S.pid === L.pid) { S.lock = null; renderAll(); return; }
      var raw = ''; try { raw = localStorage.getItem('bk_k_' + L.pid) || ''; } catch (e) { }
      vaultImport(raw).then(function (kr) { if (!kr) { lockToPassword(L.pid, ''); return; } finishUnlock(L.pid, kr); });
      return;
    }
    rec.fails = (rec.fails || 0) + 1; pinPut(L.pid, rec);
    if (rec.fails >= PIN_TRIES) {
      pinClear(L.pid); vaultForget(L.pid, true);
      lockToPassword(L.pid, 'Too many wrong PINs. Enter your password. “Stay unlocked” has been turned off.');
      return;
    }
    L.entry = ''; L.err = 'Wrong PIN. ' + (PIN_TRIES - rec.fails) + (PIN_TRIES - rec.fails === 1 ? ' try left.' : ' tries left.'); renderAll();
  });
}

/* Leave the PIN screen for the password screen. The device key is kept unless it was wiped above. */
function lockToPassword(pid, err) {
  charts.forEach(function (c) { try { c.destroy(); } catch (e) { } }); charts = [];
  vaultForget(pid, false);
  S.lock = null; S.pid = null; S.p = null; S.sheet = null; S.plan = null; Vault.key = null; Vault.raw = ''; nfCache = {};
  S.auth = { mode: 'signin', pick: pid, err: err || '' }; applyTheme(); renderAll(); focusSoon('#si-pw');
}

function bioUnlock() {
  var pid = S.lock ? S.lock.pid : S.auth.pick;
  if (!pid) return;
  if (S.p && S.lock) {
    // Coming back to an open account: Face ID just has to succeed.
    passkeyUnlock(pid).then(function (kr) { if (kr && kr.key) { S.lock = null; renderAll(); } else if (kr !== 'cancelled') toast(bioTitle() + ' didn’t work', 'Use your PIN or password.'); });
    return;
  }
  S.auth.busy = true; renderAll();
  passkeyUnlock(pid).then(function (kr) {
    S.auth.busy = false;
    if (kr && kr.key) { finishUnlock(pid, kr); return; }
    renderAll();
    if (kr !== 'cancelled') toast(bioTitle() + ' didn’t work', 'Use your password this time.');
  });
}

/* Lock again after a minute in the background, if a PIN is set. */
document.addEventListener('visibilitychange', function () {
  if (document.hidden) { S.hiddenAt = Date.now(); return; }
  if (S.p && !S.lock && pinGet(S.pid) && S.hiddenAt && Date.now() - S.hiddenAt > PIN_AFTER) { S.lock = { pid: S.pid, entry: '', err: '' }; renderAll(); }
});

/* Actions (data-act="…") for this feature. */
Object.assign(ACT, {
  'pin-key': function (el) {
    var t = S.lock || (S.sheet && S.sheet.type === 'pin-setup' ? S.sheet : null); if (!t || t.entry.length >= PIN_LEN) return;
    t.entry += el.dataset.k; t.err = '';
    if (S.lock) renderAll(); else renderSheet();
    if (t.entry.length === PIN_LEN) setTimeout(function () { pinEntered(t); }, 120);
  },
  'pin-del': function () {
    var t = S.lock || (S.sheet && S.sheet.type === 'pin-setup' ? S.sheet : null); if (!t) return;
    t.entry = t.entry.slice(0, -1); if (S.lock) renderAll(); else renderSheet();
  },
  'pin-password': function () { lockToPassword(S.lock.pid, ''); },
  'pin-toggle': function () {
    if (pinGet(S.pid)) { pinClear(S.pid); renderSheet(); toast('PIN removed', 'The app opens without a PIN on this device.'); return; }
    S.sheet = { type: 'pin-setup', step: 1, entry: '', first: '', err: '' }; renderSheet();
  },
  'bio-unlock': function () { bioUnlock(); },
  'bio-toggle': function () {
    if (bioGet(S.pid)) { bioClear(S.pid); renderSheet(); toast(bioTitle() + ' turned off', 'You can also delete the passkey in the Passwords app.'); return; }
    passkeyEnable(S.pid, meta() || {}, Vault.raw).then(function (r) {
      if (r === 'ok') { renderSheet(); toast(bioTitle() + ' is on', 'Next time, unlock with ' + bioName() + '. Your password still works.'); }
      else if (r === 'finish') toast('One more step', 'Tap Finish to connect ' + bioName() + '.', { action: { label: 'Finish', fn: function () { passkeyFinish().then(function (r2) { renderSheet(); toast(r2 === 'ok' ? bioTitle() + ' is on' : 'Couldn’t turn it on', r2 === 'ok' ? 'Your password still works.' : 'This device can’t unlock the app this way.'); }); } } });
      else if (r === 'unsupported') toast('Not available here', 'This device can’t unlock the app this way. You can delete the new passkey in the Passwords app.');
      else if (r !== 'cancelled') toast('Couldn’t turn it on', 'Try again in a moment.');
    });
  }
});
