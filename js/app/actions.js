/* BasKar · js/app/actions.js
   The click dispatcher (data-act → ACT[name]) and form handlers. Feature files register their own actions.
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

var ACT = {};

/* Shared actions. Feature files add their own with Object.assign(ACT, { … }). */
Object.assign(ACT, {
  tab: function (el) { S.tab = el.dataset.tab; if (S.tab === 'plan') S.plan = planFrom(S.p); S.showJson = false; S.showImport = false; S.actLimit = 60; renderAll(); toTop(); },
  'money-seg': function (el) { S.money = el.dataset.k; renderAll(); },
  'toast-close': function () { hideToast(); },
  'toast-undo': function () { var fn = S.toastUndo; S.toastUndo = null; hideToast(); if (fn) setTimeout(fn, 240); },
  refresh: function (el) {
    if (el.classList.contains('spin')) return;
    el.classList.add('spin'); el.setAttribute('aria-busy', 'true');
    try { sessionStorage.setItem('bk_refreshed', '1'); } catch (e) { }
    var gone = false;
    function go() { if (gone) return; gone = true; try { location.reload(); } catch (e) { } }
    try { fetch(location.href.split('#')[0], { cache: 'reload', credentials: 'same-origin' }).then(go, go); } catch (e) { go(); }
    setTimeout(go, 3000);
    setTimeout(function () { el.classList.remove('spin'); el.removeAttribute('aria-busy'); try { sessionStorage.removeItem('bk_refreshed'); } catch (e) { } renderAll(); toast('Refreshed', 'Your data was reloaded from this device.'); }, 7000);
  },
  close: function () { closeSheet(); },
  'sheet-bg': function (el, e) { if (e.target === el) closeSheet(); }
});

document.addEventListener('click', function (e) {
  var el = e.target.closest('[data-act]');
  if (!el) return;
  var fn = ACT[el.dataset.act];
  if (fn) fn(el, e);
});

function onField(e) {
  var el = e.target;
  if (el.id === 'b-logo') { if (e.type === 'change') processLogo(el.files && el.files[0]); return; }
  if (el.id === 'pf-photo') { if (e.type === 'change' && el.files && el.files[0]) { processPhoto(el.files[0]); el.value = ''; } return; }
  if (el.id === 'bk-file') {
    if (e.type !== 'change' || !el.files || !el.files[0]) return;
    var bf = el.files[0], br = new FileReader();
    br.onload = function () { try { restoreFrom(String(br.result || '')); } catch (x) { toast('Couldn’t restore', 'That isn’t a BasKar backup file.'); } };
    br.onerror = function () { toast('Couldn’t restore', 'That isn’t a BasKar backup file.'); };
    br.readAsText(bf); el.value = '';
    return;
  }
  if (el.id === 'csv-file') {
    if (e.type !== 'change' || !el.files || !el.files[0]) return;
    var f = el.files[0], fr = new FileReader();
    if (f.size > 10 * 1024 * 1024) { var er = $('#csv-err'); if (er) { er.textContent = 'That file is over 10 MB. Export a shorter date range from your bank.'; er.hidden = false; } return; }
    fr.onload = function () { loadCsv(String(fr.result || '')); };
    fr.onerror = function () { var er2 = $('#csv-err'); if (er2) { er2.textContent = 'Couldn’t read that file. Try saving it again as CSV.'; er2.hidden = false; } };
    fr.readAsText(f);
    return;
  }
  if (el.dataset && el.dataset.sms !== undefined && S.sheet && S.sheet.items) {
    S.sheet.items[+el.dataset.sms].on = el.checked;
    var n = smsAddable(S.sheet), btn = $('#sms-add');
    if (btn) { btn.textContent = 'Add ' + plural(n, 'transaction'); btn.disabled = !n; }
    return;
  }
  if (el.id === 't-when' && S.sheet && S.sheet.type === 'txn') { syncMeal(); return; }
  if (el.id === 't-quick' && S.sheet && S.sheet.type === 'txn') { if (e.type === 'input') applyQuick(el.value); return; }
  if (el.dataset && el.dataset.smscat !== undefined && S.sheet && S.sheet.items) {
    if (e.type !== 'change') return;
    var it = S.sheet.items[+el.dataset.smscat]; it.cat = el.value;
    if (it.cat === 'food') { if (!it.meal) it.meal = mealFor(it.ts); } else it.meal = '';
    renderSheet(); return;
  }
  if (el.dataset && el.dataset.fx !== undefined && S.sheet && S.sheet.items) {
    S.sheet.fx = S.sheet.fx || {}; S.sheet.fx[el.dataset.fx] = el.value;
    /* Update the rows and button in place: re-rendering the whole sheet here would swallow a tap on Add. */
    var list = $('#sms-list'); if (list) list.innerHTML = brandify(S.sheet.items.map(smsRow).join(''), true);
    var ab = $('#sms-add'), an = smsAddable(S.sheet); if (ab) { ab.textContent = 'Add ' + plural(an, 'transaction'); ab.disabled = !an; }
    return;
  }
  if (el.dataset && el.dataset.smsmeal !== undefined && S.sheet && S.sheet.items) { S.sheet.items[+el.dataset.smsmeal].meal = el.value; return; }
  if (el.dataset && el.dataset.smsnote !== undefined && S.sheet && S.sheet.items) { S.sheet.items[+el.dataset.smsnote].note = el.value; return; }
  if (el.dataset && S.sheet && S.sheet.type === 'csv' && e.type === 'change') {
    if (el.dataset.csvmap !== undefined) { S.sheet.map[el.dataset.csvmap] = el.value; renderSheet(); return; }
    if (el.dataset.csvsign !== undefined) { S.sheet.sign = el.value; renderSheet(); return; }
    if (el.dataset.csvwallet !== undefined) { S.sheet.wallet = el.value; renderSheet(); return; }
  }
  if (el.dataset && el.dataset.b !== undefined && S.brandDraft) {
    S.brandDraft[el.dataset.b] = el.value;
    if (el.dataset.b === 'accent' && HEX_RE.test(el.value)) {
      applyBrand(S.brandDraft);
      var ch = $('#b-contrast'); if (ch) ch.textContent = contrast(el.value, '#FFFFFF') < 4.5 ? 'This colour is light for text on white. A darker shade will read better.' : 'Used for savings, streaks and today’s bar. Dark mode gets a lighter version automatically.';
    }
    var bp = $('#b-preview'); if (bp) bp.innerHTML = brandPreview(S.brandDraft);
    return;
  }
  if (el.dataset && el.dataset.d !== undefined && S.draft) {
    setPath(S.draft, el.dataset.d, el.value);
    if (el.dataset.d === 'currency') { var s = $('#cur-sym'); if (s) s.textContent = curSymbol(el.value); }
    var pv = $('#create-preview'); if (pv) pv.innerHTML = previewHtml(S.draft.income, S.draft.fixed, S.draft.cycleStart, S.draft.currency);
    return;
  }
  if (el.dataset && el.dataset.pl !== undefined && S.plan) {
    setPath(S.plan, el.dataset.pl, el.value);
    if (el.dataset.pl === 'currency') { var s2 = $('#pl-sym'); if (s2) s2.textContent = curSymbol(el.value); }
    var pp = $('#plan-preview'); if (pp) pp.innerHTML = previewHtml(S.plan.income, S.plan.fixed, S.plan.cycleStart, S.plan.currency);
    return;
  }
  if (el.id === 'f-q') { S.filter.q = el.value; S.actLimit = 60; $('#act-list').innerHTML = activityList(); return; }
  if ((el.id === 'f-acct' || el.id === 'f-cat') && e.type === 'change') { S.filter[el.id === 'f-acct' ? 'acct' : 'cat'] = el.value; S.actLimit = 60; $('#act-list').innerHTML = activityList(); }
}

document.addEventListener('input', onField);

document.addEventListener('change', onField);

document.addEventListener('submit', function (e) {
  e.preventDefault();
  var id = e.target.id;
  if (id === 'signin-form') signIn(S.auth.pick, $('#si-pw').value);
  else if (id === 'create-form') createStep();
  else if (id === 'txn-form') saveTxn();
  else if (id === 'wallet-form') saveWallet();
  else if (id === 'plan-form') savePlan();
  else if (id === 'goal-form') saveGoal();
  else if (id === 'contrib-form') saveContrib();
  else if (id === 'brand-form') saveBrand();
  else if (id === 'profile-form') saveProfileInfo();
  else if (id === 'pw-form') changePassword();
});

document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && S.sheet) closeSheet(); });

document.addEventListener('scroll', function (e) { if (e.target && e.target.classList && e.target.classList.contains('sheet-body')) sheetShadow(); }, true);

try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { if (S.tab === 'insights') drawCharts(); }); } catch (e) { }

try {
  new MutationObserver(function () {
    if (!applyingTheme) {
      hostTheme = document.documentElement.getAttribute('data-theme');
      var t = S.p && S.p.settings ? S.p.settings.theme : 'system';
      if (t === 'light' || t === 'dark') applyTheme();
    }
    if (S.tab === 'insights') drawCharts();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
} catch (e) { }
