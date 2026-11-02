/* BasKar · js/features/plan.js
   Plan tab: income, cycle, fixed costs, category limits.
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

function planFrom(p) {
  return { income: p.income, currency: p.currency, cycleStart: p.cycleStart,
    fixed: p.fixed.map(function (f) { return { id: f.id, label: f.label, amount: f.amount, day: f.day || '' }; }),
    caps: p.caps.map(function (k) { return { cat: k.cat, amount: k.amount }; }),
    roast: !!p.settings.roast, confirmDelete: false };
}

function capCatOptions(sel) { return Object.keys(CATS).filter(function (k) { return k !== 'bills'; }).map(function (k) { return '<option value="' + k + '"' + (sel === k ? ' selected' : '') + '>' + esc(CATS[k].label) + '</option>'; }).join(''); }

function renderPlan() {
  if (!S.plan) S.plan = planFrom(S.p);
  var pl = S.plan, m = meta() || {}, u = Store.usage('bk_p_' + S.pid, S.p), th = S.p.settings.theme || 'system';
  var h = '<form id="plan-form" class="stack" novalidate>' +
    '<section class="card"><span class="label">Income & cycle</span>' +
    '<div class="field"><label for="p-inc">Monthly take-home pay</label><div class="money-input sm"><span class="cur" id="pl-sym">' + esc(curSymbol(pl.currency)) + '</span><input id="p-inc" type="number" inputmode="decimal" step="any" min="0" data-pl="income" value="' + esc(pl.income) + '"></div></div>' +
    '<div class="field"><label for="p-cur">Currency</label><select id="p-cur" class="input" data-pl="currency">' + currencyOptions(pl.currency) + '</select><span class="hint">Changing currency relabels your amounts. It doesn’t convert them.</span></div>' +
    '<div class="field"><label for="p-cyc">Budget cycle starts on</label><select id="p-cyc" class="input" data-pl="cycleStart">' + cycleOptions(pl.cycleStart) + '</select></div></section>' +
    '<section class="card"><div class="row between"><span class="label">Fixed every month</span><button type="button" class="btn quiet sm" data-act="pl-add-fix">' + ic('plus', 16) + ' Add</button></div><p class="hint">Add a due day to see it on your bills calendar.</p>' +
    (pl.fixed.length ? pl.fixed.map(function (f, i) {
      return '<div class="frow2"><input class="input" aria-label="Fixed cost name" data-pl="fixed.' + i + '.label" value="' + esc(f.label) + '" placeholder="e.g. Rent"><button type="button" class="icon-btn" data-act="pl-del-fix" data-i="' + i + '" aria-label="Remove ' + esc(f.label || 'row') + '">' + ic('x', 16) + '</button>' +
        '<div class="sub"><input class="input" aria-label="Amount for ' + esc(f.label || 'fixed cost') + '" type="number" inputmode="decimal" step="any" min="0" data-pl="fixed.' + i + '.amount" value="' + esc(f.amount) + '" placeholder="Amount"><select class="input" aria-label="Due day for ' + esc(f.label || 'fixed cost') + '" data-pl="fixed.' + i + '.day">' + dueOptions(f.day) + '</select></div></div>';
    }).join('') : '<p class="hint">No fixed costs yet. Add rent, loans and subscriptions so they’re set aside first.</p>') +
    '</section>' +
    '<section class="preview" id="plan-preview" aria-live="polite">' + previewHtml(pl.income, pl.fixed, pl.cycleStart, pl.currency) + '</section>' +
    '<section class="card"><div class="row between"><span class="label">Category limits</span><button type="button" class="btn quiet sm" data-act="pl-add-cap">' + ic('plus', 16) + ' Add</button></div><p class="hint">A cap per cycle for the categories that leak. You’ll get a warning at 80% and when you cross it.</p>' +
    (pl.caps.length ? pl.caps.map(function (k, i) { return '<div class="frow"><select class="input" aria-label="Category for limit ' + (i + 1) + '" data-pl="caps.' + i + '.cat">' + capCatOptions(k.cat) + '</select><input class="input" aria-label="Limit amount" type="number" inputmode="decimal" step="any" min="0" data-pl="caps.' + i + '.amount" value="' + esc(k.amount) + '" placeholder="Limit"><button type="button" class="icon-btn" data-act="pl-del-cap" data-i="' + i + '" aria-label="Remove this limit">' + ic('x', 16) + '</button></div>'; }).join('') : '') +
    '</section>' +
    '<button type="submit" class="btn block">Save plan</button></form>';
  h += '<button type="button" class="alert info" data-act="settings"><span class="tile" style="--c:var(--ink-2)">' + ic('gear', 18) + '</span><div class="grow"><strong>More settings</strong><span class="hint">App name and branding, theme, payee rules, data, account and version history.</span></div>' + ic('chev', 18) + '</button>';
  return h;
}

function savePlan() {
  var pl = S.plan, curChanged = pl.currency !== S.p.currency, seen = {};
  S.p.income = num(pl.income);
  S.p.currency = pl.currency;
  S.p.cycleStart = parseInt(pl.cycleStart, 10) || 1;
  S.p.fixed = pl.fixed.filter(function (f) { return String(f.label).trim() || num(f.amount); }).map(function (f) { return { id: f.id || uid(), label: String(f.label).trim() || 'Fixed cost', amount: num(f.amount), day: parseInt(f.day, 10) || 0 }; });
  S.p.caps = pl.caps.filter(function (k) { if (!CATS[k.cat] || !(num(k.amount) > 0) || seen[k.cat]) return false; seen[k.cat] = 1; return true; }).map(function (k) { return { cat: k.cat, amount: num(k.amount) }; });
  if (curChanged) nfCache = {};
  saveProfile(); S.plan = planFrom(S.p); renderAll();
  toast('Plan saved', 'Safe to spend today: ' + money(calc(S.p).todayBudget) + '.');
}

/* Actions (data-act="…") for this feature. */
Object.assign(ACT, {
  'go-plan': function () { S.sheet = null; S.tab = 'plan'; S.plan = planFrom(S.p); renderAll(); toTop(); },
  'pl-add-fix': function () { S.plan.fixed.push({ id: uid(), label: '', amount: '', day: '' }); renderAll(); focusSoon('[data-pl="fixed.' + (S.plan.fixed.length - 1) + '.label"]'); },
  'pl-del-fix': function (el) { S.plan.fixed.splice(+el.dataset.i, 1); renderAll(); },
  'pl-add-cap': function () {
    var used = S.plan.caps.map(function (k) { return k.cat; });
    var free = Object.keys(CATS).filter(function (k) { return k !== 'bills' && used.indexOf(k) < 0; })[0] || 'other';
    S.plan.caps.push({ cat: free, amount: '' }); renderAll(); focusSoon('[data-pl="caps.' + (S.plan.caps.length - 1) + '.amount"]');
  },
  'pl-del-cap': function (el) { S.plan.caps.splice(+el.dataset.i, 1); renderAll(); },
  'pl-roast': function (el) { S.plan.roast = !S.plan.roast; el.setAttribute('aria-checked', String(S.plan.roast)); },
  'pl-delete': function (el) {
    if (!S.plan.confirmDelete) { S.plan.confirmDelete = true; el.textContent = 'Tap again to delete this account forever'; return; }
    var id = S.pid; signOut(true); deleteProfile(id); renderAll(); toast('Account deleted', 'Its data was removed from this browser.');
  },
  'reset-demo': function () { var keep = S.p.settings; S.p = demoProfile(); S.p.settings.theme = keep.theme; nfCache = {}; saveProfile(); S.plan = planFrom(S.p); S.tab = 'today'; renderAll(); toTop(); toast('Demo data reset', 'Fresh example month with goals, limits and subscriptions.'); }
});
