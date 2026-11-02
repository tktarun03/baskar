/* BasKar · js/app/state.js
   App state (S), profiles, theme, migrate() and saving.
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

var S = { index: { v: 1, profiles: [] }, pid: null, p: null, tab: 'today', money: 'goals', auth: { mode: 'home' }, draft: null, step: 1, err: '', sheet: null, plan: null, filter: { acct: 'all', cat: 'all', q: '' }, actLimit: 60, showJson: false, showImport: false, warned: false };

var charts = [];

var hostTheme = document.documentElement.getAttribute('data-theme'), applyingTheme = false;

function meta(pid) { var id = pid || S.pid; for (var i = 0; i < S.index.profiles.length; i++) if (S.index.profiles[i].id === id) return S.index.profiles[i]; return null; }

function initials(name) { var w = String(name || '?').replace(/^demo\s*·\s*/i, '').trim().split(/\s+/); return ((w[0] || '?').charAt(0) + (w[1] ? w[1].charAt(0) : '')).toUpperCase(); }

function firstName(name) { return String(name || '').replace(/^demo\s*·\s*/i, '').trim().split(/\s+/)[0] || 'there'; }

function avatar(m, size) { size = size || 40; return '<span class="avatar" style="width:' + size + 'px;height:' + size + 'px;font-size:' + Math.round(size * 0.36) + 'px">' + esc(initials(m.name)) + '</span>'; }

function walletName(id) { var w = (S.p.wallets || []).filter(function (x) { return x.id === id; })[0]; return w ? w.name : 'No wallet'; }

function walletBalance(w) { return num(w.opening) + S.p.txns.reduce(function (s, t) { if (t.wallet !== w.id || t.kind === 'save') return s; return t.kind === 'income' ? s + t.amt : s - t.amt; }, 0); }

function goalById(id) { return S.p.goals.filter(function (g) { return g.id === id; })[0] || null; }

function goalSaved(g) { return S.p.txns.reduce(function (s, t) { return t.kind === 'save' && t.goal === g.id ? s + t.amt : s; }, 0); }

function capFor(cat) { var k = S.p.caps.filter(function (x) { return x.cat === cat && num(x.amount) > 0; })[0]; return k ? num(k.amount) : 0; }

function applyTheme() {
  var t = S.p && S.p.settings ? S.p.settings.theme : 'system', root = document.documentElement;
  applyingTheme = true;
  if (t === 'light' || t === 'dark') root.setAttribute('data-theme', t);
  else if (hostTheme) root.setAttribute('data-theme', hostTheme);
  else root.removeAttribute('data-theme');
  setTimeout(function () { applyingTheme = false; }, 0);
}

function migrate(p) {
  p = p || {};
  p.v = 3;
  p.currency = p.currency || 'USD';
  p.income = num(p.income);
  p.cycleStart = parseInt(p.cycleStart, 10) || 1;
  p.fixed = Array.isArray(p.fixed) ? p.fixed : [];
  p.fixed.forEach(function (f) { if (!f.id) f.id = uid(); });
  p.wallets = Array.isArray(p.wallets) && p.wallets.length ? p.wallets : [{ id: uid(), name: 'Main account', type: 'bank', opening: 0 }];
  p.txns = Array.isArray(p.txns) ? p.txns.filter(function (t) { return t && isFinite(t.ts) && isFinite(t.amt); }) : [];
  p.caps = Array.isArray(p.caps) ? p.caps : [];
  p.goals = Array.isArray(p.goals) ? p.goals : [];
  p.dismissedSubs = Array.isArray(p.dismissedSubs) ? p.dismissedSubs : [];
  p.templates = Array.isArray(p.templates) ? p.templates.slice(0, 8) : [];
  p.rules = Array.isArray(p.rules) ? p.rules : [];
  p.fx = p.fx && typeof p.fx === 'object' ? p.fx : {};
  if (!p.createdAt) p.createdAt = p.txns.length ? p.txns.reduce(function (m, t) { return Math.min(m, t.ts); }, Date.now()) : Date.now();
  p.settings = Object.assign({ roast: true, hide: false, theme: 'system' }, p.settings || {});
  return p;
}

function saveIndex() { Store.set('bk_idx', S.index); }

/* Saving: with a key, the data is snapshotted now and sealed in the background, one write at a time and in order. */
function saveProfile() {
  var pid = S.pid; if (!pid || !S.p) return;
  if (Vault.ok && Vault.key) {
    var snap = JSON.stringify(S.p), key = Vault.key;
    Vault.queue = Vault.queue.then(function () { return vaultSeal(snap, key); }).then(function (rec) { writeProfile(pid, rec); })
      .catch(function () { toast('Couldn’t save', 'Your browser’s storage is full or blocked. Export your JSON from Plan to keep a copy.'); });
    return;
  }
  writeProfile(pid, S.p);
}
function writeProfile(pid, data) {
  var r = Store.set('bk_p_' + pid, data);
  if (!r.ok) toast('Couldn’t save', 'Your browser’s storage is full or blocked. Export your JSON from Plan to keep a copy.');
  else if (r.overflow && !S.warned) { S.warned = true; toast('Moved to local storage', 'This account has outgrown cookie space, so its JSON now saves to local storage.'); }
}
/* Use this key for the open account and remember it for this tab (and the device, if "Stay unlocked" is on). */
function useKey(pid, kr) {
  Vault.key = kr ? kr.key : null; Vault.raw = kr ? kr.raw : '';
  if (kr) vaultRemember(pid, kr.raw, vaultStaysUnlocked(pid));
}

function setSession(pid) { if (pid) Store.set('bk_sess', { pid: pid }); else Store.remove('bk_sess'); }

/* Opens an account's data. Resolves 'ok', 'missing' (nothing saved here) or 'locked' (sealed and no working key).
   Data saved before 2.0 is plain; it is sealed the first time it's opened with a key. */
function openProfile(pid, kr) {
  var rec = Store.get('bk_p_' + pid);
  if (!rec) return Promise.resolve('missing');
  var sealed = isSealed(rec);
  var data = sealed ? (kr ? vaultOpen(rec, kr.key) : Promise.reject(new Error('locked'))) : Promise.resolve(rec);
  return data.then(function (p) {
    S.pid = pid; S.p = migrate(p); nfCache = {}; S.tab = 'today'; S.plan = null;
    useKey(pid, kr);
    if (kr && !sealed) saveProfile();
    applyTheme();
    return 'ok';
  }, function () { return 'locked'; });
}

function signOut(silent) { if (S.pid) { vaultForget(S.pid, true); pinClear(S.pid); } S.lock = null; Vault.key = null; Vault.raw = ''; charts.forEach(function (c) { try { c.destroy(); } catch (e) { } }); charts = []; S.pid = null; S.p = null; S.sheet = null; S.plan = null; setSession(null); nfCache = {}; S.auth = { mode: 'home' }; applyTheme(); if (!silent) { renderAll(); toast('Signed out', 'Your data stays saved on this device.'); } }

function deleteProfile(pid) { vaultForget(pid, true); bioClear(pid); pinClear(pid); Store.remove('bk_p_' + pid); S.index.profiles = S.index.profiles.filter(function (x) { return x.id !== pid; }); saveIndex(); }
