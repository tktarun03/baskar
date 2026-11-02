/* BasKar · js/features/weekly-review.js
   Weekly review sheet and the card on Today.
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

function weekStats() {
  var now = new Date(), y = now.getFullYear(), m = now.getMonth(), d0 = now.getDate();
  function day(off) { return new Date(y, m, d0 + off).getTime(); }
  var start = day(-6), end = day(1), pStart = day(-13);
  function spends(a, b) { return S.p.txns.filter(function (t) { return t.kind === 'expense' && t.cat !== 'bills' && t.ts >= a && t.ts < b; }); }
  var cur = spends(start, end), prev = spends(pStart, start), tot = cur.reduce(sumA, 0), ptot = prev.reduce(sumA, 0);
  var pay = {};
  cur.forEach(function (t) { var nm = (t.merchant || (CATS[t.cat] || CATS.other).short).trim(), k = nm.toLowerCase(); if (!pay[k]) pay[k] = { name: nm, a: 0, n: 0, cat: t.cat }; pay[k].a += t.amt; pay[k].n++; });
  var payees = Object.keys(pay).map(function (k) { return pay[k]; }).sort(function (a, b) { return b.a - a.a; });
  var cn = catTotals(cur), cp = catTotals(prev);
  var cats = Object.keys(CATS).map(function (k) { var a = cn[k] ? cn[k].a : 0, b = cp[k] ? cp[k].a : 0; return { k: k, a: a, b: b, d: a - b }; }).filter(function (x) { return x.a || x.b; }).sort(function (x, z) { return Math.abs(z.d) - Math.abs(x.d); });
  var days = [];
  for (var i = -6; i <= 0; i++) days.push({ ts: day(i), a: spends(day(i), day(i + 1)).reduce(sumA, 0) });
  var c = calc(S.p), st = streakInfo(S.p, c), onBudget = 0, judged = 0;
  days.forEach(function (dd) { var r = st.map[dd.ts]; if (dd.ts === c.t0) { judged++; if (st.todayOk) onBudget++; } else if (r) { judged++; if (r.under) onBudget++; } });
  var sorted = days.slice().sort(function (a, b) { return b.a - a.a; });
  return { start: start, end: end, tot: tot, ptot: ptot, count: cur.length, payees: payees, cats: cats, onBudget: onBudget, judged: judged, worst: sorted[0], best: sorted[sorted.length - 1], list: cur };
}

function deltaText(w) { var pct = Math.round((w.tot - w.ptot) / w.ptot * 100); return pct === 0 ? 'Same as the week before' : (pct > 0 ? '↑ ' : '↓ ') + Math.abs(pct) + '% vs the week before'; }

function weekCard() {
  var w = weekStats();
  if (!w.count && !w.ptot) return '';
  return '<button type="button" class="alert info" data-act="week"><span class="tile" style="--c:var(--accent)">' + ic('chart', 18) + '</span><div class="grow"><strong>' + (new Date().getDay() === 0 ? 'Your weekly review is ready' : 'Your last 7 days') + '</strong><span class="hint">' + esc(money(w.tot)) + ' spent' + (w.ptot ? ' · ' + esc(deltaText(w)) : '') + '</span></div>' + ic('chev', 18) + '</button>';
}

function weekTip(w) {
  var p = w.payees.filter(function (x) { return x.n >= 3; })[0];
  if (p) return '<b>' + esc(p.name) + '</b> · <span>' + esc(p.n + ' times this week. Skip 2 of those next week and keep about ' + money(p.a / p.n * 2) + '.') + '</span>';
  var up = w.cats.filter(function (x) { return x.d > 0; })[0];
  if (up && w.ptot) return '<b>' + esc(CATS[up.k].label) + '</b> · <span>' + esc('Up by ' + money(up.d) + '. Bring it back to last week’s ' + money(up.b) + ' and keep the difference.') + '</span>';
  if (w.payees[0]) return '<b>' + esc(w.payees[0].name) + '</b> · <span>' + esc('Your biggest spend: ' + money(w.payees[0].a) + '. Decide now whether next week needs it.') + '</span>';
  return '<span>A quiet week. Keep it going.</span>';
}

function sheetWeek() {
  var w = weekStats(), range = fmtDate(w.start, { day: 'numeric', month: 'short' }) + ' – ' + fmtDate(w.end - 1, { day: 'numeric', month: 'short' });
  function dayTxt(dd) { return dd && dd.a ? fmtDate(dd.ts, { weekday: 'short' }) + ' · ' + money(dd.a, { compact: true }) : '—'; }
  var meals = mealSplit(w.list);
  return sheetHead('Your week') +
    '<p class="hint">' + dots([range, 'spending money only, bills left out']) + '</p>' +
    '<section class="stack-xs"><span class="num xl">' + esc(money(w.tot)) + '</span>' +
    (w.ptot ? '<span class="delta ' + (w.tot > w.ptot ? 'up' : 'down') + '">' + esc(deltaText(w)) + ' (' + esc(money(w.ptot)) + ')</span>' : '<span class="hint">Nothing logged the week before, so there’s no comparison yet.</span>') + '</section>' +
    '<dl class="stats"><div><dt>Daily average</dt><dd>' + esc(money(w.tot / 7)) + '</dd></div><div><dt>Days on budget</dt><dd>' + (w.judged ? w.onBudget + ' of ' + w.judged : '—') + '</dd></div>' +
    '<div><dt>Biggest day</dt><dd>' + esc(dayTxt(w.worst)) + '</dd></div><div><dt>Lightest day</dt><dd>' + esc(w.best ? fmtDate(w.best.ts, { weekday: 'short' }) + ' · ' + money(w.best.a, { compact: true }) : '—') + '</dd></div></dl>' +
    '<section class="card tight"><div class="row between" style="padding:14px 0 4px"><span class="label">Top payees</span><span class="hint">' + plural(w.count, 'spend') + '</span></div>' +
    (w.payees.length ? w.payees.slice(0, 3).map(function (p) { var cat = CATS[p.cat] || CATS.other; return '<div class="wk-row"><span class="tile" style="--c:' + cat.color + '">' + ic(CATS[p.cat] ? p.cat : 'other', 18) + '</span><div class="grow"><strong style="font-size:15px">' + esc(p.name) + '</strong><span class="hint">' + plural(p.n, 'time') + ' · avg ' + esc(money(p.a / p.n)) + '</span></div><span class="amt">' + esc(money(p.a)) + '</span></div>'; }).join('') : '<p class="hint" style="padding:6px 0 14px">No spends in the last 7 days.</p>') +
    '<div style="height:6px"></div></section>' +
    (w.ptot && w.cats.length ? '<section class="card tight"><div style="padding:14px 0 4px"><span class="label">Biggest changes</span></div>' + w.cats.slice(0, 3).map(function (x) { return '<div class="wk-row"><span class="tile" style="--c:' + CATS[x.k].color + '">' + ic(x.k, 18) + '</span><div class="grow"><strong style="font-size:15px">' + esc(CATS[x.k].label) + '</strong><span class="hint">' + esc(money(x.b)) + ' → ' + esc(money(x.a)) + '</span></div><span class="delta ' + (x.d > 0 ? 'up' : 'down') + '">' + (x.d > 0 ? '+' : '−') + esc(money(Math.abs(x.d))) + '</span></div>'; }).join('') + '<div style="height:6px"></div></section>' : '') +
    (meals ? '<section class="card mini"><span class="eyebrow">Food by meal</span>' + meals + '</section>' : '') +
    '<section class="leak"><span class="eyebrow">One thing to try next week</span><p style="color:var(--ink-2)">' + weekTip(w) + '</p></section>' +
    '<button type="button" class="btn quiet block" data-act="close">Done</button>';
}

/* Actions (data-act="…") for this feature. */
Object.assign(ACT, {
  week: function () { S.sheet = { type: 'week' }; renderSheet(); }
});
