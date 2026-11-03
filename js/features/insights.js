/* BasKar · js/features/insights.js
   Insights tab and its charts (Chart.js).
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

function renderInsights(c) {
  var projected = c.cycleSpent / c.cy.dayIndex * c.cy.days;
  var pct = c.disc > 0 ? Math.min(100, c.cycleSpent / c.disc * 100) : 100;
  var paceBad = c.cycleSpent > c.disc * (c.cy.dayIndex / c.cy.days);
  var savedCycle = c.cycleUsed - c.cycleSpent;
  var tot = catTotals(c.cyc), keys = Object.keys(tot).sort(function (a, b) { return tot[b].a - tot[a].a; });
  var st = streakInfo(S.p, c), overDays = 0, pastDays = 0;
  Object.keys(st.map).forEach(function (k) { if (+k >= c.cy.start.getTime()) { pastDays++; if (!st.map[k].under) overDays++; } });
  var h = '<section class="hero" style="gap:14px"><span class="eyebrow">This cycle · day ' + c.cy.dayIndex + ' of ' + c.cy.days + '</span>' +
    '<div class="row wrap" style="align-items:baseline;gap:10px"><span class="num big">' + esc(money(c.cycleSpent)) + '</span><span class="hint">of ' + esc(money(c.disc)) + '</span></div>' +
    '<div class="prog"><span style="width:' + pct.toFixed(1) + '%;background:' + (paceBad ? 'var(--bad)' : 'var(--ink)') + '"></span></div>' +
    '<p style="color:var(--ink-2)">At this pace you’ll reach <span class="iso" style="color:' + (projected > c.disc ? 'var(--bad)' : 'var(--good)') + ';font-weight:500">' + esc(money(projected)) + '</span> by the end of the cycle, ' + (projected > c.disc ? esc(money(projected - c.disc)) + ' more than you have.' : 'with ' + esc(money(c.disc - projected)) + ' to spare.') + '</p>' +
    (savedCycle > 0 ? '<p class="hint">Plus ' + esc(money(savedCycle)) + ' moved to goals this cycle.</p>' : '') + '</section>';
  h += '<section class="card"><div class="row between"><span class="label">Day by day</span><span class="hint">' + (pastDays ? 'Over on ' + overDays + ' of ' + plural(pastDays, 'day') : 'First day of the cycle') + '</span></div>' +
    '<div class="chart-box"><canvas id="ch-days" role="img" aria-label="Daily spending this cycle compared with your base budget"></canvas></div>' +
    '<div class="legend"><span><i class="sw" style="background:var(--faint)"></i>Under base</span><span><i class="sw" style="background:var(--bad)"></i>Over base</span><span><i class="sw" style="background:var(--accent)"></i>Today</span><span><i class="dash"></i>' + esc(money(c.base)) + ' base</span></div></section>';
  if (keys.length) {
    var top = tot[keys[0]], perCycle = top.a / c.cy.dayIndex * c.cy.days;
    h += '<section class="leak"><span class="eyebrow">Your biggest leak</span><h2 class="h2" style="font-size:28px">' + esc(CATS[keys[0]].label) + '</h2>' +
      '<p style="color:var(--ink-2)">' + esc(money(top.a)) + ' across ' + plural(top.n, 'spend') + ' this cycle. That’s one every ' + (c.cy.dayIndex / top.n).toFixed(1) + ' days, averaging ' + esc(money(top.a / top.n)) + '.</p>' +
      '<p class="keep"><span>Halve it and keep about ' + esc(money(perCycle / 2)) + ' a cycle, or ' + esc(money(perCycle * 6)) + ' a year.</span>' + (capFor(keys[0]) ? '' : ' <span>Set a limit for it in Plan.</span>') + '</p></section>';
    h += '<section class="card"><span class="label">By category</span><div class="donut-wrap"><canvas id="ch-donut" role="img" aria-label="Share of spending by category"></canvas><div class="donut-center"><span class="eyebrow">Spent</span><span class="num md">' + esc(money(c.cycleSpent, { compact: c.cycleSpent >= 100000 })) + '</span></div></div><div>' +
      keys.map(function (k) {
        var t = tot[k], cap = capFor(k), barPct = cap ? Math.min(100, t.a / cap * 100) : t.a / tot[keys[0]].a * 100, overCap = cap && t.a > cap;
        return '<div class="crow"><span class="tile" style="--c:' + CATS[k].color + '">' + ic(k, 18) + '</span><div class="grow"><div class="row between"><span style="font-size:15px">' + esc(CATS[k].label) + '</span><span class="amt">' + esc(money(t.a)) + '</span></div><div class="cbar" style="--c:' + (overCap ? 'var(--bad)' : CATS[k].color) + '"><span style="width:' + barPct.toFixed(1) + '%"></span></div><span class="hint" style="margin-top:4px">' + plural(t.n, 'spend') + ' · avg ' + esc(money(t.a / t.n)) + (cap ? ' · limit ' + esc(money(cap)) + (overCap ? ', ' + esc(money(t.a - cap)) + ' over' : '') : ' · ' + (c.cycleSpent ? Math.round(t.a / c.cycleSpent * 100) : 0) + '%') + '</span>' + (k === 'food' ? mealSplit(c.cyc) : '') + '</div></div>';
      }).join('') + '</div></section>';
  } else {
    h += '<section class="card"><p class="hint">Log a few spends and your biggest leaks show up here.</p></section>';
  }
  var subs = detectSubs(S.p);
  if (subs.length) h += '<button type="button" class="alert info" data-act="go-bills"><span class="tile" style="--c:var(--accent)">' + ic('repeat', 18) + '</span><div class="grow"><strong>' + plural(subs.length, 'subscription') + ' spotted</strong><span class="hint">About ' + esc(money(subs.reduce(function (a, s) { return a + s.yearly; }, 0))) + ' a year. See which ones you still use.</span></div>' + ic('chev', 18) + '</button>';
  var board = payeeBoard(c.cyc).slice(0, 5);
  if (board.length) {
    h += '<section class="card tight"><div class="row between" style="padding:16px 0 4px"><span class="label">Top payees this cycle</span><span class="hint">By amount</span></div>' +
      board.map(function (p, i) {
        var cat = CATS[p.cat] || CATS.other;
        return '<div class="wk-row"><span class="when"><b>' + (i + 1) + '</b></span><div class="grow"><strong style="font-size:15px">' + esc(p.name) + '</strong><span class="hint">' + dots([cat.short, plural(p.n, 'time') + ' · avg ' + money(p.a / p.n)]) + '</span></div><span class="amt">' + esc(money(p.a)) + '</span></div>';
      }).join('') + '<div style="height:6px"></div></section>';
  }
  if (c.cyc.length) {
    var tod = todSplit(c.cyc), tmax = Math.max.apply(null, tod.map(function (b) { return b.a; }).concat([1])), peak = tod.slice().sort(function (a, b) { return b.a - a.a; })[0];
    h += '<section class="card"><div class="row between"><span class="label">When you spend</span><span class="hint">This cycle</span></div>' +
      tod.map(function (b) {
        return '<div class="stack-xs"><div class="row between"><span style="font-size:14px">' + esc(b.label) + ' <span class="hint">' + esc(b.range) + '</span></span><span class="amt" style="font-size:14px">' + esc(money(b.a)) + '</span></div><div class="cbar" style="--c:' + (b === peak ? 'var(--accent)' : 'var(--faint)') + ';margin-top:0"><span style="width:' + (b.a / tmax * 100).toFixed(1) + '%"></span></div></div>';
      }).join('') +
      (peak && peak.a ? '<p class="hint">Most of your spending happens ' + ({ 'Early morning': 'early in the morning', 'Morning': 'in the morning', 'Midday': 'around midday', 'Afternoon': 'in the afternoon', 'Evening': 'in the evening', 'Late night': 'late at night' }[peak.label] || 'then') + ' (' + esc(peak.range) + '): ' + Math.round(peak.a / Math.max(c.cycleSpent, 1) * 100) + '% of this cycle.</p>' : '') + '</section>';
  }
  h += '<p class="hint pad">Plus ' + esc(money(c.fixedTotal)) + ' in fixed costs, set aside before any of this. Spends tagged Rent & bills don’t count against your daily budget.</p>';
  if (c.cyc.length) h += '<button type="button" class="btn quiet block" data-act="share-cycle">' + ic('share', 18) + ' <span>Share this cycle</span></button>';
  return h;
}

function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }

function drawCharts() {
  charts.forEach(function (ch) { try { ch.destroy(); } catch (e) { } }); charts = [];
  if (!window.Chart || !S.p || S.tab !== 'insights') return;
  var c = calc(S.p), muted = cssVar('--muted'), line = cssVar('--line'), ink = cssVar('--ink'), faint = cssVar('--faint'), bad = cssVar('--bad'), accent = cssVar('--accent');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  Chart.defaults.font.family = "'Hanken Grotesk', 'Helvetica Neue', Arial, sans-serif";
  Chart.defaults.font.weight = 400;
  Chart.defaults.color = muted;
  var labels = [], data = [], colors = [], cs = c.cy.start;
  for (var i = 0; i < c.cy.days; i++) {
    var d = new Date(cs.getFullYear(), cs.getMonth(), cs.getDate() + i), e = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    labels.push(d.getDate());
    if (d.getTime() > c.t0) { data.push(null); colors.push(line); }
    else { var v = spentBetween(d.getTime(), e.getTime()); data.push(Math.round(v * 100) / 100); colors.push(d.getTime() === c.t0 ? accent : (v > c.base ? bad : faint)); }
  }
  var tipCb = {
    title: function (it) { return trText('Day ' + it[0].label); },
    label: function (it) { return trText(it.datasetIndex === 1 ? 'Base ' + money(it.raw) : 'Spent ' + money(it.raw)); }
  };
  var el = $('#ch-days');
  if (el) charts.push(new Chart(el, {
    data: { labels: labels, datasets: [
      { type: 'bar', data: data, backgroundColor: colors, borderRadius: 2, borderSkipped: false, barPercentage: 0.62, categoryPercentage: 0.9, order: 2 },
      { type: 'line', data: labels.map(function () { return c.base; }), borderColor: ink, borderWidth: 1, borderDash: [3, 4], pointRadius: 0, pointHoverRadius: 0, order: 1 }
    ] },
    options: { responsive: true, maintainAspectRatio: false, animation: reduce ? false : { duration: 500 },
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { display: false }, tooltip: { filter: function (it) { return it.raw != null; }, backgroundColor: cssVar('--notif-bg'), titleColor: cssVar('--notif-ink'), bodyColor: cssVar('--notif-ink'), padding: 10, cornerRadius: 10, displayColors: false, callbacks: tipCb } },
      scales: { x: { reverse: LANGS[LANG].dir === 'rtl', grid: { display: false }, border: { color: line }, ticks: { color: muted, maxTicksLimit: 8, maxRotation: 0, font: { size: 11 } } }, y: { position: LANGS[LANG].dir === 'rtl' ? 'right' : 'left', beginAtZero: true, grid: { color: line, drawTicks: false }, border: { display: false }, ticks: { color: muted, maxTicksLimit: 4, padding: 8, font: { size: 11 }, callback: function (v) { return money(v, { compact: true }); } } } } }
  }));
  var tot = catTotals(c.cyc), keys = Object.keys(tot).sort(function (a, b) { return tot[b].a - tot[a].a; });
  var dn = $('#ch-donut');
  if (dn && keys.length) charts.push(new Chart(dn, {
    type: 'doughnut',
    data: { labels: keys.map(function (k) { return trText(CATS[k].short); }), datasets: [{ data: keys.map(function (k) { return tot[k].a; }), backgroundColor: keys.map(function (k) { return CATS[k].color; }), borderColor: cssVar('--surface'), borderWidth: 2, hoverOffset: 4 }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: '84%', animation: reduce ? false : { duration: 600 }, plugins: { legend: { display: false }, tooltip: { backgroundColor: cssVar('--notif-bg'), bodyColor: cssVar('--notif-ink'), padding: 10, cornerRadius: 10, callbacks: { label: function (it) { return ' ' + it.label + ': ' + money(it.raw); } } } } }
  }));
}
