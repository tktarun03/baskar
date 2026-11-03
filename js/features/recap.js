/* BasKar · js/features/recap.js
   Tonight’s recap (nightly receipt).
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

function sheetRecap() {
  var c = calc(S.p), roastOn = S.p.settings.roast, m = meta() || {};
  var title, body;
  if (c.usedToday === 0) { title = roastOn ? 'A zero-spend day?!' : 'No spending today'; body = ['You spent nothing out of ' + money(c.todayBudget) + '.']; if (roastOn) body.push('Either you’re a monk or you forgot to log something.'); }
  else if (c.over) { title = roastOn ? 'Congratulations.' : 'Over budget today'; body = ['Your daily budget was ' + money(c.todayBudget) + ' and you spent ' + money(c.spentToday) + '.', roastOn ? 'You are officially working to fund your own bad decisions.' : 'Tomorrow’s allowance adjusts to cover it.']; }
  else { title = roastOn ? 'Shabash! Under budget.' : 'Under budget today'; body = ['Your daily budget was ' + money(c.todayBudget) + ' and you spent ' + money(c.spentToday) + '.', 'You kept ' + money(c.left) + '.']; }
  if (c.savedToday) body.push('You also moved ' + money(c.savedToday) + ' to your goals.');
  var stamp = c.usedToday === 0 ? 'ZERO DAY' : c.over ? (roastOn ? 'BAS KAR' : 'OVER') : (roastOn ? 'SHABASH' : 'ON TRACK');
  var sc = c.over ? 'var(--stamp-bad)' : 'var(--stamp-good)';
  var todayAll = S.p.txns.filter(function (t) { return t.ts >= c.t0 && t.ts < c.t1 && counts(t); }).sort(function (a, b) { return a.ts - b.ts; });
  var items = todayAll.map(function (t) {
    var name = t.kind === 'save' ? '→ ' + ((goalById(t.goal) || {}).name || 'GOAL') : (t.merchant || CATS[t.cat].short) + (t.cat === 'food' && MEALS[t.meal] ? ' · ' + MEALS[t.meal] : '');
    return '<div class="line"><span class="rmuted">' + esc(fmtTime(t.ts)) + '</span><span style="max-width:46%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(name.toUpperCase()) + '</span><span class="lead"></span><span>' + esc(money(t.amt)) + '</span></div>';
  }).join('');
  var tomorrowNote = c.tomorrow === null ? 'A new cycle starts tomorrow, with a fresh daily allowance.' : c.tomorrow < c.base - 0.5 ? 'Down from your ' + money(c.base) + ' base. Today is spread over the ' + plural(c.cy.daysLeft - 1, 'day') + ' left.' : 'At or above your ' + money(c.base) + ' base. Unspent money carries forward.';
  var move = '';
  if (c.left >= 1 && S.p.goals.length) {
    move = '<section class="card"><span class="label">Put today’s ' + esc(money(c.left)) + ' to work</span>' +
      '<div class="field"><label for="r-goal" class="hint">Goal</label><select id="r-goal" class="input">' + S.p.goals.map(function (g) { return '<option value="' + esc(g.id) + '">' + esc(g.name) + ' · ' + esc(money(goalSaved(g))) + ' of ' + esc(money(g.target)) + '</option>'; }).join('') + '</select></div>' +
      '<button type="button" class="btn block" data-act="recap-move">Move ' + esc(money(Math.floor(c.left))) + ' to this goal</button><p class="hint">Moved money won’t roll into tomorrow, so it can’t be spent twice.</p></section>';
  } else if (c.left >= 1) {
    move = '<button type="button" class="btn ghost block" data-act="go-goals">' + ic('target', 18) + ' Create a goal for money you don’t spend</button>';
  }
  return sheetHead('Tonight’s recap') +
    '<div class="notif"><span class="appicon">' + appIcon(moodOf(c)) + '</span><div class="grow"><div class="row between"><strong>' + esc(title) + '</strong><span class="notif-time">10:00 PM</span></div><p>' + body.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join(' ') + '</p></div></div>' +
    '<div class="receipt-wrap"><div class="receipt"><div class="rhead"><strong style="letter-spacing:.2em;font-size:14px">BASKAR</strong><span style="letter-spacing:.1em">' + (roastOn ? 'BILL OF BAD DECISIONS' : 'DAILY SUMMARY') + '</span><span class="rmuted">' + esc(fmtDate(Date.now(), { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()) + ' · ' + esc(firstName(m.name).toUpperCase()) + '</span></div><div class="rule"></div>' +
    (items || '<span style="text-align:center;padding:6px 0">' + (roastOn ? 'NO ITEMS. SUSPICIOUS.' : 'NO SPENDS LOGGED.') + '</span>') +
    '<div class="rule"></div><div class="line"><span>SPENT</span><span class="lead"></span><strong>' + esc(money(c.spentToday)) + '</strong></div>' + (c.savedToday ? '<div class="line"><span>SAVED</span><span class="lead"></span><strong>' + esc(money(c.savedToday)) + '</strong></div>' : '') + '<div class="line"><span>BUDGET</span><span class="lead"></span><strong>' + esc(money(c.todayBudget)) + '</strong></div>' +
    '<div class="line" style="font-size:14px;color:' + sc + '"><strong>' + (c.over ? 'OVER BY' : 'KEPT') + '</strong><span class="lead"></span><strong>' + esc(money(Math.abs(c.left))) + '</strong></div>' +
    '<span class="stamp" style="--sc:' + sc + '">' + stamp + '</span></div><div class="receipt-edge"></div></div>' +
    move +
    '<section class="card"><span class="eyebrow">Tomorrow’s allowance</span><span class="num xl" style="color:' + (c.tomorrow !== null && c.tomorrow < c.base - 0.5 ? 'var(--bad)' : 'var(--ink)') + '">' + (c.tomorrow === null ? 'New cycle' : esc(money(c.tomorrow))) + '</span><p class="hint">' + esc(tomorrowNote) + '</p></section>' +
    '<div class="duo">' + shareButton('share-recap', 'Share') + '<button type="button" class="btn quiet" data-act="close">Done</button></div>';
}

/* Actions (data-act="…") for this feature. */
Object.assign(ACT, {
  recap: function () { S.sheet = { type: 'recap' }; renderSheet(); },
  'recap-move': function () { var c = calc(S.p), sel = $('#r-goal'); if (!sel || c.left < 1) return; addContribution(sel.value, Math.floor(c.left)); }
});
