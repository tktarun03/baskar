/* BasKar · js/features/activity.js
   Activity tab: transaction list and filters.
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

function txnRow(t) {
  if (t.kind === 'save') {
    var g = goalById(t.goal);
    return '<button type="button" class="txn" data-act="edit-txn" data-id="' + esc(t.id) + '"><span class="tile" style="--c:var(--accent)">' + ic('target', 18) + '</span>' +
      '<span class="grow"><strong>To ' + esc(g ? g.name : 'a deleted goal') + '</strong><span class="hint">' + dots(['Saved', fmtTime(t.ts)]) + '</span></span>' +
      '<span class="amt save">→ ' + esc(money(t.amt)) + '</span></button>';
  }
  var inc = t.kind === 'income', cat = inc ? INCOME_CAT : (CATS[t.cat] || CATS.other);
  return '<button type="button" class="txn" data-act="edit-txn" data-id="' + esc(t.id) + '"><span class="tile" style="--c:' + cat.color + '">' + ic(inc ? 'income' : (CATS[t.cat] ? t.cat : 'other'), 18) + '</span>' +
    '<span class="grow"><strong>' + esc(t.merchant || cat.short) + '</strong><span class="hint">' + dots([cat.short, t.cat === 'food' && MEALS[t.meal] ? MEALS[t.meal] : '', fmtTime(t.ts), walletName(t.wallet), t.orig ? money(t.orig.amt, { cur: t.orig.cur }) : '']) + '</span>' +
    (remarkOf(t) ? '<span class="remark">“' + esc(remarkOf(t)) + '”</span>' : '') + '</span>' +
    '<span class="amt' + (inc ? ' pos' : '') + '">' + (inc ? '+' : '−') + esc(money(t.amt)) + '</span></button>';
}

function renderActivity() {
  var f = S.filter;
  var wopts = '<option value="all">All wallets</option>' + S.p.wallets.map(function (w) { return '<option value="' + esc(w.id) + '"' + (f.acct === w.id ? ' selected' : '') + '>' + esc(w.name) + '</option>'; }).join('');
  var copts = '<option value="all">All categories</option><option value="income"' + (f.cat === 'income' ? ' selected' : '') + '>Income</option><option value="savings"' + (f.cat === 'savings' ? ' selected' : '') + '>Savings to goals</option>' + Object.keys(CATS).map(function (k) { return '<option value="' + k + '"' + (f.cat === k ? ' selected' : '') + '>' + esc(CATS[k].label) + '</option>'; }).join('');
  return '<div class="tools"><button type="button" class="btn quiet sm" data-act="open-sms">Paste bank SMS</button><button type="button" class="btn quiet sm" data-act="open-csv">Import CSV</button><button type="button" class="btn quiet sm" data-act="export-csv">Export CSV</button></div>' +
    '<div class="filters"><label class="search">' + ic('search', 18) + '<input id="f-q" type="search" placeholder="Search payee or note" aria-label="Search transactions" value="' + esc(f.q) + '"></label>' +
    '<div class="duo"><select id="f-acct" class="input" aria-label="Filter by wallet">' + wopts + '</select><select id="f-cat" class="input" aria-label="Filter by category">' + copts + '</select></div></div>' +
    '<div id="act-list" class="stack">' + activityList() + '</div>';
}

function activityList() {
  var f = S.filter, q = f.q.trim().toLowerCase();
  var list = S.p.txns.filter(function (t) {
    if (f.acct !== 'all' && t.wallet !== f.acct) return false;
    if (f.cat === 'income' && t.kind !== 'income') return false;
    if (f.cat === 'savings' && t.kind !== 'save') return false;
    if (f.cat !== 'all' && f.cat !== 'income' && f.cat !== 'savings' && (t.kind !== 'expense' || t.cat !== f.cat)) return false;
    if (q && ((t.merchant || '') + ' ' + (t.note || '')).toLowerCase().indexOf(q) < 0) return false;
    return true;
  }).sort(function (a, b) { return b.ts - a.ts; });
  if (!list.length) return '<section class="card"><p class="hint">' + (S.p.txns.length ? 'No transactions match these filters.' : 'No transactions yet. Tap + to log your first spend.') + '</p></section>';
  var shown = list.slice(0, S.actLimit), groups = [], cur = null;
  var t0 = startOfDay(new Date()).getTime();
  shown.forEach(function (t) {
    var ds = startOfDay(new Date(t.ts)).getTime();
    if (!cur || cur.ds !== ds) { cur = { ds: ds, items: [], out: 0 }; groups.push(cur); }
    cur.items.push(t); if (t.kind === 'expense') cur.out += t.amt;
  });
  var h = groups.map(function (g) {
    var back = Math.round((t0 - g.ds) / DAY);
    var label = back === 0 ? 'Today' : back === 1 ? 'Yesterday' : fmtDate(g.ds, { weekday: 'short', day: 'numeric', month: 'short' });
    return '<section class="card tight"><div class="row between" style="padding:16px 0 4px"><span class="eyebrow">' + esc(label) + '</span><span class="hint">' + (g.out ? '−' + esc(money(g.out)) : '') + '</span></div>' + g.items.map(txnRow).join('') + '<div style="height:6px"></div></section>';
  }).join('');
  if (list.length > shown.length) h += '<button type="button" class="btn quiet block" data-act="more">Show ' + Math.min(60, list.length - shown.length) + ' more</button>';
  return h;
}
