/* BasKar · js/features/payee-rules.js
   Payee rules: rename a payee and set its category for past and future payments.
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

function sheetRules() {
  return sheetHead('Payee rules') +
    '<p class="hint">Rules rename payees and set their category, for past payments and anything you add later, including bank SMS and CSV.</p>' +
    (S.p.rules.length ? '<section class="card tight">' + S.p.rules.map(function (r, i) {
      return '<div class="wk-row"><div class="grow"><strong style="font-size:15px">' + esc(r.name) + '</strong><span class="hint">From “' + esc(r.from || r.match) + '”' + (r.cat && CATS[r.cat] ? ' · ' + esc(CATS[r.cat].short) : '') + '</span></div><button type="button" class="icon-btn" data-act="rule-del" data-i="' + i + '" aria-label="Remove rule for ' + esc(r.from || r.match) + '">' + ic('trash', 16) + '</button></div>';
    }).join('') + '</section>' : '<section class="card"><p class="hint">No rules yet. To make one, open a payment, fix its name or category, and turn on “Apply to every payment from …”.</p></section>') +
    '<button type="button" class="btn quiet block" data-act="close">Done</button>';
}

function saveRule(oldName, newName, cat) {
  var o = oldName.trim().toLowerCase(), nm = newName.trim().slice(0, 32);
  var existing = S.p.rules.filter(function (r) { return r.match === o || r.name.toLowerCase() === o; })[0];
  var match = existing ? existing.match : o, from = existing ? existing.from : oldName.trim();
  S.p.rules = S.p.rules.filter(function (r) { return r !== existing; });
  S.p.rules.push({ match: match, from: from, name: nm, cat: CATS[cat] ? cat : '' });
  var n = 0;
  S.p.txns.forEach(function (t) {
    if (t.kind !== 'expense' || !t.merchant) return;
    var k = t.merchant.trim().toLowerCase();
    if (k !== match && k !== o && k !== nm.toLowerCase()) return;
    t.merchant = nm;
    if (CATS[cat]) { t.cat = cat; if (cat === 'food') { if (!t.meal) t.meal = mealFor(t.ts); } else delete t.meal; }
    n++;
  });
  return 'Rule saved. ' + plural(n, 'payment') + (n === 1 ? ' now shows' : ' now show') + ' as “' + nm + '”.';
}

/* Actions (data-act="…") for this feature. */
Object.assign(ACT, {
  rules: function () { openSub({ type: 'rules' }); },
  'rule-toggle': function (el) { S.sheet.makeRule = !S.sheet.makeRule; el.setAttribute('aria-checked', String(S.sheet.makeRule)); },
  'rule-del': function (el) {
    var i = +el.dataset.i, gone = S.p.rules.splice(i, 1)[0]; if (!gone) return;
    saveProfile(); renderAll();
    toast('Rule removed', 'Past payments keep their current names.', { undo: function () { S.p.rules.splice(i, 0, gone); saveProfile(); renderAll(); } });
  }
});
