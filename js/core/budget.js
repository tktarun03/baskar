/* BasKar · js/core/budget.js
   Budget maths: pay cycle, safe-to-spend today, streaks, limits, subscriptions, bills.
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

function cycleFor(startDay, now) {
  now = now || new Date();
  var sd = Math.min(Math.max(parseInt(startDay, 10) || 1, 1), 28);
  var start = new Date(now.getFullYear(), now.getMonth(), sd);
  if (now.getDate() < sd) start = new Date(now.getFullYear(), now.getMonth() - 1, sd);
  var end = new Date(start.getFullYear(), start.getMonth() + 1, sd);
  var today0 = startOfDay(now);
  var days = Math.round((end - start) / DAY);
  var dayIndex = Math.round((today0 - start) / DAY) + 1;
  return { start: start, end: end, days: days, dayIndex: dayIndex, daysLeft: days - dayIndex + 1, today0: today0 };
}

function counts(t) { return t.kind === 'save' || (t.kind === 'expense' && t.cat !== 'bills'); }

function discOf(p) { return Math.max(num(p.income) - p.fixed.reduce(function (a, f) { return a + num(f.amount); }, 0), 0); }

function calc(p, now) {
  now = now || new Date();
  var cy = cycleFor(p.cycleStart, now);
  var fixedTotal = p.fixed.reduce(function (a, f) { return a + num(f.amount); }, 0);
  var income = num(p.income);
  var disc = Math.max(income - fixedTotal, 0);
  var base = disc / cy.days;
  var t0 = cy.today0.getTime(), t1 = new Date(cy.today0.getFullYear(), cy.today0.getMonth(), cy.today0.getDate() + 1).getTime();
  var cs = cy.start.getTime(), ce = cy.end.getTime();
  var inCy = p.txns.filter(function (t) { return counts(t) && t.ts >= cs && t.ts < ce && t.ts < t1; });
  var cyc = inCy.filter(function (t) { return t.kind === 'expense'; });
  var before = inCy.filter(function (t) { return t.ts < t0; }).reduce(sumA, 0);
  var todayList = cyc.filter(function (t) { return t.ts >= t0; }).sort(function (a, b) { return a.ts - b.ts; });
  var spentToday = todayList.reduce(sumA, 0);
  var savedToday = inCy.filter(function (t) { return t.kind === 'save' && t.ts >= t0; }).reduce(sumA, 0);
  var usedToday = spentToday + savedToday;
  var todayBudget = Math.max(disc - before, 0) / cy.daysLeft;
  var left = todayBudget - usedToday;
  var tomorrow = cy.daysLeft > 1 ? Math.max(disc - before - usedToday, 0) / (cy.daysLeft - 1) : null;
  var cycleSpent = cyc.reduce(sumA, 0);
  return { cy: cy, fixedTotal: fixedTotal, income: income, disc: disc, base: base, before: before, todayList: todayList, spentToday: spentToday, savedToday: savedToday, usedToday: usedToday, todayBudget: todayBudget, left: left, over: left < -0.004, tomorrow: tomorrow, cycleSpent: cycleSpent, cycleUsed: before + usedToday, cyc: cyc, t0: t0, t1: t1 };
}

function spentBetween(a, b) { return S.p.txns.reduce(function (s, t) { return (t.kind === 'expense' && t.cat !== 'bills' && t.ts >= a && t.ts < b) ? s + t.amt : s; }, 0); }

function usedBetween(a, b) { return S.p.txns.reduce(function (s, t) { return (counts(t) && t.ts >= a && t.ts < b) ? s + t.amt : s; }, 0); }

function catTotals(list) { var o = {}; list.forEach(function (t) { var k = t.cat || 'other'; if (!o[k]) o[k] = { a: 0, n: 0 }; o[k].a += t.amt; o[k].n++; }); return o; }

/* Replays a cycle day by day with the current plan, to know each past day's own budget. */
function replayCycle(p, cy, untilTs) {
  var disc = discOf(p), created = startOfDay(new Date(p.createdAt || 0)).getTime(), out = [], usedSoFar = 0;
  for (var i = 0; i < cy.days; i++) {
    var d = new Date(cy.start.getFullYear(), cy.start.getMonth(), cy.start.getDate() + i), ds = d.getTime();
    if (ds >= untilTs) break;
    var de = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
    var budget = Math.max(disc - usedSoFar, 0) / (cy.days - i), used = usedBetween(ds, de);
    usedSoFar += used;
    out.push({ ts: ds, budget: budget, used: used, under: used <= budget + 0.5, active: ds >= created });
  }
  return out;
}

var MILESTONES = [[3, 'Warming up'], [7, 'Disciplined'], [14, 'Monk mode'], [30, 'Legend']];

function streakInfo(p, c) {
  var prev = cycleFor(p.cycleStart, new Date(c.cy.start.getTime() - DAY / 2));
  var days = replayCycle(p, prev, c.cy.start.getTime()).concat(replayCycle(p, c.cy, c.t0)).filter(function (d) { return d.active; });
  var cur = 0, best = 0, run = 0, map = {};
  for (var i = days.length - 1; i >= 0; i--) { if (days[i].under) cur++; else break; }
  days.forEach(function (d) { run = d.under ? run + 1 : 0; if (run > best) best = run; map[d.ts] = d; });
  var noSpend = days.filter(function (d) { return d.ts >= c.cy.start.getTime() && d.used === 0; }).length;
  return { current: cur, best: Math.max(best, cur), noSpend: noSpend, map: map, todayOk: c.usedToday <= c.todayBudget + 0.5 };
}

function capStatus(p, c) {
  var tot = catTotals(c.cyc);
  return p.caps.filter(function (k) { return CATS[k.cat] && num(k.amount) > 0; }).map(function (k) {
    var a = tot[k.cat] ? tot[k.cat].a : 0, cap = num(k.amount);
    return { cat: k.cat, spent: a, cap: cap, pct: a / cap, left: cap - a };
  }).sort(function (a, b) { return b.pct - a.pct; });
}

function addMonths(ts, n) { var d = new Date(ts), day = d.getDate(); var t = new Date(d.getFullYear(), d.getMonth() + n, 1, d.getHours(), d.getMinutes()); var dim = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate(); t.setDate(Math.min(day, dim)); return t.getTime(); }

/* Repeat charges: same payee, amounts within 12%, at least two, spaced about a week, month or year apart. */
function detectSubs(p) {
  var groups = {}, out = [], now = Date.now(), t0 = startOfDay(new Date()).getTime();
  p.txns.forEach(function (t) { if (t.kind !== 'expense' || !t.merchant || t.billId) return; var k = t.merchant.trim().toLowerCase(); (groups[k] = groups[k] || []).push(t); });
  Object.keys(groups).forEach(function (k) {
    if (p.dismissedSubs.indexOf(k) >= 0) return;
    var g = groups[k].slice().sort(function (a, b) { return a.ts - b.ts; });
    if (g.length < 2) return;
    var r = g.slice(-6), avg = r.reduce(sumA, 0) / r.length;
    if (r.some(function (t) { return Math.abs(t.amt - avg) > avg * 0.12; })) return;
    var gaps = []; for (var i = 1; i < r.length; i++) gaps.push((r[i].ts - r[i - 1].ts) / DAY);
    var sg = gaps.slice().sort(function (a, b) { return a - b; }), mg = sg[Math.floor(sg.length / 2)];
    var cadence = null, period = 0;
    if (mg >= 26 && mg <= 35) { cadence = 'Monthly'; period = 30.44; } else if (mg >= 6 && mg <= 8) { cadence = 'Weekly'; period = 7; } else if (mg >= 350 && mg <= 380) { cadence = 'Yearly'; period = 365; }
    if (!cadence || gaps.some(function (x) { return Math.abs(x - mg) > mg * 0.3; })) return;
    var last = r[r.length - 1];
    if (now - last.ts > period * 1.6 * DAY) return;
    function step(ts) { return cadence === 'Monthly' ? addMonths(ts, 1) : cadence === 'Yearly' ? addMonths(ts, 12) : ts + 7 * DAY; }
    var next = step(last.ts); while (next < t0) next = step(next);
    out.push({ key: k, name: last.merchant, amt: last.amt, cadence: cadence, period: period, last: last.ts, next: next, count: g.length, cat: last.cat, yearly: last.amt * 365 / period });
  });
  return out.sort(function (a, b) { return b.yearly - a.yearly; });
}

function dueDate(y, m, day) { var dim = new Date(y, m + 1, 0).getDate(); return new Date(y, m, Math.min(day, dim)); }

function isPaid(p, f, ts) { return p.txns.some(function (t) { return t.billId === f.id && (t.billFor === ts || Math.abs(t.ts - ts) <= 15 * DAY); }); }

function billEvents(p, subs, horizon) {
  var now = new Date(), t0 = startOfDay(now).getTime(), end = t0 + (horizon || 35) * DAY, ev = [];
  var created = startOfDay(new Date(p.createdAt || 0)).getTime();
  p.fixed.forEach(function (f) {
    var day = parseInt(f.day, 10); if (!day) return;
    for (var m = -1; m <= 2; m++) {
      var ts = dueDate(now.getFullYear(), now.getMonth() + m, day).getTime();
      if (ts < t0 - 20 * DAY || ts > end || (ts < t0 && ts < created)) continue;
      var paid = isPaid(p, f, ts);
      if (ts < t0 && paid) continue;
      ev.push({ type: 'fixed', id: f.id, name: f.label, amt: num(f.amount), ts: ts, paid: paid, overdue: ts < t0 && !paid });
    }
  });
  subs.forEach(function (s) { if (s.next >= t0 && s.next <= end) ev.push({ type: 'sub', key: s.key, name: s.name, amt: s.amt, ts: s.next, cadence: s.cadence }); });
  return ev.sort(function (a, b) { return a.ts - b.ts; });
}

function recentPayees(p) {
  var seen = {}, out = [];
  for (var i = p.txns.length - 1; i >= 0 && out.length < 6; i--) {
    var t = p.txns[i];
    if (t.kind !== 'expense' || !t.merchant || t.cat === 'bills') continue;
    var k = t.merchant.trim().toLowerCase();
    if (seen[k]) continue;
    seen[k] = 1; out.push({ merchant: t.merchant, cat: t.cat, amt: t.amt, wallet: t.wallet });
  }
  return out;
}
