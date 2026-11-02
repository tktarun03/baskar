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

if (sess && sess.pid && meta(sess.pid)) loadProfile(sess.pid);

renderAll();

hideSplash();

try { if (sessionStorage.getItem('bk_refreshed')) { sessionStorage.removeItem('bk_refreshed'); setTimeout(function () { toast('Refreshed', 'Version ' + APP_VERSION + '. Your data is still here.'); }, 300); } } catch (e) { }

/* Hook for tests/run-tests.js and the Settings self-check. */
window.BasKarTest = { norm: normKey, run: runSelfTest, parseSms: function (t) { return parseSms(t, {}, {}); }, parseQuick: function (t) { return parseQuick(t, {}); } };

/* After an update, say so once and offer the version history. */
try {
  var seenV = localStorage.getItem('bk_seen_v');
  if (seenV !== RELEASES[0].v) {
    localStorage.setItem('bk_seen_v', RELEASES[0].v);
    if (seenV) setTimeout(function () { toast('Updated to version ' + RELEASES[0].v, RELEASES[0].notes[0] + '.', { action: { label: 'What’s new', fn: function () { S.sheet = { type: 'history' }; renderSheet(); } } }); }, 400);
  }
} catch (e) { }
