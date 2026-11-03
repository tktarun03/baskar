/* BasKar · js/app/boot.js
   Start-up. Loaded last.
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

Store.init();

BR = cleanBrand(Store.get('bk_brand'));

applyBrand();

(function () { var ls = Store.get('bk_lang'); LANG = ls && LANGS[ls.lang] ? ls.lang : detectLang(); applyLang(); })();

S.index = Store.get('bk_idx') || { v: 1, profiles: [] };

if (!Array.isArray(S.index.profiles)) S.index.profiles = [];

var sess = Store.get('bk_sess');

/* Reopen the last account. Its key is remembered for this tab (or this device, with "Stay unlocked"); otherwise the
   unlock screen asks for the password. Data saved before 2.0 is plain: ask once for the password to seal it. */
(function () {
  function done() { if (introDue()) S.intro = { i: 0 }; renderAll(); hideSplash(); }
  if (!(sess && sess.pid && meta(sess.pid))) { done(); return; }
  var pid = sess.pid, rec = Store.get('bk_p_' + pid), raw = vaultRecall(pid), inTab = '';
  try { inTab = sessionStorage.getItem('bk_k_' + pid) || ''; } catch (e) { }
  /* A key remembered on the device (not just this tab) plus a PIN: show the PIN screen first. */
  if (raw && !inTab && pinGet(pid)) { S.lock = { pid: pid, entry: '', err: '' }; done(); return; }
  (raw ? vaultImport(raw) : Promise.resolve(null)).then(function (kr) {
    if (rec && !isSealed(rec) && !kr && Vault.ok) {
      S.auth = { mode: 'signin', pick: pid, err: '', note: 'New: your data is now encrypted on this device. Enter your password once to lock it.' };
      return;
    }
    return openProfile(pid, kr).then(function (res) { if (res !== 'ok') S.auth = { mode: 'signin', pick: pid, err: '' }; });
  }).then(done, done);
})();

try { if (sessionStorage.getItem('bk_refreshed')) { sessionStorage.removeItem('bk_refreshed'); setTimeout(function () { toast('Refreshed', 'Version ' + APP_VERSION + '. Your data is still here.'); }, 300); } } catch (e) { }

/* Hook for tests/run-tests.js and the Settings self-check. */
window.BasKarTest = { norm: normKey, run: runAllChecks, parseSms: function (t) { return parseSms(t, {}, {}); }, parseQuick: function (t) { return parseQuick(t, {}); } };

/* After an update, say so once and offer the version history. */
try {
  var seenV = localStorage.getItem('bk_seen_v');
  if (seenV !== RELEASES[0].v) {
    localStorage.setItem('bk_seen_v', RELEASES[0].v);
    if (seenV) setTimeout(function () { toast('Updated to version ' + RELEASES[0].v, RELEASES[0].notes[0] + '.', { action: { label: 'What’s new', fn: function () { S.sheet = { type: 'history' }; renderSheet(); } } }); }, 400);
  }
} catch (e) { }

/* No pinch zoom. iOS Safari ignores user-scalable=no, so cancel its gesture events too. */
['gesturestart', 'gesturechange', 'gestureend'].forEach(function (t) { document.addEventListener(t, function (e) { e.preventDefault(); }, { passive: false }); });
document.addEventListener('touchmove', function (e) { if (e.touches && e.touches.length > 1) e.preventDefault(); }, { passive: false });

/* Face ID: find out once whether this browser can do it, then redraw if a screen offers it. */
passkeyCheck().then(function (ok) { if (ok && (S.lock || !S.p || (S.sheet && S.sheet.type === 'settings'))) renderAll(); });

/* Offline support: the service worker caches the app so it opens without signal (website only, not inside Claude). */
try {
  var swHost = location.protocol === 'https:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  if ('serviceWorker' in navigator && IS_TOP && swHost) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () { }); });
  }
} catch (e) { }
