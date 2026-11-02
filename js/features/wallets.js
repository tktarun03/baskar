/* BasKar · js/features/wallets.js
   Wallets: bank accounts, cards, cash.
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

function renderWallets(c) {
  var total = S.p.wallets.reduce(function (a, w) { return a + walletBalance(w); }, 0);
  var cs = c.cy.start.getTime();
  var h = '<section class="hero" style="gap:8px"><span class="eyebrow">Across ' + plural(S.p.wallets.length, 'wallet') + '</span><span class="num big' + (total < 0 ? ' is-over' : '') + '">' + (total < 0 ? '−' : '') + esc(money(Math.abs(total))) + '</span><span class="hint">Starting balances plus income, minus spends.</span></section>';
  h += '<section class="card wlist">' + S.p.wallets.map(function (w) {
    var t = WTYPES[w.type] || WTYPES.bank, bal = walletBalance(w);
    var spent = S.p.txns.reduce(function (s, x) { return (x.wallet === w.id && x.kind === 'expense' && x.ts >= cs) ? s + x.amt : s; }, 0);
    return '<button type="button" class="wcard" data-act="edit-wal" data-id="' + esc(w.id) + '"><span class="tile" style="--c:var(--ink-2)">' + ic(t.icon, 18) + '</span><span class="grow"><strong style="font-size:15px">' + esc(w.name) + '</strong><span class="hint">' + dots([t.label, money(spent) + ' spent this cycle']) + '</span></span><span class="num md"' + (bal < 0 ? ' style="color:var(--bad)"' : '') + '>' + (bal < 0 ? '−' : '') + esc(money(Math.abs(bal))) + '</span></button>';
  }).join('') + '</section>';
  h += '<button type="button" class="btn ghost block" data-act="add-wal">' + ic('plus', 18) + ' Add a wallet</button>';
  return h;
}

function sheetWallet(sh) {
  var w = sh.id ? S.p.wallets.filter(function (x) { return x.id === sh.id; })[0] : null;
  var n = w ? S.p.txns.filter(function (t) { return t.wallet === w.id; }).length : 0;
  return sheetHead(w ? 'Edit wallet' : 'Add a wallet') +
    '<form id="wallet-form" class="stack" novalidate>' +
    '<div class="field"><label for="w-name">Name</label><input id="w-name" class="input" value="' + (w ? esc(w.name) : '') + '" placeholder="e.g. HDFC savings, Amex, Cash" required></div>' +
    '<div class="field"><label for="w-type">Type</label><select id="w-type" class="input">' + Object.keys(WTYPES).map(function (k) { return '<option value="' + k + '"' + (w && w.type === k ? ' selected' : '') + '>' + WTYPES[k].label + '</option>'; }).join('') + '</select></div>' +
    '<div class="field"><label for="w-open">Starting balance</label><div class="money-input sm"><span class="cur">' + esc(curSymbol(S.p.currency)) + '</span><input id="w-open" type="number" inputmode="decimal" step="any" value="' + (w ? esc(w.opening) : '') + '" placeholder="0"></div><span class="hint">Use a negative number for money you owe, like a card balance.</span></div>' +
    '<p class="error" id="w-err" role="alert" hidden></p>' +
    '<button type="submit" class="btn block">' + (w ? 'Save wallet' : 'Add wallet') + '</button>' +
    (w ? '<button type="button" class="btn ghost block danger-text" data-act="del-wal" data-n="' + n + '">Delete wallet' + (n ? ' and its ' + plural(n, 'transaction') : '') + '</button>' : '') +
    '</form>';
}

function saveWallet() {
  var sh = S.sheet, name = $('#w-name').value.trim(), err = $('#w-err');
  if (!name) { err.textContent = 'Give this wallet a name.'; err.hidden = false; $('#w-name').focus(); return; }
  var rec = { id: sh.id || uid(), name: name, type: $('#w-type').value, opening: num($('#w-open').value) };
  if (sh.id) S.p.wallets = S.p.wallets.map(function (w) { return w.id === sh.id ? rec : w; }); else S.p.wallets.push(rec);
  saveProfile(); S.sheet = null; renderAll(); toast(sh.id ? 'Wallet saved' : 'Wallet added', name);
}

/* Actions (data-act="…") for this feature. */
Object.assign(ACT, {
  'add-wal': function () { S.sheet = { type: 'wallet' }; renderSheet(); focusSoon('#w-name'); },
  'edit-wal': function (el) { S.sheet = { type: 'wallet', id: el.dataset.id }; renderSheet(); },
  'del-wal': function (el) {
    if (S.p.wallets.length <= 1) { var err = $('#w-err'); err.textContent = 'You need at least one wallet. Add another before deleting this one.'; err.hidden = false; return; }
    if (!S.sheet.confirmDel) { S.sheet.confirmDel = true; el.textContent = 'Tap again to delete' + (+el.dataset.n ? ' it and ' + plural(+el.dataset.n, 'transaction') : ''); return; }
    var id = S.sheet.id; S.p.wallets = S.p.wallets.filter(function (w) { return w.id !== id; }); S.p.txns = S.p.txns.filter(function (t) { return t.wallet !== id; });
    saveProfile(); S.sheet = null; renderAll(); toast('Wallet deleted');
  }
});
