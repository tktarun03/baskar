/* BasKar · js/features/auth.js
   Sign in, create account, account picker.
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

function storageBadge() {
  var m = Store.mode;
  var label = m === 'cookie' ? 'Saved in cookies' : m === 'local' ? 'Saved in local storage' : 'Not saved';
  return '<span class="badge" style="--c:' + (m === 'cookie' ? 'var(--good)' : m === 'local' ? 'var(--warn)' : 'var(--bad)') + '"><i></i>' + esc(label) + '</span>';
}

function brand() { return '<div class="brand">' + wordmark(BR) + '</div>'; }

function renderAuth() {
  if (S.auth.mode === 'create') return renderCreate();
  if (S.auth.mode === 'signin') return renderSignin();
  var cur = guessCurrency(), profs = S.index.profiles;
  var h = '<header class="row between">' + brand() + '<button type="button" class="icon-btn" data-act="refresh" aria-label="Refresh">' + ic('refresh', 18) + '</button></header>' +
    '<section class="intro"><h1 class="display">Where did my money go?</h1><p class="lede">BasKar turns your income into one number: what you can safely spend today. Every spend counts it down. Overspend, and tomorrow shrinks. Underspend, and it feeds your goals.</p></section>' + homeFirstCard() +
    '<section class="card" aria-label="Example of the daily budget"><span class="badge ex">Example</span>' +
    '<div class="hero-top"><div class="stack-xs"><span class="eyebrow">Safe to spend today</span><span class="num big">' + money(1433, { cur: cur === 'INR' ? 'INR' : 'USD', show: true }) + '</span></div>' + heroMark('chill', 52) + '</div>' +
    '<div class="bar"><span style="width:17%;background:' + CATS.coffee.color + '"></span><span style="width:28%;background:' + CATS.groceries.color + '"></span></div>' +
    '<p class="bubble"><span class="mood">Chillar</span>10 minutes to deliver. 10 days to recover.</p></section>';
  if (profs.length) {
    h += '<section class="card tight"><div class="row between" style="padding:14px 0 4px"><span class="eyebrow">On this device</span><span class="hint">' + profs.length + '</span></div><div class="plist">' +
      profs.map(function (m) { return '<button type="button" class="prow" data-act="pick" data-id="' + esc(m.id) + '">' + avatar(m, 42) + '<span class="grow"><strong>' + esc(m.name) + '</strong><span class="hint">' + dots([m.email || 'No email', m.demo ? 'Example data' : '']) + '</span></span>' + ic('chev', 18) + '</button>'; }).join('') +
      '</div></section>';
  }
  h += '<div class="stack"><button type="button" class="btn block" data-act="create">Create an account</button><button type="button" class="btn ghost block" data-act="demo">Try the demo</button><button type="button" class="btn-link" data-act="intro" style="align-self:center">How it works</button><button type="button" class="btn quiet sm" data-act="brand" style="align-self:center">Customize branding</button></div>' +
    '<div class="stack-xs"><span class="label">Language</span>' + langSeg() + '</div>';
  if (Store.note) h += '<p class="notice">' + esc(Store.note) + '</p>';
  h += '<div class="foot stack-xs"><div>' + storageBadge() + '</div><p class="fine">Nothing leaves this browser. Each account is saved as JSON, compressed with lz-string and split across cookies on this device. Clearing site data deletes it, so export a copy from Plan if it matters.</p></div>';
  return h;
}

function renderSignin() {
  var m = meta(S.auth.pick);
  if (!m) { S.auth = { mode: 'home' }; return renderAuth(); }
  return '<header class="row"><button type="button" class="icon-btn" data-act="auth-home" aria-label="Back">' + ic('back') + '</button></header>' +
    '<section class="stack" style="align-items:flex-start;padding-top:8px">' + avatar(m, 68) + '<div class="stack-xs"><h1 class="h2">' + esc(m.name) + '</h1><p class="hint">' + esc(m.email || '') + '</p></div></section>' +
    (Passkey.ok && bioGet(m.id) ? '<button type="button" class="btn block" data-act="bio-unlock"' + (S.auth.busy ? ' disabled' : '') + '>' + ic('face', 20) + ' <span>Unlock with ' + esc(bioName()) + '</span></button><div class="or"><span>or use your password</span></div>' : '') +
    '<form id="signin-form" class="stack" novalidate><div class="field"><label for="si-pw">Password</label><input id="si-pw" class="input" type="password" autocomplete="current-password" required></div>' +
    (S.auth.note ? '<p class="notice">' + esc(S.auth.note) + '</p>' : '') +
    (S.auth.err ? '<p class="error" role="alert">' + esc(S.auth.err) + '</p>' : '') +
    (m.demo ? '<p class="hint">Demo password: <strong>demo</strong></p>' : '') +
    '<button type="submit" class="btn block"' + (S.auth.busy ? ' disabled' : '') + '>' + ic('lock', 18) + (S.auth.busy ? ' Unlocking…' : ' Unlock') + '</button></form>' +
    '<p class="fine">Passwords are hashed and stay on this device, so they can’t be reset. If you’ve lost it, delete this account and start again.</p>' +
    '<button type="button" class="btn ghost block danger-text" data-act="auth-del">' + (S.auth.confirmDel ? 'Tap again to delete this account’s data' : 'Delete this account') + '</button>';
}

function newDraft() {
  return { name: '', email: '', pw: '', pw2: '', currency: guessCurrency(), income: '', cycleStart: 1, spent: '',
    fixed: [{ label: 'Rent', amount: '' }, { label: 'EMI / loans', amount: '' }, { label: 'Investments / SIP', amount: '' }, { label: 'Bills & subscriptions', amount: '' }],
    wallets: [{ name: 'Salary account', type: 'bank', opening: '' }, { name: 'Cash', type: 'cash', opening: '' }] };
}

function previewHtml(income, fixedArr, cycleStart, cur) {
  var cy = cycleFor(cycleStart);
  var fixed = fixedArr.reduce(function (a, f) { return a + num(f.amount); }, 0);
  var inc = num(income), disc = Math.max(inc - fixed, 0);
  return '<span class="eyebrow">Safe to spend per day</span><span class="num xl">' + money(disc / cy.days, { cur: cur, show: true }) + '</span>' +
    '<span class="hint">' + money(disc, { cur: cur, show: true }) + ' a cycle after ' + money(fixed, { cur: cur, show: true }) + ' of fixed costs, over ' + cy.days + ' days.</span>' +
    (inc > 0 ? '<p class="naive"><s>' + money(inc / cy.days, { cur: cur, show: true }) + '</s> is what income ÷ ' + cy.days + ' says. Your landlord disagrees.</p>' : '');
}

function cycleOptions(sel) { var o = ''; for (var i = 1; i <= 28; i++) o += '<option value="' + i + '"' + (+sel === i ? ' selected' : '') + '>Day ' + i + ' of the month</option>'; return o; }

function dueOptions(sel) { var o = '<option value="">No due day</option>'; for (var i = 1; i <= 31; i++) o += '<option value="' + i + '"' + (+sel === i ? ' selected' : '') + '>Due on day ' + i + '</option>'; return o; }

/* Sign-up, one small question per screen: account, pay, fixed costs, wallets, then a review of the daily number. */
var CREATE_STEPS = 5;

function createHead(st, title, hint) {
  return '<div class="stack-xs"><span class="eyebrow">Step ' + st + ' of ' + CREATE_STEPS + '</span><h1 class="h2">' + esc(title) + '</h1><p class="hint">' + esc(hint) + '</p></div>';
}

/* What Today will show on the first day, including anything already spent this cycle. */
function draftNumbers(d) {
  var cy = cycleFor(d.cycleStart), fixed = d.fixed.reduce(function (a, f) { return a + num(f.amount); }, 0);
  var inc = num(d.income), disc = Math.max(inc - fixed, 0), pre = cy.dayIndex > 1 ? Math.max(num(d.spent), 0) : 0;
  return { cy: cy, inc: inc, fixed: fixed, disc: disc, pre: pre, today: Math.max(disc - pre, 0) / cy.daysLeft };
}

function reviewHtml(d) {
  var n = draftNumbers(d), m = function (v) { return money(v, { cur: d.currency, show: true }); };
  function line(label, val, cls) { return '<div class="rv-row' + (cls ? ' ' + cls : '') + '"><span>' + esc(label) + '</span><span class="amt">' + esc(val) + '</span></div>'; }
  return '<span class="eyebrow">Safe to spend today</span><span class="num xl">' + esc(m(n.today)) + '</span>' +
    '<div class="rv">' + line('Take-home pay', m(n.inc)) + line('Fixed costs', '−' + m(n.fixed)) +
    (n.pre ? line('Already spent this cycle', '−' + m(n.pre)) : '') +
    line('Left for this cycle', m(Math.max(n.disc - n.pre, 0)), 'total') +
    line('Days left, including today', String(n.cy.daysLeft)) + '</div>' +
    (n.disc <= 0 ? '<p class="error" role="alert">Your fixed costs use up your whole income. Check your plan.</p>' : '');
}

function renderCreate() {
  var d = S.draft, st = S.step;
  var bars = ''; for (var k = 1; k <= CREATE_STEPS; k++) bars += '<li class="' + (st >= k ? 'on' : '') + '"></li>';
  var h = '<header class="row"><button type="button" class="icon-btn" data-act="c-back" aria-label="Back">' + ic('back') + '</button><ol class="steps" style="flex:1;--n:' + CREATE_STEPS + '" aria-label="Step ' + st + ' of ' + CREATE_STEPS + '">' + bars + '</ol></header>';
  h += '<form id="create-form" class="stack" novalidate>';
  if (st === 1) {
    h += createHead(1, 'Create your account', 'It lives only in this browser. Add as many accounts as you like, one per person.') +
      '<div class="field"><label for="c-name">Your name</label><input id="c-name" class="input" data-d="name" autocomplete="name" value="' + esc(d.name) + '" required></div>' +
      '<div class="field"><label for="c-email">Email <span class="muted">(optional, just a label)</span></label><input id="c-email" class="input" type="email" data-d="email" autocomplete="email" value="' + esc(d.email) + '"></div>' +
      '<div class="field"><label for="c-pw">Password</label><input id="c-pw" class="input" type="password" data-d="pw" autocomplete="new-password" value="' + esc(d.pw) + '" required><span class="hint">At least 4 characters. It can’t be reset, so pick one you’ll remember.</span></div>' +
      '<div class="field"><label for="c-pw2">Confirm password</label><input id="c-pw2" class="input" type="password" data-d="pw2" autocomplete="new-password" value="' + esc(d.pw2) + '" required></div>';
  } else if (st === 2) {
    h += createHead(2, 'Money coming in', 'Pick any currency. Amounts format the way your browser expects.') +
      '<div class="field"><label for="c-cur">Currency</label><select id="c-cur" class="input" data-d="currency">' + currencyOptions(d.currency) + '</select></div>' +
      '<div class="field"><label for="c-inc">Monthly take-home pay</label><div class="money-input"><span class="cur" id="cur-sym">' + esc(curSymbol(d.currency)) + '</span><input id="c-inc" type="number" inputmode="decimal" step="any" min="0" data-d="income" placeholder="0" value="' + esc(d.income) + '" required></div><span class="hint">What reaches your account after tax and deductions.</span></div>' +
      '<div class="field"><label for="c-cyc">Budget cycle starts on</label><select id="c-cyc" class="input" data-d="cycleStart">' + cycleOptions(d.cycleStart) + '</select><span class="hint">Most people pick their salary day.</span></div>';
  } else if (st === 3) {
    h += createHead(3, 'The boring bills', 'Fixed costs get set aside first. What’s left becomes your daily allowance. You can add due dates later in Plan.') +
      '<section class="card"><div class="row between"><span class="label">Fixed every month</span><button type="button" class="btn quiet sm" data-act="c-add-fix">' + ic('plus', 16) + ' Add</button></div>' +
      d.fixed.map(function (f, i) { return '<div class="frow"><input class="input" aria-label="Fixed cost name" data-d="fixed.' + i + '.label" value="' + esc(f.label) + '" placeholder="e.g. Rent"><input class="input" aria-label="Amount for ' + esc(f.label || 'fixed cost') + '" type="number" inputmode="decimal" step="any" min="0" data-d="fixed.' + i + '.amount" value="' + esc(f.amount) + '" placeholder="0"><button type="button" class="icon-btn" data-act="c-del-fix" data-i="' + i + '" aria-label="Remove ' + esc(f.label || 'row') + '">' + ic('x', 16) + '</button></div>'; }).join('') +
      '<p class="hint">Leave a row empty if it doesn’t apply.</p></section>' +
      '<section class="preview" id="create-preview" aria-live="polite">' + previewHtml(d.income, d.fixed, d.cycleStart, d.currency) + '</section>';
  } else if (st === 4) {
    h += createHead(4, 'Where your money is', 'Bank accounts, cards and cash, so you can see where each spend came from. Balances are optional.') +
      '<section class="card"><div class="row between"><span class="label">Wallets</span><button type="button" class="btn quiet sm" data-act="c-add-wal">' + ic('plus', 16) + ' Add</button></div>' +
      d.wallets.map(function (w, i) { return '<div class="frow w3"><input class="input" aria-label="Wallet name" data-d="wallets.' + i + '.name" value="' + esc(w.name) + '" placeholder="e.g. HDFC savings"><input class="input" aria-label="Starting balance for ' + esc(w.name || 'wallet') + '" type="number" inputmode="decimal" step="any" data-d="wallets.' + i + '.opening" value="' + esc(w.opening) + '" placeholder="Balance"><button type="button" class="icon-btn" data-act="c-del-wal" data-i="' + i + '" aria-label="Remove ' + esc(w.name || 'wallet') + '">' + ic('x', 16) + '</button></div>'; }).join('') +
      '</section><p class="hint">Not sure? Keep these two and continue. You can change wallets any time in Money.</p>';
  } else {
    var cy = cycleFor(d.cycleStart);
    h += createHead(5, 'Your daily number', 'Check it looks right. You can change any of this later in Plan.') +
      (cy.dayIndex > 1 ? '<div class="field"><label for="c-spent">Already spent this cycle <span class="muted">(optional)</span></label><div class="money-input"><span class="cur">' + esc(curSymbol(d.currency)) + '</span><input id="c-spent" type="number" inputmode="decimal" step="any" min="0" data-d="spent" placeholder="0" value="' + esc(d.spent) + '"></div>' +
        '<span class="hint"><span>Your cycle started on</span> <span class="iso">' + esc(cy.start.toLocaleDateString(LOC(), { day: 'numeric', month: 'long' })) + '</span>. <span>A rough figure keeps today’s number honest.</span></span></div>' : '') +
      '<section class="preview" id="create-review" aria-live="polite">' + reviewHtml(d) + '</section>' +
      '<section class="card stack-xs"><span class="label">How it moves</span>' +
      '<div class="rv-tip">' + ic('up', 16) + '<span>Spend less today and tomorrow’s number grows.</span></div>' +
      '<div class="rv-tip">' + ic('down', 16) + '<span>Spend more and it shrinks, so the money lasts to payday.</span></div>' +
      '<div class="rv-tip">' + ic('target', 16) + '<span>Move what’s left into a goal each night.</span></div></section>';
  }
  if (S.err) h += '<p class="error" role="alert">' + esc(S.err) + '</p>';
  h += '<button type="submit" class="btn block">' + (st < CREATE_STEPS ? 'Continue' : 'Start using ' + esc(BR.name)) + '</button></form>';
  return h;
}

function createStep() {
  var d = S.draft; S.err = '';
  if (S.step < CREATE_STEPS) {
    if (S.step === 1) {
      if (!d.name.trim()) S.err = 'Add your name so you can tell accounts apart.';
      else if (d.pw.length < 4) S.err = 'Use a password of at least 4 characters.';
      else if (d.pw !== d.pw2) S.err = 'The two passwords don’t match.';
    } else if (S.step === 2) {
      if (!(num(d.income) > 0)) S.err = 'Enter your monthly take-home pay.';
    }
    if (!S.err) S.step++;
    renderAll(); toTop();
    if (!S.err && S.step === 2) focusSoon('#c-inc');
    return;
  }
  var n = draftNumbers(d), id = uid(), salt = uid();
  Promise.all([hashPw(d.pw, salt), vaultDerive(d.pw, salt)]).then(function (res) {
    var hash = res[0]; useKey(id, res[1]);
    S.index.profiles.push({ id: id, name: d.name.trim(), email: d.email.trim(), salt: salt, hash: hash, createdAt: Date.now() });
    saveIndex();
    var wallets = d.wallets.filter(function (w) { return w.name.trim(); }).map(function (w) { return { id: uid(), name: w.name.trim(), type: w.type || 'bank', opening: num(w.opening) }; });
    S.pid = id;
    S.p = migrate({ currency: d.currency, income: num(d.income), cycleStart: d.cycleStart, createdAt: Date.now(), fixed: d.fixed.filter(function (f) { return num(f.amount) > 0; }).map(function (f) { return { id: uid(), label: f.label.trim() || 'Fixed cost', amount: num(f.amount) }; }), wallets: wallets, txns: [], settings: { roast: true },
      startSpent: n.pre ? { cs: n.cy.start.getTime(), amt: n.pre } : null, onboard: { show: true } });
    nfCache = {}; saveProfile(); setSession(id); applyTheme();
    S.draft = null; S.step = 1; S.tab = 'today';
    renderAll(); toTop();
    toast('Welcome, ' + firstName(d.name), 'Your safe-to-spend today is ' + money(calc(S.p).todayBudget) + '.');
  });
}

function signIn(pid, pw) {
  var m = meta(pid); if (!m) return;
  S.auth.busy = true; renderAll();
  hashPw(pw, m.salt).then(function (h) {
    if (h !== m.hash) { S.auth.busy = false; S.auth.err = 'That password doesn’t match this account. Try again.'; renderAll(); focusSoon('#si-pw'); return; }
    return vaultDerive(pw, m.salt).then(function (kr) { return finishUnlock(pid, kr); });
  });
}
/* Shared by the password, Face ID and PIN paths once a key is in hand. */
function finishUnlock(pid, kr) {
  var m = meta(pid);
  return openProfile(pid, kr).then(function (res) {
    S.auth.busy = false;
    if (res === 'missing') { S.auth.err = 'This account’s data is missing from this browser. It may have been cleared.'; renderAll(); return res; }
    if (res === 'locked') { S.auth.err = 'This account’s data couldn’t be opened in this browser.'; renderAll(); return res; }
    setSession(pid); S.auth = { mode: 'home' }; S.lock = null; renderAll(); toTop();
    var c = calc(S.p);
    toast('Hi ' + firstName(m.name), c.over ? 'You’re already over today. Bold.' : 'You can spend ' + money(Math.max(c.left, 0)) + ' more today.');
    return res;
  });
}

/* Actions (data-act="…") for this feature. */
Object.assign(ACT, {
  create: function () { S.draft = newDraft(); S.step = 1; S.err = ''; S.auth = { mode: 'create' }; renderAll(); toTop(); focusSoon('#c-name'); },
  demo: function () { createDemo(); },
  pick: function (el) { S.auth = { mode: 'signin', pick: el.dataset.id, err: '' }; renderAll(); focusSoon('#si-pw'); },
  'auth-home': function () { S.auth = { mode: 'home' }; renderAll(); },
  'auth-del': function () {
    if (!S.auth.confirmDel) { S.auth.confirmDel = true; renderAll(); return; }
    deleteProfile(S.auth.pick); S.auth = { mode: 'home' }; renderAll(); toast('Account deleted', 'Its data was removed from this browser.');
  },
  'c-back': function () { S.err = ''; S.step--; if (S.step < 1) { S.auth = { mode: 'home' }; S.draft = null; S.step = 1; } renderAll(); },
  'c-add-fix': function () { S.draft.fixed.push({ label: '', amount: '' }); renderAll(); focusSoon('[data-d="fixed.' + (S.draft.fixed.length - 1) + '.label"]'); },
  'c-del-fix': function (el) { S.draft.fixed.splice(+el.dataset.i, 1); renderAll(); },
  'c-add-wal': function () { S.draft.wallets.push({ name: '', type: 'bank', opening: '' }); renderAll(); focusSoon('[data-d="wallets.' + (S.draft.wallets.length - 1) + '.name"]'); },
  'c-del-wal': function (el) { S.draft.wallets.splice(+el.dataset.i, 1); renderAll(); }
});
