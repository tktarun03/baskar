/* BasKar · js/features/storage-backup.js
   Settings → Storage and backup: JSON view, copy and import.
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

function sheetStorage() {
  var u = Store.usage('bk_p_' + S.pid, S.p);
  return sheetHead('Storage and backup') +
    '<section class="card"><div class="row between"><span class="label">Where your data lives</span>' + storageBadge() + '</div>' +
    '<dl class="stats"><div><dt>Account JSON</dt><dd>' + kb(u.raw) + '</dd></div><div><dt>Compressed</dt><dd>' + (u.comp ? kb(u.comp) : '—') + '</dd></div><div><dt>Cookie chunks</dt><dd>' + (u.chunks || '—') + '</dd></div><div><dt>Transactions</dt><dd>' + S.p.txns.length + '</dd></div></dl>' +
    '<p class="hint">' + (u.where === 'cookie' ? 'A cookie holds about 4 KB, so BasKar compresses this account’s JSON with lz-string and splits it across ' + plural(u.chunks, 'cookie') + '. All cookies on this site use ' + kb(u.cookieBytes) + '.' : u.where === 'local' ? (Store.mode === 'cookie' ? 'This account outgrew cookie space, so its JSON now lives in local storage.' : esc(Store.note)) : esc(Store.note)) + '</p>' +
    '<p class="hint">Safari can clear a website’s saved data after 7 days without a visit. Export a CSV now and then as a backup.</p>' +
    '<div class="row wrap"><button type="button" class="btn quiet sm" data-act="export-csv">Export CSV</button><button type="button" class="btn quiet sm" data-act="toggle-json">' + (S.showJson ? 'Hide JSON' : 'View JSON') + '</button><button type="button" class="btn quiet sm" data-act="copy-json">' + ic('copy', 16) + ' Copy JSON</button><button type="button" class="btn quiet sm" data-act="toggle-import">Import JSON</button></div>' +
    (S.showJson ? '<pre class="json" id="json-pre" tabindex="0">' + esc(JSON.stringify(S.p, null, 2)) + '</pre>' : '') +
    (S.showImport ? '<div class="field"><label for="imp">Paste a BasKar JSON export</label><textarea id="imp" class="input" rows="5" spellcheck="false"></textarea><p class="error" id="imp-err" role="alert" hidden></p><button type="button" class="btn sm" data-act="do-import">Replace this account’s data</button></div>' : '') +
    '</section>';
}

function doImport() {
  var ta = $('#imp'), err = $('#imp-err');
  try {
    var obj = JSON.parse(ta.value);
    if (!obj || !Array.isArray(obj.txns) || typeof obj.currency !== 'string') throw new Error('shape');
    S.p = migrate(obj); nfCache = {}; saveProfile(); S.plan = planFrom(S.p); S.showImport = false; applyTheme(); renderAll();
    toast('Imported', S.p.txns.length + ' transactions loaded into this account.');
  } catch (e) { err.textContent = 'That isn’t a BasKar export. It needs a currency and a txns list.'; err.hidden = false; }
}

/* Actions (data-act="…") for this feature. */
Object.assign(ACT, {
  storage: function () { S.showJson = false; S.showImport = false; openSub({ type: 'storage' }); },
  'toggle-json': function () { S.showJson = !S.showJson; renderAll(); },
  'copy-json': function () {
    var txt = JSON.stringify(S.p, null, 2);
    function fallback() { S.showJson = true; renderAll(); var pre = $('#json-pre'); if (pre) { var r = document.createRange(); r.selectNodeContents(pre); var sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); } toast('Copy isn’t allowed here', 'The JSON is selected below. Copy it with your keyboard or long-press.'); }
    try { navigator.clipboard.writeText(txt).then(function () { toast('JSON copied', kb(txt.length) + ' on your clipboard.'); }, fallback); } catch (e) { fallback(); }
  },
  'toggle-import': function () { S.showImport = !S.showImport; renderAll(); if (S.showImport) focusSoon('#imp'); },
  'do-import': function () { doImport(); }
});
