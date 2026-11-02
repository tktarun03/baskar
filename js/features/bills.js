/* BasKar · js/features/bills.js
   Bills calendar and subscriptions.
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

function renderBills(c) {
  var subs = detectSubs(S.p), ev = billEvents(S.p, subs, 35), now = new Date();
  var y = now.getFullYear(), m = now.getMonth(), dim = new Date(y, m + 1, 0).getDate(), t0 = c.t0, dayEv = {};
  function addDot(day, color) { (dayEv[day] = dayEv[day] || []).push(color); }
  S.p.fixed.forEach(function (f) {
    var d = parseInt(f.day, 10); if (!d) return;
    var ts = dueDate(y, m, d).getTime(), paid = isPaid(S.p, f, ts);
    addDot(new Date(ts).getDate(), paid ? 'var(--good)' : ts < t0 ? 'var(--bad)' : 'var(--ink)');
  });
  subs.forEach(function (s) {
    var dd = null;
    if (s.cadence === 'Monthly') dd = Math.min(new Date(s.last).getDate(), dim);
    else { var nd = new Date(s.next); if (nd.getMonth() === m && nd.getFullYear() === y) dd = nd.getDate(); }
    if (dd) addDot(dd, 'var(--accent)');
  });
  var offset = (new Date(y, m, 1).getDay() + 6) % 7, wk = [], cells = '', i;
  for (i = 0; i < 7; i++) wk.push(new Date(2024, 0, 1 + i).toLocaleDateString(LOC(), { weekday: 'narrow' }));
  for (i = 0; i < offset; i++) cells += '<span></span>';
  for (var d = 1; d <= dim; d++) {
    var ts = new Date(y, m, d).getTime(), dd0 = dayEv[d] || [];
    cells += '<span class="mcell' + (dd0.length ? ' has' : '') + (ts === t0 ? ' today' : '') + (ts < t0 ? ' past' : '') + '">' + d + '<span class="mdots">' + dd0.slice(0, 3).map(function (col) { return '<i style="background:' + col + '"></i>'; }).join('') + '</span></span>';
  }
  var unpaid = ev.filter(function (e) { return !e.paid; });
  var h = '<section class="card"><div class="row between"><h2 class="h3">' + esc(now.toLocaleDateString(LOC(), { month: 'long', year: 'numeric' })) + '</h2><span class="hint">' + plural(unpaid.length, 'bill') + ' in 5 weeks</span></div>' +
    '<div class="mgrid" role="img" aria-label="Calendar of bill due dates this month">' + wk.map(function (w) { return '<span class="wk">' + esc(w) + '</span>'; }).join('') + cells + '</div>' +
    '<div class="legend"><span><i class="sw" style="background:var(--ink)"></i>Due</span><span><i class="sw" style="background:var(--good)"></i>Paid</span><span><i class="sw" style="background:var(--bad)"></i>Overdue</span><span><i class="sw" style="background:var(--accent)"></i>Subscription</span></div></section>';
  h += '<section class="card tight"><div class="row between" style="padding:16px 0 6px"><h2 class="h3">Coming up</h2><span class="amt">' + esc(money(unpaid.reduce(function (a, e) { return a + e.amt; }, 0))) + '</span></div>' +
    (ev.length ? ev.map(function (e, idx) {
      var dt = new Date(e.ts), days = Math.round((e.ts - t0) / DAY), status;
      if (e.type === 'sub') status = '<span class="pillx gold">' + esc(relDays(days)) + '</span>';
      else if (e.paid) status = '<span class="pillx good">Paid</span>';
      else if (e.overdue) status = '<span class="pillx bad">' + plural(-days, 'day') + ' late</span>';
      else status = '<span class="pillx info">' + esc(relDays(days)) + '</span>';
      var action = e.type === 'fixed' && !e.paid ? '<button type="button" class="btn ghost sm" data-act="pay-bill" data-id="' + esc(e.id) + '" data-ts="' + e.ts + '">Mark paid</button>' : '';
      return '<div class="evt' + (idx === 0 ? ' first' : '') + '"><span class="when"><b>' + dt.getDate() + '</b><span>' + esc(dt.toLocaleDateString(LOC(), { month: 'short' })) + '</span></span><div class="grow"><strong>' + esc(e.name) + '</strong><span class="hint">' + dots([money(e.amt), e.type === 'sub' ? e.cadence.toLowerCase() + ' subscription' : 'fixed cost']) + '</span></div><div class="stack-xs" style="align-items:flex-end">' + status + action + '</div></div>';
    }).join('') : '<p class="hint" style="padding:6px 0 16px">Nothing due. Give your fixed costs a due day in Plan and they’ll show up here.</p>') +
    '<div style="height:8px"></div></section>';
  var yearly = subs.reduce(function (a, s) { return a + s.yearly; }, 0);
  h += '<section class="card tight"><div class="row between" style="padding:16px 0 6px"><h2 class="h3">Subscriptions</h2><span class="hint">' + (subs.length ? '≈ ' + esc(money(yearly)) + ' a year' : '') + '</span></div>' +
    (subs.length ? '<p class="hint" style="padding-bottom:6px">Same payee, same amount, on a regular schedule. Hide any you’ve cancelled.</p>' + subs.map(function (s, idx) {
      return '<div class="evt' + (idx === 0 ? ' first' : '') + '"><span class="tile" style="--c:var(--accent)">' + ic('repeat', 18) + '</span><div class="grow"><strong>' + esc(s.name) + '</strong><span class="hint">' + dots([money(s.amt) + ' ' + s.cadence.toLowerCase(), '≈ ' + money(s.yearly) + ' a year', 'next ' + fmtDate(s.next, { day: 'numeric', month: 'short' })]) + '</span></div><button type="button" class="icon-btn" data-act="hide-sub" data-k="' + esc(s.key) + '" aria-label="Hide ' + esc(s.name) + '">' + ic('x', 16) + '</button></div>';
    }).join('') : '<p class="hint" style="padding:6px 0 16px">None yet. A subscription shows up once the same payee charges a similar amount at least twice, about a week, month or year apart.</p>') +
    '<div style="height:8px"></div></section>';
  return h;
}

/* Actions (data-act="…") for this feature. */
Object.assign(ACT, {
  'go-bills': function () { goMoney('bills'); },
  'pay-bill': function (el) {
    var f = S.p.fixed.filter(function (x) { return x.id === el.dataset.id; })[0]; if (!f) return;
    var w = S.p.wallets.filter(function (x) { return x.type === 'bank'; })[0] || S.p.wallets[0];
    S.p.txns.push({ id: uid(), ts: Date.now(), kind: 'expense', amt: num(f.amount), cat: 'bills', merchant: f.label, wallet: w ? w.id : '', note: '', billId: f.id, billFor: +el.dataset.ts });
    S.p.txns.sort(function (a, b) { return a.ts - b.ts; });
    saveProfile(); renderAll(); toast('Marked as paid', 'It doesn’t touch your daily budget.');
  },
  'hide-sub': function (el) { S.p.dismissedSubs.push(el.dataset.k); saveProfile(); renderAll(); toast('Subscription hidden', 'It’ll stay hidden even if it charges again.'); }
});
