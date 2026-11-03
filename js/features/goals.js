/* BasKar · js/features/goals.js
   Savings goals and moving money into them.
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

function renderGoals(c) {
  var goals = S.p.goals, total = goals.reduce(function (a, g) { return a + goalSaved(g); }, 0);
  var h = '<section class="hero" style="gap:8px"><span class="eyebrow">Saved toward goals</span><span class="num big">' + esc(money(total)) + '</span><span class="hint">Fed by the money you don’t spend each day.</span></section>';
  if (!goals.length) h += '<section class="card"><h2 class="h3">Give your unspent money a job</h2><p class="hint">Create a goal like a trip or an emergency fund. Each night, the recap offers to move whatever you kept into it.</p></section>';
  h += goals.map(function (g) {
    var saved = goalSaved(g), target = num(g.target), pct = target > 0 ? Math.min(saved / target, 1) : 0;
    var days = Math.max(1, Math.round((Date.now() - (g.createdAt || Date.now())) / DAY)), rate = saved / days, remain = Math.max(target - saved, 0), eta;
    if (remain <= 0) eta = 'Goal reached. Chillar is throwing a party.';
    else if (rate > 0) eta = 'At this pace you’ll get there by ' + fmtDate(Date.now() + remain / rate * DAY, { month: 'short', year: 'numeric' }) + '.';
    else eta = 'Move today’s unspent money here from the nightly recap.';
    return '<section class="card"><div class="goal">' + ring(pct, 64) + '<div class="grow"><span class="h3">' + esc(g.name) + '</span><span class="hint">' + esc(money(saved)) + ' of ' + esc(money(target)) + '</span><span class="hint">' + esc(eta) + '</span></div></div>' +
      '<div class="row"><button type="button" class="btn sm grow-btn" data-act="add-contrib" data-id="' + esc(g.id) + '">Add money</button><button type="button" class="btn ghost sm grow-btn" data-act="edit-goal" data-id="' + esc(g.id) + '">Edit</button><button type="button" class="icon-btn" data-act="share-goal" data-id="' + esc(g.id) + '" aria-label="Share goal">' + ic('share', 18) + '</button></div></section>';
  }).join('');
  h += '<button type="button" class="btn ghost block" data-act="add-goal">' + ic('plus', 18) + ' New goal</button>';
  h += '<p class="hint pad">Money you move to a goal comes out of your daily allowance, so it can’t be spent twice. Today you have ' + esc(money(Math.max(c.left, 0))) + ' left to give.</p>';
  return h;
}

function sheetGoal(sh) {
  var g = sh.id ? goalById(sh.id) : null, saved = g ? goalSaved(g) : 0;
  return sheetHead(g ? 'Edit goal' : 'New goal') +
    '<form id="goal-form" class="stack" novalidate>' +
    '<div class="field"><label for="g-name">What are you saving for?</label><input id="g-name" class="input" value="' + (g ? esc(g.name) : '') + '" placeholder="e.g. Goa trip, new laptop, emergency fund" required></div>' +
    '<div class="field"><label for="g-target">Target amount</label><div class="money-input"><span class="cur">' + esc(curSymbol(S.p.currency)) + '</span><input id="g-target" type="number" inputmode="decimal" step="any" min="0" value="' + (g ? esc(g.target) : '') + '" placeholder="0" required></div></div>' +
    '<p class="error" id="g-err" role="alert" hidden></p>' +
    '<button type="submit" class="btn block">' + (g ? 'Save goal' : 'Create goal') + '</button>' +
    (g ? '<button type="button" class="btn ghost block danger-text" data-act="del-goal">Delete goal' + (saved ? ' and return ' + esc(money(saved)) + ' to your budget' : '') + '</button>' : '') +
    '</form>';
}

function sheetContrib(sh) {
  var t = sh.id ? S.p.txns.filter(function (x) { return x.id === sh.id; })[0] : null, g = goalById(t ? t.goal : sh.goal), c = calc(S.p);
  var gname = g ? g.name : 'a deleted goal';
  return sheetHead(t ? 'Edit savings' : 'Add money') + '<p class="hint"><span>Goal</span>: ' + esc(gname) + '</p>' +
    '<form id="contrib-form" class="stack" novalidate>' +
    '<div class="field"><label for="k-amt">Amount</label><div class="money-input"><span class="cur">' + esc(curSymbol(S.p.currency)) + '</span><input id="k-amt" type="number" inputmode="decimal" step="any" min="0" value="' + (t ? esc(t.amt) : (c.left >= 1 ? Math.floor(c.left) : '')) + '" placeholder="0" required></div></div>' +
    '<p class="hint">' + (t ? 'Saved to ' + esc(gname) + ' on ' + esc(fmtDate(t.ts)) + '.' : 'This comes out of today’s allowance. You have ' + esc(money(Math.max(c.left, 0))) + ' left today.') + '</p>' +
    '<p class="error" id="k-err" role="alert" hidden></p>' +
    '<button type="submit" class="btn block">' + (t ? 'Save' : 'Move to goal') + '</button>' +
    (t ? '<button type="button" class="btn ghost block danger-text" data-act="del-contrib">Delete this saving</button>' : '') +
    '</form>';
}

function saveGoal() {
  var sh = S.sheet, name = $('#g-name').value.trim(), target = num($('#g-target').value), err = $('#g-err');
  if (!name) { err.textContent = 'Give the goal a name.'; err.hidden = false; $('#g-name').focus(); return; }
  if (!(target > 0)) { err.textContent = 'Set a target above zero.'; err.hidden = false; $('#g-target').focus(); return; }
  if (sh.id) S.p.goals = S.p.goals.map(function (g) { return g.id === sh.id ? Object.assign({}, g, { name: name, target: target }) : g; });
  else S.p.goals.push({ id: uid(), name: name, target: target, createdAt: Date.now() });
  saveProfile(); S.sheet = null; S.tab = 'money'; S.money = 'goals'; renderAll();
  toast(sh.id ? 'Goal saved' : 'Goal created', sh.id ? name : 'Feed it from tonight’s recap, or tap Add money.');
}

function saveContrib() {
  var sh = S.sheet, amt = num($('#k-amt').value), err = $('#k-err');
  if (!(amt > 0)) { err.textContent = 'Enter an amount above zero.'; err.hidden = false; $('#k-amt').focus(); return; }
  if (sh.id) { S.p.txns = S.p.txns.map(function (t) { return t.id === sh.id ? Object.assign({}, t, { amt: amt }) : t; }); saveProfile(); S.sheet = null; renderAll(); toast('Saving updated'); return; }
  addContribution(sh.goal, amt);
}

function addContribution(goalId, amt) {
  var g = goalById(goalId); if (!g) return;
  S.p.txns.push({ id: uid(), ts: Date.now(), kind: 'save', amt: amt, cat: 'savings', goal: g.id, merchant: g.name, wallet: '', note: '' });
  S.p.txns.sort(function (a, b) { return a.ts - b.ts; });
  saveProfile(); S.sheet = null; renderAll();
  var saved = goalSaved(g), target = num(g.target);
  toast(money(amt) + ' moved to ' + g.name, saved >= target ? 'Goal reached! ' + (S.p.settings.roast ? 'Chillar is throwing a party.' : '') : Math.round(saved / target * 100) + '% of the way there.' + (S.p.settings.roast ? ' Chillar approves.' : ''));
}

/* Actions (data-act="…") for this feature. */
Object.assign(ACT, {
  'go-goals': function () { goMoney('goals'); S.sheet = { type: 'goal' }; renderSheet(); focusSoon('#g-name'); },
  'add-goal': function () { S.sheet = { type: 'goal' }; renderSheet(); focusSoon('#g-name'); },
  'edit-goal': function (el) { S.sheet = { type: 'goal', id: el.dataset.id }; renderSheet(); },
  'del-goal': function (el) {
    if (!S.sheet.confirmDel) { S.sheet.confirmDel = true; el.textContent = 'Tap again to delete this goal'; return; }
    var id = S.sheet.id; S.p.goals = S.p.goals.filter(function (g) { return g.id !== id; }); S.p.txns = S.p.txns.filter(function (t) { return !(t.kind === 'save' && t.goal === id); });
    saveProfile(); S.sheet = null; renderAll(); toast('Goal deleted', 'Its savings went back into your budget.');
  },
  'add-contrib': function (el) { S.sheet = { type: 'contrib', goal: el.dataset.id }; renderSheet(); focusSoon('#k-amt'); },
  'del-contrib': function () {
    var gone = removeTxns([S.sheet.id]); S.sheet = null; renderAll();
    toast('Saving deleted', 'The money is back in your budget.', { undo: undoDelete(gone) });
  }
});
