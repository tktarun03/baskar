/* BasKar · js/features/add-spend.js
   Add or edit a spend or income, one-line entry, spend notices.
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

function catOptions(sel) { return Object.keys(CATS).map(function (k) { return '<option value="' + k + '"' + (sel === k ? ' selected' : '') + '>' + esc(CATS[k].label) + '</option>'; }).join(''); }

function sheetTxn(sh) {
  var t = sh.id ? S.p.txns.filter(function (x) { return x.id === sh.id; })[0] : null, kind = sh.kind;
  var wopts = S.p.wallets.map(function (w) { return '<option value="' + esc(w.id) + '"' + ((t ? t.wallet : sh.wallet) === w.id ? ' selected' : '') + '>' + esc(w.name) + '</option>'; }).join('');
  var quick = !t ? (sh.quick || []) : [];
  return sheetHead((t ? 'Edit ' : 'Add ') + (kind === 'income' ? 'income' : 'a spend')) +
    '<form id="txn-form" class="stack" novalidate>' +
    '<div class="seg" role="group" aria-label="Type"><button type="button" data-act="kind" data-k="expense" aria-pressed="' + (kind === 'expense') + '">Spend</button><button type="button" data-act="kind" data-k="income" aria-pressed="' + (kind === 'income') + '">Income</button></div>' +
    (t ? '' : '<div class="row wrap"><button type="button" class="btn ghost sm" data-act="open-receipt">' + ic('camera', 16) + ' <span>Scan a receipt</span></button><button type="button" class="btn ghost sm" data-act="open-sms">Paste a bank SMS instead</button></div>') +
    (t ? '' : '<div class="field"><label for="t-quick">Type it in one line</label><input id="t-quick" class="input" autocomplete="off" autocapitalize="off" enterkeyhint="done" placeholder="e.g. 15 shawarma lunch · karak 3 cash"><span class="hint" id="t-quick-hint">Fills in the form below as you type. Try “taxi 25 yesterday”.</span></div>') +
    '<div class="field"><label for="t-amt">Amount</label><div class="money-input"><span class="cur">' + esc(curSymbol(S.p.currency)) + '</span><input id="t-amt" type="number" inputmode="decimal" step="any" min="0" placeholder="0" value="' + (t ? esc(t.amt) : '') + '" required></div></div>' +
    (quick.length ? '<div class="field" id="quick-field"' + (kind === 'income' ? ' hidden' : '') + '><span class="label" id="quick-lbl">Again?</span><div class="chips" role="group" aria-labelledby="quick-lbl">' +
      quick.map(function (q, i) { return '<button type="button" class="chip" data-act="quick" data-i="' + i + '" aria-pressed="false" style="--c:' + (CATS[q.cat] || CATS.other).color + '"><span class="dot"></span>' + esc(q.merchant) + ' <span class="sub">' + esc(money(q.amt, { show: true })) + '</span></button>'; }).join('') +
      '</div></div>' : '') +
    '<div class="field"><label for="t-mer" id="t-mer-lbl">' + (kind === 'income' ? 'From' : 'Paid to') + '</label><input id="t-mer" class="input" autocomplete="off" placeholder="e.g. Blinkit, Uber, Corner Café" value="' + (t ? esc(t.merchant) : '') + '"></div>' +
    '<div class="field" id="cat-field"' + (kind === 'income' ? ' hidden' : '') + '><span class="label" id="cat-lbl">Category</span><div class="chips" id="cat-chips" role="group" aria-labelledby="cat-lbl">' +
    Object.keys(CATS).map(function (k) { return '<button type="button" class="chip" data-act="cat" data-k="' + k + '" aria-pressed="' + (sh.cat === k) + '" style="--c:' + CATS[k].color + '"><span class="dot"></span>' + esc(CATS[k].short) + '</button>'; }).join('') +
    '</div><span class="hint">Bills count toward fixed costs, not your daily budget.</span></div>' +
    '<div class="field" id="meal-field"' + (kind === 'expense' && sh.cat === 'food' ? '' : ' hidden') + '><span class="label" id="meal-lbl">Meal</span><div class="chips" id="meal-chips" role="group" aria-labelledby="meal-lbl">' +
    Object.keys(MEALS).map(function (k) { return '<button type="button" class="chip" data-act="meal" data-k="' + k + '" aria-pressed="' + (sh.meal === k) + '">' + MEALS[k] + '</button>'; }).join('') +
    '</div><span class="hint">Picked from the time. Tap to change.</span></div>' +
    '<div class="field"><label for="t-acct">Wallet</label><select id="t-acct" class="input">' + wopts + '</select></div>' +
    '<div class="field"><label for="t-when">When</label><input id="t-when" class="input" type="datetime-local" value="' + toLocalInput(t ? t.ts : Date.now()) + '"></div>' +
    '<div class="field"><label for="t-note">Remarks <span class="muted">(optional)</span></label><input id="t-note" class="input" maxlength="120" placeholder="e.g. team lunch, birthday gift" value="' + (t ? esc(remarkOf(t)) : '') + '"></div>' +
    (!t ? '<div class="setrow" id="tpl-row"' + (kind === 'expense' ? '' : ' hidden') + '><div class="grow"><span class="label" id="tpl-lbl">Save as a quick add</span><span class="hint">Shows on Today so you can log it again in one tap.</span></div><button type="button" class="switch" role="switch" aria-labelledby="tpl-lbl" aria-checked="' + !!sh.saveTpl + '" data-act="tpl-toggle"><span></span></button></div>' : '') +
    (t && t.kind === 'expense' && t.merchant ? '<div class="setrow"><div class="grow"><span class="label" id="rule-lbl">Apply to every payment from “' + esc(t.merchant) + '”</span><span class="hint">Uses this name and category for past and future payments from this payee, including bank SMS.</span></div><button type="button" class="switch" role="switch" aria-labelledby="rule-lbl" aria-checked="' + !!sh.makeRule + '" data-act="rule-toggle"><span></span></button></div>' : '') +
    '<p class="error" id="t-err" role="alert" hidden></p>' +
    (t && t.items && t.items.length ? '<details class="card"><summary><span>Items on the bill</span> · ' + t.items.length + '</summary>' + t.items.map(function (it) { return '<div class="wk-row"><div class="grow" data-noi18n>' + esc(it.name) + '</div><span class="amt">' + esc(money(it.amt, { exact: true })) + '</span></div>'; }).join('') + '</details>' : '') +
    '<button type="submit" class="btn block" id="t-save">' + (t ? 'Save changes' : (kind === 'income' ? 'Add income' : 'Add spend')) + '</button>' +
    (t ? '<button type="button" class="btn quiet block" data-act="share-txn">' + ic('share', 18) + ' <span>Share this payment</span></button>' : '') +
    (t ? '<button type="button" class="btn ghost block danger-text" data-act="del-txn">Delete transaction</button>' : '') +
    '</form>';
}

function openTxn(id) {
  var t = id ? S.p.txns.filter(function (x) { return x.id === id; })[0] : null;
  if (t && t.kind === 'save') { S.sheet = { type: 'contrib', id: t.id }; renderSheet(); return; }
  S.sheet = { type: 'txn', id: t ? t.id : null, kind: t ? t.kind : 'expense', cat: t && t.kind === 'expense' ? t.cat : 'food', wallet: t ? t.wallet : (S.lastWallet || (S.p.wallets[0] && S.p.wallets[0].id)), confirmDel: false, quick: t ? [] : recentPayees(S.p), meal: t ? (t.meal || mealFor(t.ts)) : mealFor(Date.now()), mealManual: !!(t && t.meal) };
  renderSheet();
  if (!t) focusSoon('#t-amt');
}

/* Fills the add form from the one-line box; fields stay editable afterwards. */
function applyQuick(text) {
  var sh = S.sheet, hint = $('#t-quick-hint'), q = parseQuick(text, catMemory());
  if (!q) { if (hint) hint.textContent = 'Fills in the form below as you type. Try “taxi 25 yesterday”.'; return; }
  if (q.kind !== sh.kind) { var kb2 = document.querySelector('.sheet [data-act="kind"][data-k="' + q.kind + '"]'); if (kb2) ACT.kind(kb2); }
  if (q.amt) $('#t-amt').value = q.amt;
  $('#t-mer').value = q.merchant || '';
  if (q.kind === 'expense' && CATS[q.cat]) {
    sh.cat = q.cat;
    Array.prototype.forEach.call(document.querySelectorAll('#cat-chips .chip'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.k === q.cat)); });
  }
  if (q.wallet) { var ws = $('#t-acct'); if (ws) ws.value = q.wallet; }
  var when = $('#t-when'); if (when) when.value = toLocalInput(q.ts || Date.now());
  sh.meal = q.meal || ''; sh.mealManual = !!q.meal;
  syncMeal();
  if (hint) hint.innerHTML = dots([q.kind === 'income' ? 'Income' : 'Spend', q.amt ? money(q.amt, { show: true }) : 'no amount yet', q.merchant, q.kind === 'expense' && CATS[q.cat] ? CATS[q.cat].short : '', MEALS[sh.meal] && sh.cat === 'food' ? MEALS[sh.meal] : '', q.wallet ? walletName(q.wallet) : '', q.ts ? fmtDate(q.ts) + ' ' + fmtTime(q.ts) : '']);
}

function syncMeal() {
  var sh = S.sheet, mf = $('#meal-field'), chips = $('#meal-chips');
  if (!sh || sh.type !== 'txn' || !mf || !chips) return;
  var show = sh.kind === 'expense' && sh.cat === 'food', tr = $('#tpl-row');
  mf.hidden = !show;
  if (tr) tr.hidden = sh.kind !== 'expense';
  if (show && !sh.mealManual) { var v = $('#t-when') && $('#t-when').value, ts = v ? new Date(v).getTime() : Date.now(); sh.meal = mealFor(isFinite(ts) ? ts : Date.now()); }
  Array.prototype.forEach.call(chips.children, function (b) { b.setAttribute('aria-pressed', String(b.dataset.k === sh.meal)); });
}

function saveTxn() {
  var sh = S.sheet, err = $('#t-err');
  var amt = num($('#t-amt').value);
  if (!(amt > 0)) { err.textContent = 'Enter an amount above zero.'; err.hidden = false; $('#t-amt').focus(); return; }
  if (!S.p.wallets.length) { err.textContent = 'Add a wallet first, from the Money tab.'; err.hidden = false; return; }
  var whenV = $('#t-when').value, ts = whenV ? new Date(whenV).getTime() : Date.now();
  if (!isFinite(ts)) ts = Date.now();
  var kind = sh.kind, cat = kind === 'income' ? 'income' : (sh.cat || 'other');
  var old = sh.id ? S.p.txns.filter(function (x) { return x.id === sh.id; })[0] : null;
  var rec = { id: sh.id || uid(), ts: ts, kind: kind, amt: amt, cat: cat, merchant: $('#t-mer').value.trim(), wallet: $('#t-acct').value, note: $('#t-note').value.trim() };
  if (old && old.billId) { rec.billId = old.billId; rec.billFor = old.billFor; }
  if (old && old.src) rec.src = old.src;
  if (kind === 'expense' && cat === 'food' && MEALS[sh.meal]) rec.meal = sh.meal;
  if (old && old.orig && old.amt === amt) rec.orig = old.orig;
  var before = calc(S.p), capsBefore = capStatus(S.p, before), ruleMsg = '';
  if (sh.id) S.p.txns = S.p.txns.map(function (x) { return x.id === sh.id ? rec : x; }); else S.p.txns.push(rec);
  if (sh.id && sh.makeRule && old && old.merchant && kind === 'expense') ruleMsg = saveRule(old.merchant, rec.merchant || old.merchant, cat);
  if (!sh.id && sh.saveTpl && kind === 'expense') addTemplate(rec);
  S.p.txns.sort(function (a, b) { return a.ts - b.ts; });
  S.lastWallet = rec.wallet;
  saveProfile();
  S.sheet = null; renderAll();
  if (sh.id) { toast('Saved', ruleMsg || ((kind === 'income' ? '+' : '−') + money(amt) + (rec.merchant ? ' · ' + rec.merchant : ''))); return; }
  if (kind === 'income') { toast('+' + money(amt) + ' added', S.p.settings.roast ? 'Money in! Chillar is cautiously optimistic.' : 'Income logged to ' + walletName(rec.wallet) + '.', { undo: undoAdd([rec.id], 'That income') }); return; }
  notifySpend(rec, before, capsBefore, sh.saveTpl ? 'Saved as a quick add.' : '');
}

/* Picks the most useful message after a spend: budget crossed, limit crossed, 80% used, or the usual roast. Offers Undo. */
function notifySpend(rec, before, capsBefore, prefix) {
  var after = calc(S.p), capsAfter = capStatus(S.p, after), roastOn = S.p.settings.roast, cat = rec.cat, ts = rec.ts, amt = rec.amt;
  var title = '−' + money(amt) + (rec.merchant ? ' · ' + rec.merchant : ''), body = roastOn ? roastFor(rec) : 'Logged to ' + walletName(rec.wallet) + '.';
  var isToday = ts >= after.t0 && ts < after.t1, b = after.todayBudget, done = false;
  var cb = capsBefore.filter(function (x) { return x.cat === cat; })[0], ca = capsAfter.filter(function (x) { return x.cat === cat; })[0];
  if (isToday && cat !== 'bills' && b > 0 && before.usedToday < b && after.usedToday >= b) { title = roastOn ? 'Bas kar bhai.' : 'Today’s budget is used up'; body = 'You’re ' + money(after.usedToday - b) + ' over today. Tomorrow drops to ' + (after.tomorrow === null ? 'a fresh cycle' : money(after.tomorrow)) + '.'; done = true; }
  if (!done && ca && cb && cb.pct < 1 && ca.pct >= 1) { title = 'Limit crossed: ' + CATS[cat].short; body = money(ca.spent) + ' of your ' + money(ca.cap) + ' limit this cycle.' + (roastOn ? ' Chillar is hiding the app icon.' : ''); done = true; }
  if (!done && isToday && cat !== 'bills' && b > 0 && before.usedToday < 0.8 * b && after.usedToday >= 0.8 * b) { title = roastOn ? '80% gone. Chillar is sweating.' : '80% of today’s budget used'; body = money(after.left) + ' left for today.'; done = true; }
  if (!done && ca && cb && cb.pct < 0.8 && ca.pct >= 0.8) { title = 'Near your ' + CATS[cat].short + ' limit'; body = money(ca.left) + ' left of ' + money(ca.cap) + ' this cycle.'; }
  toast(title, prefix || body, { undo: undoAdd([rec.id], 'That spend') });
}

/* Actions (data-act="…") for this feature. */
Object.assign(ACT, {
  add: function () { openTxn(); },
  'edit-txn': function (el) { openTxn(el.dataset.id); },
  kind: function (el) {
    var k = el.dataset.k; S.sheet.kind = k;
    Array.prototype.forEach.call(el.parentNode.children, function (b) { b.setAttribute('aria-pressed', String(b.dataset.k === k)); });
    $('#cat-field').hidden = k === 'income';
    var qf = $('#quick-field'); if (qf) qf.hidden = k === 'income';
    $('#t-mer-lbl').textContent = k === 'income' ? 'From' : 'Paid to';
    $('#sheet-title').textContent = (S.sheet.id ? 'Edit ' : 'Add ') + (k === 'income' ? 'income' : 'a spend');
    if (!S.sheet.id) $('#t-save').textContent = k === 'income' ? 'Add income' : 'Add spend';
    syncMeal();
  },
  cat: function (el) { S.sheet.cat = el.dataset.k; Array.prototype.forEach.call(el.parentNode.children, function (b) { b.setAttribute('aria-pressed', String(b === el)); }); syncMeal(); },
  meal: function (el) { var k = el.dataset.k; S.sheet.meal = S.sheet.meal === k ? '' : k; S.sheet.mealManual = true; syncMeal(); },
  quick: function (el) {
    var q = (S.sheet.quick || [])[+el.dataset.i]; if (!q) return;
    $('#t-amt').value = q.amt; $('#t-mer').value = q.merchant; S.sheet.cat = q.cat;
    var w = $('#t-acct'); if (w && q.wallet && S.p.wallets.some(function (x) { return x.id === q.wallet; })) w.value = q.wallet;
    Array.prototype.forEach.call(el.parentNode.children, function (b) { b.setAttribute('aria-pressed', String(b === el)); });
    Array.prototype.forEach.call($('#cat-chips').children, function (b) { b.setAttribute('aria-pressed', String(b.dataset.k === q.cat)); });
    syncMeal();
  },
  'del-txn': function () {
    var gone = removeTxns([S.sheet.id]); S.sheet = null; renderAll();
    var t = gone[0];
    toast('Transaction deleted', t ? (t.kind === 'income' ? '+' : '−') + money(t.amt) + (t.merchant ? ' · ' + t.merchant : '') : '', { undo: undoDelete(gone) });
  }
});
