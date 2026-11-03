/* BasKar · js/features/onboarding.js
   "Get started" checklist on Today for a new account: the next few things worth doing, one tap each.
   Steps tick themselves off from the account's own data (first spend, a goal, a backup…), so there's nothing to keep
   in sync. Shown only for accounts created from 2.7 (p.onboard.show), until every step is done or it's hidden.
   Also the iPhone note on the sign-in screen: add to the Home Screen before signing up, because the Home Screen app
   keeps its own storage, separate from Safari.
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

function startSteps() {
  var p = S.p, tx = p.txns;
  var st = [
    { act: 'add', icon: 'plus', title: 'Log your first spend', hint: 'Tap + or type “15 shawarma lunch”.', done: tx.some(function (t) { return t.kind === 'expense'; }) },
    { act: 'open-sms', icon: 'message', title: 'Paste a bank SMS', hint: 'BasKar reads the amount and payee for you.', done: tx.some(function (t) { return t.src === 'sms' || t.src === 'receipt' || t.src === 'csv'; }) },
    { act: 'go-goals', icon: 'target', title: 'Set a goal', hint: 'Somewhere for the money you don’t spend.', done: p.goals.length > 0 }
  ];
  if (Vault.key && Passkey.ok) st.push({ act: 'settings', icon: 'face', title: 'Unlock with ' + bioName(), hint: 'Turn it on in Settings, under Privacy.', done: !!bioGet(S.pid) });
  st.push({ act: 'backup', icon: 'database', title: 'Make your first backup', hint: 'Your data lives only in this browser. Keep a copy in Files.', done: !!p.lastBackup });
  return st;
}

function startCard() {
  if (!S.p || S.p.demo || !S.p.onboard || !S.p.onboard.show) return '';
  var st = startSteps(), n = st.filter(function (x) { return x.done; }).length;
  if (n === st.length) {
    return '<section class="card start"><div class="row"><span class="tile" style="--c:var(--good)">' + ic('check', 18) + '</span><div class="grow"><strong>You’re all set</strong><span class="hint">Everything’s set up. Open Settings any time to change it.</span></div></div>' +
      '<button type="button" class="btn ghost sm" data-act="start-hide" style="align-self:flex-start">Close</button></section>';
  }
  var next = st.filter(function (x) { return !x.done; })[0];
  return '<section class="card start tight" aria-label="Get started"><div class="row between" style="padding-top:14px"><h2 class="h3">Get started</h2><span class="hint">' + n + ' of ' + st.length + ' done</span></div>' +
    '<div class="prog" aria-hidden="true"><span style="width:' + Math.max(4, n / st.length * 100).toFixed(0) + '%;background:var(--accent)"></span></div>' +
    '<ol class="start-list">' + st.map(function (x, i) {
      var cls = x.done ? ' done' : x === next ? ' next' : '';
      return '<li><button type="button" class="start-row' + cls + '" data-act="' + x.act + '"' + (x.done ? ' disabled aria-disabled="true"' : '') + '>' +
        '<span class="start-chk" aria-hidden="true">' + (x.done ? ic('check', 14) : '<span class="iso">' + (i + 1) + '</span>') + '</span>' +
        '<span class="grow"><strong>' + esc(x.title) + '</strong>' + (x.done ? '' : '<span class="hint">' + esc(x.hint) + '</span>') + '</span>' +
        (x.done ? '<span class="sr-only">Done</span>' : ic('chev', 16)) + '</button></li>';
    }).join('') + '</ol>' +
    '<button type="button" class="btn-link" data-act="start-hide" style="align-self:flex-start;margin-bottom:10px">Hide this list</button></section>';
}

/* iPhone or iPad Safari as a website (not the Home Screen app), at the top level. */
function iosSafari() {
  if (!IS_TOP) return false;
  var ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var standalone = navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
  return ios && !standalone;
}

/* Sign-in screen, no accounts yet: suggest the Home Screen before any data goes into Safari's storage. */
function homeFirstCard() {
  if (S.index.profiles.length || !iosSafari()) return '';
  try { if (localStorage.getItem('bk_a2hs_first')) return ''; } catch (e) { }
  return '<section class="card"><div class="row"><span class="tile" style="--c:var(--accent)">' + ic('phone', 18) + '</span><div class="grow"><strong>On iPhone? Add it to your Home Screen first</strong><span class="hint">Opens like an app and works offline.</span></div></div>' +
    '<p class="hint"><span>The Home Screen app keeps its own data, separate from Safari. Add it now and create your account there.</span> <span>Tap the Share button, then “Add to Home Screen”.</span></p>' +
    '<button type="button" class="btn ghost sm" data-act="a2hs-first-off" style="align-self:flex-start">Continue in Safari</button></section>';
}

/* Actions (data-act="…") for this feature. */
Object.assign(ACT, {
  'start-hide': function () { S.p.onboard.show = false; saveProfile(); renderAll(); },
  'a2hs-first-off': function () { try { localStorage.setItem('bk_a2hs_first', '1'); } catch (e) { } renderAll(); }
});
