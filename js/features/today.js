/* BasKar · js/features/today.js
   Today tab.
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

function renderToday(c) {
  var mood = moodOf(c), roastOn = S.p.settings.roast;
  var denom = Math.max(c.todayBudget, c.usedToday, 1), by = catTotals(c.todayList);
  var segs = Object.keys(CATS).filter(function (k) { return by[k]; }).map(function (k) { return '<span style="width:' + (by[k].a / denom * 100).toFixed(2) + '%;background:' + CATS[k].color + '"></span>'; }).join('');
  if (c.savedToday) segs += '<span style="width:' + (c.savedToday / denom * 100).toFixed(2) + '%;background:var(--accent)"></span>';
  var marker = c.over ? '<i class="marker" style="inset-inline-start:' + (c.todayBudget / denom * 100).toFixed(2) + '%"></i>' : '';
  var last = c.todayList[c.todayList.length - 1];
  var bubble;
  if (roastOn) bubble = c.over ? 'Bas kar bhai. You’re now spending tomorrow’s money.' : last ? roastFor(last) : 'Clean slate. Please don’t ruin it.';
  else bubble = c.over ? 'You’re over today’s budget. Tomorrow adjusts automatically.' : last ? 'Last spend: ' + (last.merchant || CATS[last.cat].short) + ', ' + money(last.amt) + '.' : 'Nothing logged yet today.';
  var adj = c.todayBudget - c.base, adjText;
  if (c.disc <= 0) adjText = 'Your fixed costs use up your whole income. Check your plan.';
  else if (Math.abs(adj) < 0.5) adjText = 'Right on your base of ' + money(c.base) + ' a day.';
  else if (adj > 0) adjText = 'Base ' + money(c.base) + ' a day, plus ' + money(adj) + ' you didn’t spend earlier this cycle.';
  else adjText = 'Base ' + money(c.base) + ' a day, minus ' + money(-adj) + ' to cover earlier spending and savings.';

  var h = '<section class="hero" aria-label="Today’s budget"><div class="hero-top"><div class="stack-xs"><span class="eyebrow">' + (c.over ? 'Over today’s budget by' : 'Safe to spend today') + '</span>' +
    '<span class="num big' + (c.over ? ' is-over' : '') + '">' + esc(money(Math.abs(c.left))) + '</span></div>' + heroMark(mood, 58) + '</div>' +
    '<div class="bar" role="img" aria-label="' + esc(money(c.usedToday) + ' used of ' + money(c.todayBudget)) + '">' + segs + marker + '</div>' +
    '<div class="row between hero-foot"><span>' + esc(money(c.spentToday)) + ' spent' + (c.savedToday ? ' · ' + esc(money(c.savedToday)) + ' saved' : '') + '</span><span class="muted">of ' + esc(money(c.todayBudget)) + '</span></div>' +
    '<p class="bubble"><span class="mood">' + (roastOn ? moodLine(mood) : (c.over ? 'Over budget' : 'On track')) + '</span>' + esc(bubble) + '</p></section>' +
    '<p class="hint pad">' + esc(adjText) + '</p>' + quickRow();

  var caps = capStatus(S.p, c).filter(function (x) { return x.pct >= 0.8; });
  h += caps.map(function (x) {
    var over = x.pct >= 1;
    return '<div class="alert' + (over ? '' : ' warn') + '" role="status"><span class="tile" style="--c:' + CATS[x.cat].color + '">' + ic(x.cat, 18) + '</span><div class="grow"><strong><span>' + (over ? 'Over the limit' : 'Near the limit') + '</span>: <span>' + esc(CATS[x.cat].label) + '</span></strong><span class="hint">' + dots([money(x.spent) + ' of ' + money(x.cap) + ' this cycle', over ? money(-x.left) + ' over' : money(x.left) + ' left']) + '</span></div></div>';
  }).join('');
  var soon = billEvents(S.p, detectSubs(S.p), 5).filter(function (e) { return !e.paid; });
  if (soon.length) {
    var e0 = soon[0], dd = Math.round((e0.ts - c.t0) / DAY);
    h += '<button type="button" class="alert ' + (e0.overdue ? '' : 'info') + '" data-act="go-bills" style="cursor:pointer"><span class="tile" style="--c:var(--ink-2)">' + ic('calendar', 18) + '</span><div class="grow"><strong>' + esc(e0.name) + ' · ' + esc(money(e0.amt)) + '</strong><span class="hint">' + dots([e0.overdue ? 'Overdue by ' + plural(-dd, 'day') : 'Due ' + relDays(dd).toLowerCase(), soon.length > 1 ? plural(soon.length - 1, 'more bill') + ' this week' : '']) + '</span></div>' + ic('chev', 18) + '</button>';
  }

  h += '<div class="duo"><div class="card mini"><span class="eyebrow">Tomorrow</span><span class="num md">' + (c.tomorrow === null ? 'New cycle' : esc(money(c.tomorrow))) + '</span><span class="hint">' + (c.tomorrow === null ? 'Your cycle resets tomorrow.' : 'If you stop spending now.') + '</span></div>' +
    '<div class="card mini"><span class="eyebrow">Left this cycle</span><span class="num md">' + esc(money(Math.max(c.disc - c.cycleUsed, 0))) + '</span><span class="hint">' + plural(c.cy.daysLeft, 'day') + ' including today</span></div></div>';

  var st = streakInfo(S.p, c);
  var nextM = MILESTONES.filter(function (x) { return x[0] > st.current; })[0];
  var reached = MILESTONES.filter(function (x) { return x[0] <= st.current; }).pop();
  var sParts = st.current
    ? ['Days at or under budget. Best: ' + st.best + '.', st.todayOk ? 'Stay under today to make it ' + (st.current + 1) + '.' : 'Today is over, so this resets tomorrow.']
    : [st.todayOk ? 'Finish today under budget to start one.' : 'Today is over budget. Fresh start tomorrow.'];
  if (nextM) sParts.push(plural(nextM[0] - st.current, 'more day') + ' to “' + nextM[1] + '”.');
  var sText = sParts.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join(' ');
  var prevM = reached ? reached[0] : 0, pct = nextM ? (st.current - prevM) / (nextM[0] - prevM) : 1;
  h += '<section class="card"><div class="streak"><span class="flame' + (st.current ? '' : ' cold') + '">' + ic('flame', 22) + '</span><div class="grow"><span class="streak-title"><span>' + (st.current ? plural(st.current, 'day') + ' streak' : 'No streak yet') + '</span>' + (reached ? ' · <span>' + esc(reached[1]) + '</span>' : '') + '</span><span class="hint">' + sText + '</span></div></div>' +
    '<div class="prog" aria-hidden="true"><span style="width:' + Math.max(3, pct * 100).toFixed(0) + '%;background:var(--accent)"></span></div>' +
    (st.noSpend ? '<span class="hint">' + plural(st.noSpend, 'no-spend day') + ' this cycle.</span>' : '') + '</section>' + weekCard();

  var days = [], vals = [];
  for (var i = 6; i >= 0; i--) { var d = new Date(c.cy.today0.getFullYear(), c.cy.today0.getMonth(), c.cy.today0.getDate() - i); var e = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1); days.push(d); vals.push(usedBetween(d.getTime(), e.getTime())); }
  var wmax = Math.max.apply(null, [c.base * 1.6, 1].concat(vals));
  h += '<section class="card"><div class="row between"><span class="label">Last 7 days</span><span class="hint">Red means over that day’s budget</span></div><div class="week">' +
    days.map(function (d, i) {
      var v = vals[i], isT = i === 6, rec = st.map[d.getTime()], col;
      if (isT) col = v > c.todayBudget ? 'var(--bad)' : 'var(--accent)';
      else if (rec) col = rec.under ? 'var(--faint)' : 'var(--bad)';
      else col = 'var(--line-strong)';
      return '<div class="wcol"><span class="wamt">' + esc(money(v, { compact: true })) + '</span><div class="wbar-box"><div class="wbar" style="height:' + Math.max(3, Math.round(v / wmax * 64)) + 'px;background:' + col + '"></div></div><span class="wday' + (isT ? ' today' : '') + '">' + (isT ? 'Today' : esc(d.toLocaleDateString(LOC(), { weekday: 'short' }))) + '</span></div>';
    }).join('') + '</div></section>';

  var todayAll = S.p.txns.filter(function (t) { return t.ts >= c.t0 && t.ts < c.t1; }).sort(function (a, b) { return b.ts - a.ts; });
  h += '<section class="card tight"><div class="row between" style="padding:16px 0 6px"><h2 class="h3">Today</h2><span class="hint">' + plural(todayAll.length, 'entry').replace('entrys', 'entries') + '</span></div>' +
    (todayAll.length ? todayAll.map(txnRow).join('') : '<div class="empty"><p class="hint">Nothing logged yet. Tap + when you spend, or paste the bank SMS.</p><button type="button" class="btn ghost sm" data-act="open-sms">Paste bank SMS</button></div>') +
    '<div style="height:8px"></div></section>' +
    '<button type="button" class="btn ghost block" data-act="recap">' + ic('moon', 18) + ' Tonight’s recap</button>';
  return h;
}

function mealSplit(list) {
  var o = {}, any = false;
  list.forEach(function (t) { if (t.cat === 'food' && MEALS[t.meal]) { o[t.meal] = (o[t.meal] || 0) + t.amt; any = true; } });
  if (!any) return '';
  return '<span class="hint">' + Object.keys(MEALS).filter(function (k) { return o[k]; }).map(function (k) { return '<span>' + MEALS[k] + '</span> ' + esc(money(o[k])); }).join(' · ') + '</span>';
}
