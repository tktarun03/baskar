/* BasKar · js/features/bank-sms.js
   Paste bank SMS: review, exchange rates, add.
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

function smsRow(x, i) {
  var inc = x.kind === 'income';
  return '<div class="srow"><input type="checkbox" id="sm-' + i + '" data-sms="' + i + '"' + (x.on ? ' checked' : '') + '>' +
    '<label for="sm-' + i + '" class="grow"><strong>' + esc(x.merchant || (inc ? 'Money in' : 'Payment')) + '</strong><span class="hint">' + dots([fmtDate(x.ts, { day: 'numeric', month: 'short' }), fmtTime(x.ts), x.wallet ? walletName(x.wallet) : 'No wallet']) + '</span>' +
    (x.dup ? '<span class="pillx gold" style="align-self:flex-start;margin-top:6px">Already logged?</span>' : '') +
    (x.cur && !(num((S.sheet.fx || {})[x.cur]) > 0) ? '<span class="pillx bad" style="align-self:flex-start;margin-top:6px"><span>' + esc(x.cur) + '</span> · <span>Needs a rate</span></span>' : '') + '</label>' +
    '<span class="amt' + (inc ? ' pos' : '') + '" style="text-align:end">' + (inc ? '+' : '−') + esc(money(x.amt, { show: true, cur: x.cur || undefined })) +
    (x.cur && num((S.sheet.fx || {})[x.cur]) > 0 ? '<span class="hint" style="display:block">≈ ' + esc(money(x.amt * num(S.sheet.fx[x.cur]), { show: true })) + '</span>' : '') + '</span>' +
    '<div class="srow-sub">' +
    (inc ? '' : '<select class="input' + (x.cat === 'food' ? '' : ' full') + '" data-smscat="' + i + '" aria-label="Category for ' + esc(x.merchant || 'this payment') + '">' + catOptions(x.cat) + '</select>' +
      (x.cat === 'food' ? '<select class="input" data-smsmeal="' + i + '" aria-label="Meal for ' + esc(x.merchant || 'this payment') + '">' + mealOptions(x.meal) + '</select>' : '')) +
    '<input class="input full" data-smsnote="' + i + '" maxlength="120" placeholder="Remarks (optional)" aria-label="Remarks for ' + esc(x.merchant || 'this payment') + '" value="' + esc(x.note || '') + '"></div>' +
    '</div>';
}

function smsAddable(sh) { var fx = sh.fx || {}; return sh.items.filter(function (x) { return x.on && (!x.cur || num(fx[x.cur]) > 0); }).length; }

function fxCard(sh) {
  var curs = [], n = 0;
  sh.items.forEach(function (x) { if (x.cur) { n++; if (curs.indexOf(x.cur) < 0) curs.push(x.cur); } });
  if (!curs.length) return '';
  return '<section class="card"><span class="label">Different currency</span><p class="hint">Some messages are in a different currency from this account. Enter the rate to convert them. It’s saved for next time; check today’s rate with your bank.</p>' +
    curs.map(function (c) { return '<div class="fxrow"><label for="fx-' + c + '">1 ' + esc(c) + ' =</label><input id="fx-' + c + '" class="input" type="number" inputmode="decimal" step="any" min="0" data-fx="' + c + '" value="' + esc((sh.fx || {})[c] || '') + '" placeholder="Rate"><span>' + esc(S.p.currency) + '</span></div>'; }).join('') + '</section>';
}

function sheetSms(sh) {
  if (sh.step === 'review') {
    var n = smsAddable(sh), dups = sh.items.filter(function (x) { return x.dup; }).length;
    return sheetHead('Check before adding') +
      '<p class="hint">Found ' + plural(sh.items.length, 'payment') + (dups ? ', ' + dups + ' of them possibly already logged and left unticked' : '') + '. Categories are guessed from the payee. Fix any that are wrong and BasKar remembers next time.</p>' +
      fxCard(sh) +
      (sh.items.length ? '<section class="card tight" id="sms-list">' + sh.items.map(smsRow).join('') + '</section>' : '<section class="card"><p class="hint">None of these looked like payments.</p></section>') +
      (sh.bad.length ? '<details class="card"><summary>Skipped ' + plural(sh.bad.length, 'message') + '</summary>' + sh.bad.map(function (b) { return '<div class="stack-xs"><span class="label">' + esc(b.why) + '</span><span class="mono">' + esc(b.raw.slice(0, 180)) + '</span></div>'; }).join('') + '</details>' : '') +
      '<button type="button" class="btn block" id="sms-add" data-act="sms-add"' + (n ? '' : ' disabled') + '>Add ' + plural(n, 'transaction') + '</button>' +
      '<button type="button" class="btn ghost block" data-act="sms-back">Back</button>';
  }
  return sheetHead('Paste bank SMS') +
    '<p class="hint">Copy one or more bank or UPI messages from your phone and paste them here. BasKar reads the amount, payee, date and account, and you check them before anything is added. Nothing leaves this browser.</p>' +
    '<div class="field"><label for="sms-text">Messages</label><textarea id="sms-text" class="input" rows="7" spellcheck="false" placeholder="Rs.600.00 debited from A/c XX4821 to VPA blinkit@okaxis…">' + esc(sh.text || '') + '</textarea><span class="hint">Leave a blank line between messages. Tip: put the last 4 digits of your card or account in a wallet’s name (for example “QNB debit 2026”) and messages get matched to it.</span></div>' +
    '<p class="error" id="sms-err" role="alert" hidden></p>' +
    '<button type="button" class="btn block" data-act="sms-read">Read messages</button>' +
    '<button type="button" class="btn ghost block" data-act="sms-sample">Fill in example messages</button>';
}

/* Actions (data-act="…") for this feature. */
Object.assign(ACT, {
  'open-sms': function () { S.sheet = { type: 'sms', step: 'paste', text: '' }; renderSheet(); focusSoon('#sms-text'); },
  'sms-sample': function () { S.sheet.text = sampleSms(); renderSheet(); },
  'sms-read': function () {
    var text = $('#sms-text').value, chunks = splitSms(text), err = $('#sms-err');
    S.sheet.text = text;
    if (!chunks.length) { err.textContent = 'Paste at least one message first.'; err.hidden = false; return; }
    var mem = catMemory(), idx = dupIndex(), items = [], bad = [];
    chunks.forEach(function (ch) { var r = parseSms(ch, mem, idx); if (!r) return; if (r.ok) items.push(r); else bad.push(r); });
    S.sheet.items = items; S.sheet.bad = bad; S.sheet.step = 'review'; S.sheet.fx = Object.assign({}, S.p.fx);
    renderSheet(); var s = document.querySelector('.sheet-body'); if (s) s.scrollTop = 0;
  },
  'sms-back': function () { S.sheet.step = 'paste'; renderSheet(); },
  'sms-add': function () {
    var fx = S.sheet.fx || {}, pick = [], noRate = 0;
    S.sheet.items.forEach(function (x) {
      if (!x.on) return;
      if (!x.cur) { pick.push(x); return; }
      var r = num(fx[x.cur]);
      if (!(r > 0)) { noRate++; return; }
      pick.push(Object.assign({}, x, { amt: Math.round(x.amt * r * 100) / 100, orig: { cur: x.cur, amt: x.amt } }));
    });
    if (!pick.length) return;
    Object.keys(fx).forEach(function (k) { if (num(fx[k]) > 0) S.p.fx[k] = num(fx[k]); });
    var res = addItems(pick, 'sms');
    S.sheet = null; renderAll();
    toast('Added ' + plural(pick.length, 'transaction'), (res.tipped ? 'That pushed you over today’s budget. Bas kar bhai.' : 'Your daily budget is updated.') + (noRate ? ' ' + noRate + ' skipped: no exchange rate.' : ''), { undo: undoAdd(res.ids, plural(pick.length, 'transaction')) });
  }
});
