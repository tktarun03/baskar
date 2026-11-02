/* BasKar · js/app/render.js
   Rendering: renderAll, the tab layout, the bottom-sheet framework and notices (toast).
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

var TABS = [['today', 'Today', 'clock'], ['activity', 'Activity', 'list'], ['insights', 'Insights', 'chart'], ['money', 'Money', 'wallet'], ['plan', 'Plan', 'sliders']];

function renderMain() {
  var c = calc(S.p), m = meta() || { name: '?' };
  var hr = new Date().getHours();
  var titles = { today: (hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening'), activity: 'Activity', insights: 'Where it went', money: 'Money', plan: 'Your plan' };
  var line = esc(fmtDate(Date.now(), { weekday: 'long', day: 'numeric', month: 'long' })) + ' · <span>Day ' + c.cy.dayIndex + ' of ' + c.cy.days + '</span>';
  var hide = hidden();
  var h = '<header class="app-head"><button type="button" class="avatar-btn" data-act="settings" aria-label="Settings and accounts">' + avatar(m, 42) + '<span class="gear" aria-hidden="true">' + ic('gear', 12) + '</span></button><div class="grow"><span class="hint">' + line + '</span><h1 class="h2"><span>' + esc(titles[S.tab]) + '</span>' + (S.tab === 'today' ? '<span>, ' + esc(firstName(m.name)) + '</span>' : '') + '</h1></div>' +
    headMark() + (S.p.demo ? '<span class="badge head-badge" style="--c:var(--warn)"><i></i>Example</span>' : '') +
    '<div class="head-actions"><button type="button" class="icon-btn" data-act="refresh" aria-label="Refresh">' + ic('refresh', 18) + '</button>' +
    '<button type="button" class="icon-btn" data-act="privacy" aria-pressed="' + hide + '" aria-label="' + (hide ? 'Show amounts' : 'Hide amounts') + '">' + ic(hide ? 'eyeoff' : 'eye', 18) + '</button></div></header>';
  if (S.tab === 'today') h += renderToday(c);
  else if (S.tab === 'activity') h += renderActivity();
  else if (S.tab === 'insights') h += renderInsights(c);
  else if (S.tab === 'money') h += renderMoney(c);
  else h += renderPlan(c);
  return h;
}

function renderChrome() {
  var h = '<nav class="tabbar" aria-label="Main"><div class="tabbar-inner">' + TABS.map(function (t) { return '<button type="button" class="tab" data-act="tab" data-tab="' + t[0] + '"' + (S.tab === t[0] ? ' aria-current="page"' : '') + '><span class="pill">' + ic(t[2], 22) + '</span><span class="tab-lbl">' + t[1] + '</span></button>'; }).join('') + '</div></nav>';
  if (S.tab !== 'plan') h += '<button type="button" class="fab" data-act="add" aria-label="Add a spend">' + ic('plus', 24) + '</button>';
  return h;
}

function renderSheet() {
  var root = $('#sheet-root');
  if (!S.sheet || (!S.p && S.sheet.type !== 'brand' && S.sheet.type !== 'history')) { root.innerHTML = ''; root.removeAttribute('data-type'); return; }
  var sh = S.sheet, inner = '', prevSheet = root.querySelector('.sheet-body'), prevTop = prevSheet ? prevSheet.scrollTop : 0, same = !!prevSheet && root.getAttribute('data-type') === sh.type;
  if (sh.type === 'brand') {
    root.innerHTML = sheetFrame(sheetBrand(), same);
    root.setAttribute('data-type', sh.type);
    if (same) root.querySelector('.sheet-body').scrollTop = prevTop;
    return;
  }
  if (sh.type === 'txn') inner = sheetTxn(sh);
  else if (sh.type === 'wallet') inner = sheetWallet(sh);
  else if (sh.type === 'profiles') inner = sheetProfiles();
  else if (sh.type === 'recap') inner = sheetRecap();
  else if (sh.type === 'goal') inner = sheetGoal(sh);
  else if (sh.type === 'contrib') inner = sheetContrib(sh);
  else if (sh.type === 'sms') inner = sheetSms(sh);
  else if (sh.type === 'csv') inner = sheetCsv(sh);
  else if (sh.type === 'csvout') inner = sheetCsvOut(sh);
  else if (sh.type === 'week') inner = sheetWeek();
  else if (sh.type === 'tpl') inner = sheetTpl();
  else if (sh.type === 'settings') inner = sheetSettings();
  else if (sh.type === 'rules') inner = sheetRules();
  else if (sh.type === 'storage') inner = sheetStorage();
  else if (sh.type === 'history') inner = sheetHistory();
  else if (sh.type === 'selftest') inner = sheetSelfTest();
  root.innerHTML = brandify(sheetFrame(inner, same), true);
  root.setAttribute('data-type', sh.type);
  if (same) root.querySelector('.sheet-body').scrollTop = prevTop;
  sheetShadow();
}

function sheetFrame(inner, same) {
  var parts = inner.split('<!--/head-->'), head = parts.length > 1 ? parts[0] : '', body = parts.length > 1 ? parts.slice(1).join('') : inner;
  return '<div class="sheet-wrap' + (same ? ' still' : '') + '" data-act="sheet-bg"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">' +
    '<div class="sheet-top"><div class="grabber"></div>' + head + '</div><div class="sheet-body">' + body + '</div></div></div>';
}

function sheetShadow() { var b = document.querySelector('.sheet-body'); if (b && b.previousElementSibling) b.previousElementSibling.classList.toggle('scrolled', b.scrollTop > 2); }

function sheetHead(title) {
  var back = S.sheet && S.sheet.from === 'settings' ? '<button type="button" class="icon-btn" data-act="back-settings" aria-label="Back to settings">' + ic('back', 18) + '</button>' : '';
  return '<div class="row between"><div class="row" style="gap:10px;min-width:0">' + back + '<h2 id="sheet-title" class="h2" style="font-size:24px">' + esc(title) + '</h2></div><button type="button" class="icon-btn" data-act="close" aria-label="Close">' + ic('x', 18) + '</button></div><!--/head-->';
}

function setItem(act, icon, label, value) {
  return '<button type="button" class="set-item" data-act="' + act + '"><span class="tile" style="--c:var(--ink-2)">' + ic(icon, 18) + '</span><span class="grow"><span style="font-size:15px">' + label + '</span>' + (value ? '<span class="hint">' + value + '</span>' : '') + '</span>' + ic('chev', 18) + '</button>';
}

function closeSheet() { if (S.sheet && S.sheet.type === 'brand') { S.brandDraft = null; applyBrand(); } S.sheet = null; renderSheet(); }

function renderAll() {
  var app = $('#app'), old = $('#scroller'), prev = old ? old.scrollTop : 0;
  app.className = 'app' + (S.p ? '' : ' is-auth');
  app.innerHTML = brandify('<main class="scroller" id="scroller"><div class="col">' + (S.p ? renderMain() : renderAuth()) + '</div></main>' + (S.p ? renderChrome() : ''), true);
  var sc = $('#scroller'); if (sc) sc.scrollTop = prev;
  renderSheet();
  if (S.p && S.tab === 'insights') drawCharts(); else { charts.forEach(function (ch) { try { ch.destroy(); } catch (e) { } }); charts = []; }
}

var toastT;

function toast(title, body, opts) {
  var el = $('#toast');
  S.toastUndo = opts ? (opts.undo || (opts.action && opts.action.fn) || null) : null;
  var actLabel = opts && opts.action ? opts.action.label : 'Undo';
  el.innerHTML = '<div class="toast-body"><strong>' + esc(brandify(title)) + '</strong>' + (body ? '<span>' + esc(brandify(body)) + '</span>' : '') + '</div>' +
    (S.toastUndo ? '<button type="button" class="toast-act" data-act="toast-undo">' + esc(actLabel) + '</button>' : '') +
    '<button type="button" class="toast-x" data-act="toast-close" aria-label="Dismiss">' + ic('x', 16) + '</button>';
  clearTimeout(toastT); clearTimeout(toastOutT);
  el.hidden = false; el.classList.remove('show', 'out'); void el.offsetWidth; el.classList.add('show');
  toastT = setTimeout(hideToast, S.toastUndo ? 7000 : 4500);
}

var toastOutT;

function hideToast() {
  var el = $('#toast');
  if (el.hidden) return;
  clearTimeout(toastT);
  el.classList.remove('show'); el.classList.add('out');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  toastOutT = setTimeout(function () { el.hidden = true; el.classList.remove('out'); S.toastUndo = null; }, reduce ? 0 : 220);
}

/* Opens a sheet; when it was opened from Settings it gets a back arrow to Settings. */
function openSub(sheet) {
  sheet.from = S.sheet && S.sheet.type === 'settings' ? 'settings' : '';
  S.sheet = sheet; renderSheet();
  var s = document.querySelector('.sheet-body'); if (s) s.scrollTop = 0;
}

function toTop() { var sc = $('#scroller'); if (sc) sc.scrollTop = 0; }

function focusSoon(sel) { setTimeout(function () { var i = $(sel); if (i) try { i.focus(); } catch (e) { } }, 60); }

function setPath(obj, path, val) { var ks = path.split('.'), o = obj; for (var i = 0; i < ks.length - 1; i++) o = o[ks[i]]; o[ks[ks.length - 1]] = val; }

function goMoney(seg) { S.sheet = null; S.tab = 'money'; S.money = seg; renderAll(); toTop(); }
