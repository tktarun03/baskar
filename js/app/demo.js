/* BasKar · js/app/demo.js
   Demo account data.
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function demoProfile() {
  var now = new Date(), r = rng(27), cy = cycleFor(1, now), cs = cy.start;
  var p = migrate({
    currency: 'INR', income: 100000, cycleStart: 1, demo: true, createdAt: cs.getTime(),
    fixed: [{ id: 'f1', label: 'Rent', amount: 25000, day: 1 }, { id: 'f2', label: 'Car EMI', amount: 12000, day: 5 }, { id: 'f3', label: 'SIP / investments', amount: 15000, day: 7 }, { id: 'f4', label: 'Bills & subscriptions', amount: 5000, day: 10 }],
    wallets: [{ id: 'w1', name: 'Salary account', type: 'bank', opening: 18000 }, { id: 'w2', name: 'Credit card', type: 'card', opening: 0 }, { id: 'w3', name: 'Cash', type: 'cash', opening: 3000 }],
    caps: [{ cat: 'groceries', amount: 8000 }, { cat: 'food', amount: 7000 }],
    goals: [{ id: 'g1', name: 'Goa trip', target: 15000, createdAt: cs.getTime() }, { id: 'g2', name: 'Emergency fund', target: 50000, createdAt: cs.getTime() }],
    templates: [{ id: 'q1', merchant: 'Corner Café', amt: 250, cat: 'coffee', wallet: 'w2' }, { id: 'q2', merchant: 'Metro recharge', amt: 200, cat: 'transport', wallet: 'w1' }, { id: 'q3', merchant: 'Office canteen', amt: 120, cat: 'food', wallet: 'w3' }],
    txns: [], settings: { roast: true }
  });
  var base = 43000 / cy.days;
  function at(dayOffset, h, m) { return new Date(cs.getFullYear(), cs.getMonth(), cs.getDate() + dayOffset, h, m).getTime(); }
  p.txns.push({ id: uid(), ts: at(0, 9, 5), kind: 'income', amt: 100000, cat: 'income', merchant: 'Salary', wallet: 'w1', note: 'Example data' });
  [['f1', 'Rent', 25000, 1], ['f2', 'Car EMI', 12000, 5], ['f3', 'SIP', 15000, 7], ['f4', 'Electricity & internet', 2600, 10]].forEach(function (b) {
    if (b[3] < cy.dayIndex) p.txns.push({ id: uid(), ts: at(b[3] - 1, 10, 0), kind: 'expense', amt: b[2], cat: 'bills', merchant: b[1], wallet: 'w1', note: '', billId: b[0], billFor: dueDate(cs.getFullYear(), cs.getMonth(), b[3]).getTime() });
  });
  [['Netflix', 649, 12], ['Spotify', 119, 18], ['Gym membership', 1500, 3], ['Cloud storage', 75, 22]].forEach(function (s) {
    for (var off = -3; off <= 0; off++) { var ts = dueDate(now.getFullYear(), now.getMonth() + off, s[2]).getTime() + 7 * 3600000; if (ts <= now.getTime()) p.txns.push({ id: uid(), ts: ts, kind: 'expense', amt: s[1], cat: 'bills', merchant: s[0], wallet: 'w2', note: '' }); }
  });
  var pool = [
    { m: 'Swiggy', c: 'food', a: [280, 720] }, { m: 'Zomato', c: 'food', a: [300, 800] }, { m: 'Blinkit', c: 'groceries', a: [250, 900] }, { m: 'Zepto', c: 'groceries', a: [220, 750] },
    { m: 'Amazon', c: 'shopping', a: [399, 1999] }, { m: 'Myntra', c: 'shopping', a: [599, 1899] }, { m: 'Uber', c: 'transport', a: [160, 480] }, { m: 'Metro recharge', c: 'transport', a: [200, 500] },
    { m: 'Corner Café', c: 'coffee', a: [180, 320] }, { m: 'Movie tickets', c: 'fun', a: [350, 900] }, { m: 'Pharmacy', c: 'health', a: [150, 650] }
  ];
  for (var i = 0; i < cy.dayIndex - 1; i++) {
    var d = new Date(cs.getFullYear(), cs.getMonth(), cs.getDate() + i), wd = d.getDay();
    var target = base * (wd === 0 || wd === 5 || wd === 6 ? 1.3 : 0.72) * (0.75 + r() * 0.5), spent = 0, tries = 0;
    while (spent < target * 0.85 && tries < 6) {
      tries++;
      var m = pool[Math.floor(r() * pool.length)];
      var amt = Math.round((m.a[0] + r() * (m.a[1] - m.a[0])) / 10) * 10;
      if (spent + amt > target * 1.3) amt = Math.max(m.a[0], Math.round((target - spent) / 10) * 10);
      if (amt <= 0) break;
      p.txns.push({ id: uid(), ts: at(i, 8 + Math.floor(r() * 14), Math.floor(r() * 60)), kind: 'expense', amt: amt, cat: m.c, merchant: m.m, wallet: r() < 0.62 ? 'w2' : (r() < 0.8 ? 'w1' : 'w3'), note: '' });
      spent += amt;
    }
  }
  [[7, 600], [14, 900], [20, 700]].forEach(function (x) { if (x[0] < cy.dayIndex - 1) p.txns.push({ id: uid(), ts: at(x[0], 22, 5), kind: 'save', amt: x[1], cat: 'savings', goal: 'g1', merchant: 'Goa trip', wallet: '', note: '' }); });
  [[8, 45, 'Corner Café', 'coffee', 250], [11, 20, 'Blinkit', 'groceries', 600], [13, 5, 'Zepto', 'groceries', 400], [13, 40, 'Swiggy', 'food', 500], [16, 30, 'Amazon', 'shopping', 750]].forEach(function (x) {
    var ts = at(cy.dayIndex - 1, x[0], x[1]);
    if (ts <= now.getTime()) p.txns.push({ id: uid(), ts: ts, kind: 'expense', amt: x[4], cat: x[3], merchant: x[2], wallet: 'w2', note: '' });
  });
  p.txns.sort(function (a, b) { return a.ts - b.ts; });
  return p;
}

function createDemo() {
  var existing = S.index.profiles.filter(function (x) { return x.demo; })[0];
  if (existing) { S.auth = { mode: 'signin', pick: existing.id, err: '' }; renderAll(); focusSoon('#si-pw'); return; }
  var id = uid(), salt = uid();
  Promise.all([hashPw('demo', salt), vaultDerive('demo', salt)]).then(function (res) {
    var hash = res[0]; useKey(id, res[1]);
    S.index.profiles.push({ id: id, name: 'Demo · Aarav', email: 'demo@example.com', salt: salt, hash: hash, demo: true, createdAt: Date.now() });
    saveIndex();
    S.pid = id; S.p = demoProfile(); nfCache = {}; saveProfile(); setSession(id); S.tab = 'today'; applyTheme();
    renderAll(); toTop();
    toast('Demo account ready', 'Everything here is example data. Its password is “demo”.');
  });
}
