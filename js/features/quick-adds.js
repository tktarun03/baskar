/* BasKar · js/features/quick-adds.js
   Quick adds: one-tap regular spends.
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

function quickRow() {
  var tp = S.p.templates;
  if (!tp.length) return '';
  return '<section class="quick" aria-label="Quick add"><div class="row between"><span class="eyebrow">Quick add</span><button type="button" class="btn-link" data-act="tpl-manage">Edit</button></div><div class="chips">' +
    tp.map(function (t, i) { var cat = CATS[t.cat] || CATS.other; return '<button type="button" class="chip" data-act="tpl-use" data-i="' + i + '" style="--c:' + cat.color + '"><span class="dot"></span>' + esc(t.merchant) + ' <span class="sub">' + esc(money(t.amt)) + '</span></button>'; }).join('') +
    '</div></section>';
}

function sheetTpl() {
  var tp = S.p.templates;
  return sheetHead('Quick adds') + '<p class="hint">One tap on Today logs these right away, at the current time. To save a new one, turn on “Save as a quick add” in the + form.</p>' +
    (tp.length ? '<section class="card tight">' + tp.map(function (t, i) { var cat = CATS[t.cat] || CATS.other; return '<div class="wk-row"><span class="tile" style="--c:' + cat.color + '">' + ic(CATS[t.cat] ? t.cat : 'other', 18) + '</span><div class="grow"><strong style="font-size:15px">' + esc(t.merchant) + '</strong><span class="hint">' + dots([cat.short, money(t.amt), walletName(t.wallet)]) + '</span></div><button type="button" class="icon-btn" data-act="tpl-del" data-i="' + i + '" aria-label="Remove ' + esc(t.merchant) + '">' + ic('trash', 16) + '</button></div>'; }).join('') + '</section>' : '<section class="card"><p class="hint">No quick adds yet.</p></section>') +
    '<button type="button" class="btn quiet block" data-act="close">Done</button>';
}

function addTemplate(rec) {
  var key = String(rec.merchant || '').toLowerCase() + '|' + rec.amt;
  S.p.templates = S.p.templates.filter(function (t) { return String(t.merchant || '').toLowerCase() + '|' + t.amt !== key; });
  S.p.templates.unshift({ id: uid(), merchant: rec.merchant || (CATS[rec.cat] || CATS.other).short, amt: rec.amt, cat: rec.cat, wallet: rec.wallet });
  S.p.templates = S.p.templates.slice(0, 8);
}

/* Actions (data-act="…") for this feature. */
Object.assign(ACT, {
  'tpl-toggle': function (el) { S.sheet.saveTpl = !S.sheet.saveTpl; el.setAttribute('aria-checked', String(S.sheet.saveTpl)); },
  'tpl-manage': function () { openSub({ type: 'tpl' }); },
  'tpl-del': function (el) {
    var i = +el.dataset.i, gone = S.p.templates.splice(i, 1)[0]; if (!gone) return;
    saveProfile(); renderAll();
    toast('Quick add removed', gone.merchant, { undo: function () { S.p.templates.splice(i, 0, gone); saveProfile(); renderAll(); } });
  },
  'tpl-use': function (el) {
    var tp = S.p.templates[+el.dataset.i]; if (!tp) return;
    var w = S.p.wallets.some(function (x) { return x.id === tp.wallet; }) ? tp.wallet : ((S.p.wallets[0] || {}).id || '');
    var rec = { id: uid(), ts: Date.now(), kind: 'expense', amt: tp.amt, cat: CATS[tp.cat] ? tp.cat : 'other', merchant: tp.merchant, wallet: w, note: '', src: 'quick' };
    if (rec.cat === 'food') rec.meal = mealFor(rec.ts);
    var before = calc(S.p), capsBefore = capStatus(S.p, before);
    S.p.txns.push(rec); S.p.txns.sort(function (a, b) { return a.ts - b.ts; });
    saveProfile(); renderAll();
    notifySpend(rec, before, capsBefore, '');
  }
});
