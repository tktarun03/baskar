/* BasKar · js/features/csv.js
   CSV import (map columns, preview) and export.
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

function csvCell(v) { v = v == null ? '' : String(v); if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }

function buildCsv() {
  var dig = digitsFor(S.p.currency), lines = ['Date,Type,Amount,Currency,Payee,Category,Wallet,Remarks,Meal'];
  function p(x) { return ('0' + x).slice(-2); }
  S.p.txns.slice().sort(function (a, b) { return a.ts - b.ts; }).forEach(function (t) {
    var d = new Date(t.ts);
    var date = d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
    var cat = t.kind === 'income' ? 'Income' : t.kind === 'save' ? 'Savings' : (CATS[t.cat] || CATS.other).label;
    var payee = t.kind === 'save' ? ((goalById(t.goal) || {}).name || t.merchant || '') : (t.merchant || '');
    lines.push([date, t.kind === 'save' ? 'saving' : t.kind, Number(t.amt).toFixed(dig), S.p.currency, payee, cat, t.kind === 'save' ? '' : walletName(t.wallet), remarkOf(t), t.meal && t.cat === 'food' ? MEALS[t.meal] || '' : ''].map(csvCell).join(','));
  });
  return '﻿' + lines.join('\r\n');
}

function exportCsv() {
  if (!S.p.txns.length) { toast('Nothing to export yet', 'Log a few spends first.'); return; }
  var csv = buildCsv(), slug = String(BR.name || 'budget').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'budget';
  var fn = slug + '-transactions-' + new Date().toISOString().slice(0, 10) + '.csv';
  function fallback(msg) { S.sheet = { type: 'csvout', csv: csv, msg: msg }; renderSheet(); }
  toast('Preparing your CSV', plural(S.p.txns.length, 'transaction') + '.');
  var get = (window.claude && typeof window.claude.use === 'function') ? window.claude.use('downloads') : Promise.resolve(null);
  Promise.resolve(get).then(function (dl) {
    if (!dl) { fallback('Saving files isn’t available in this view, so here is the CSV to copy.'); return; }
    return dl.save({ filename: fn, data: csv }).then(function (r) {
      toast(r && r.status === 'delivered' ? 'CSV sent' : 'CSV saved', fn);
    }, function (e) {
      var code = e && e.code;
      if (code === 'declined') return;
      if (code === 'rate_limited') { toast('A save prompt is already open', 'Finish that one first.'); return; }
      fallback('Saving the file didn’t work here, so here is the CSV to copy.');
    });
  }).catch(function () { fallback('Saving files isn’t available in this view, so here is the CSV to copy.'); });
}

function loadCsv(text) {
  var sh = S.sheet, res = parseCsv(text);
  if (res.headers.length < 2 || !res.rows.length) { var err = $('#csv-err'); if (err) { err.textContent = 'That doesn’t look like a CSV with a header row and data. Check the file and try again.'; err.hidden = false; } return; }
  var mp = detectCols(res.headers), neg = mp.amount && res.rows.some(function (r) { return parseAmt(r[mp.amount]) < 0; });
  var bw = S.p.wallets.filter(function (w) { return w.type === 'bank'; })[0] || S.p.wallets[0];
  S.sheet = { type: 'csv', step: 'map', headers: res.headers, rows: res.rows, map: mp, sign: neg ? 'signed' : 'spend', wallet: bw ? bw.id : '', keepDups: false, file: sh && sh.file };
  renderSheet(); var s = document.querySelector('.sheet-body'); if (s) s.scrollTop = 0;
}

function sheetCsv(sh) {
  if (sh.step !== 'map') {
    return sheetHead('Import CSV') +
      '<p class="hint">Use a statement downloaded from your bank’s website, or a file exported from BasKar. You map the columns and check the result before anything is added.</p>' +
      '<div><input id="csv-file" class="sr-only" type="file" accept=".csv,text/csv,text/plain"><label for="csv-file" class="btn block">Choose a CSV file</label></div>' +
      '<div class="field"><label for="csv-text">Or paste CSV text</label><textarea id="csv-text" class="input" rows="5" spellcheck="false" placeholder="Date,Payee,Amount&#10;2026-11-01,Swiggy,450"></textarea></div>' +
      '<p class="error" id="csv-err" role="alert" hidden></p>' +
      '<button type="button" class="btn ghost block" data-act="csv-read">Read pasted CSV</button>';
  }
  var mp = sh.map, res = csvItems(sh);
  function sel(key, label, req) {
    return '<div class="field"><label for="cm-' + key + '">' + label + '</label><select id="cm-' + key + '" class="input" data-csvmap="' + key + '">' + (req ? '' : '<option value="">Not in file</option>') +
      (req && !mp[key] ? '<option value="" selected>Pick a column</option>' : '') +
      sh.headers.map(function (h) { return '<option value="' + esc(h) + '"' + (mp[key] === h ? ' selected' : '') + '>' + esc(h) + '</option>'; }).join('') + '</select></div>';
  }
  var usesAmount = mp.amount && !mp.debit && !mp.credit && !mp.type;
  var preview = res.items.slice(0, 5).map(function (x) {
    var inc = x.kind === 'income', sv = x.kind === 'save', cat = inc ? INCOME_CAT : sv ? { short: 'Savings', color: 'var(--accent)' } : (CATS[x.cat] || CATS.other);
    return '<div class="txn" style="cursor:default"><span class="tile" style="--c:' + cat.color + '">' + ic(inc ? 'income' : sv ? 'target' : (CATS[x.cat] ? x.cat : 'other'), 18) + '</span><span class="grow"><strong>' + esc(x.merchant || cat.short) + '</strong><span class="hint">' + dots([cat.short, fmtDate(x.ts, { day: 'numeric', month: 'short', year: 'numeric' })]) + '</span></span><span class="amt' + (inc ? ' pos' : '') + '">' + (inc ? '+' : sv ? '→ ' : '−') + esc(money(x.amt, { show: true })) + '</span></div>';
  }).join('');
  return sheetHead('Match the columns') +
    '<p class="hint">' + plural(sh.rows.length, 'row') + ' found. We guessed which column is which. Fix anything that’s off.</p>' +
    '<div class="grid2">' + sel('date', 'Date', true) + sel('desc', 'Payee or description') + sel('amount', 'Amount') + sel('type', 'Type (in or out)') + sel('debit', 'Money out') + sel('credit', 'Money in') + sel('cat', 'Category') + sel('wallet', 'Wallet') + sel('note', 'Remarks') + sel('meal', 'Meal') + '</div>' +
    (usesAmount ? '<div class="field"><label for="cm-sign">How amounts work in this file</label><select id="cm-sign" class="input" data-csvsign="1"><option value="spend"' + (sh.sign === 'spend' ? ' selected' : '') + '>Every amount is a spend</option><option value="signed"' + (sh.sign === 'signed' ? ' selected' : '') + '>Minus means spend, plus means money in</option></select></div>' : '') +
    '<div class="field"><label for="cm-wallet">Add to wallet</label><select id="cm-wallet" class="input" data-csvwallet="1">' + S.p.wallets.map(function (w) { return '<option value="' + esc(w.id) + '"' + (sh.wallet === w.id ? ' selected' : '') + '>' + esc(w.name) + '</option>'; }).join('') + '</select>' + (mp.wallet ? '<span class="hint">Used for rows whose wallet name doesn’t match one of yours.</span>' : '') + '</div>' +
    '<div class="setrow"><div class="grow"><span class="label" id="cm-dup-lbl">Include possible duplicates</span><span class="hint">Rows with the same amount, day and payee as something you already logged.</span></div><button type="button" class="switch" role="switch" aria-labelledby="cm-dup-lbl" aria-checked="' + !!sh.keepDups + '" data-act="csv-dups"><span></span></button></div>' +
    '<section class="card tight"><div class="row between" style="padding:14px 0 4px"><span class="label">Preview</span><span class="hint">' + plural(res.items.length, 'ready') .replace('readys', 'ready') + (res.dups ? ' · ' + res.dups + ' duplicate' + (res.dups === 1 ? '' : 's') + (sh.keepDups ? ' included' : ' skipped') : '') + (res.bad ? ' · ' + res.bad + ' unreadable' : '') + '</span></div>' +
    (preview || '<p class="hint" style="padding:8px 0 14px">Nothing to import yet. Check the Date and Amount columns.</p>') + (res.items.length > 5 ? '<p class="hint" style="padding:6px 0 14px">…and ' + (res.items.length - 5) + ' more.</p>' : '') + '</section>' +
    (res.items.length > 150 && Store.mode === 'cookie' ? '<p class="notice">Big imports outgrow cookie space, so this account will move to local storage on this device.</p>' : '') +
    '<button type="button" class="btn block" data-act="csv-import"' + (res.items.length ? '' : ' disabled') + '>Import ' + plural(res.items.length, 'transaction') + '</button>' +
    '<button type="button" class="btn ghost block" data-act="csv-back">Choose another file</button>';
}

function sheetCsvOut(sh) {
  return sheetHead('Your CSV') + '<p class="hint">' + esc(sh.msg) + ' Paste it into a .csv file or straight into a spreadsheet.</p>' +
    '<div class="field"><label for="csv-out">CSV</label><textarea id="csv-out" class="input" rows="8" readonly spellcheck="false">' + esc(sh.csv.replace(/^﻿/, '')) + '</textarea></div>' +
    '<button type="button" class="btn block" data-act="copy-csv">' + ic('copy', 18) + ' Copy CSV</button>';
}

/* Actions (data-act="…") for this feature. */
Object.assign(ACT, {
  'open-csv': function () { S.sheet = { type: 'csv', step: 'pick' }; renderSheet(); },
  'csv-read': function () { loadCsv($('#csv-text').value); },
  'csv-back': function () { S.sheet = { type: 'csv', step: 'pick' }; renderSheet(); },
  'csv-dups': function () { S.sheet.keepDups = !S.sheet.keepDups; renderSheet(); },
  'csv-import': function () {
    var res = csvItems(S.sheet), skipped = res.dups && !S.sheet.keepDups ? res.dups : 0;
    if (!res.items.length) return;
    var added = addItems(res.items, 'csv');
    S.sheet = null; renderAll();
    toast('Imported ' + plural(res.items.length, 'transaction'), (skipped ? skipped + ' possible duplicate' + (skipped === 1 ? '' : 's') + ' skipped. ' : '') + 'Insights and streaks are updated.', { undo: undoAdd(added.ids, plural(res.items.length, 'imported transaction')) });
  },
  'export-csv': function () { exportCsv(); },
  'copy-csv': function () {
    var ta = $('#csv-out'), txt = S.sheet && S.sheet.csv ? S.sheet.csv.replace(/^﻿/, '') : '';
    function sel() { if (ta) { ta.focus(); ta.select(); } toast('Copy isn’t allowed here', 'The CSV is selected. Copy it with your keyboard or long-press.'); }
    try { navigator.clipboard.writeText(txt).then(function () { toast('CSV copied', plural(Math.max(0, txt.split('\n').length - 1), 'row') + ' on your clipboard.'); }, sel); } catch (e) { sel(); }
  }
});
