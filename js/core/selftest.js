/* BasKar · js/core/selftest.js
   Built-in self-check (Settings → Run self-check and tests/run-tests.js). Add a case for every new SMS format.
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

function selfTestSms() {
  var y = new Date(Date.now() - DAY), MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function p(x) { return ('0' + x).slice(-2); }
  var yy = String(y.getFullYear()).slice(2), D = {
    ddmmyy: p(y.getDate()) + '-' + p(y.getMonth() + 1) + '-' + yy, ddmon: p(y.getDate()) + '-' + MN[y.getMonth()] + '-' + yy,
    DDMON4: p(y.getDate()) + '-' + MN[y.getMonth()].toUpperCase() + '-' + y.getFullYear(), slash4: p(y.getDate()) + '/' + p(y.getMonth() + 1) + '/' + y.getFullYear(),
    slash2: p(y.getDate()) + '/' + p(y.getMonth() + 1) + '/' + yy, iso: y.getFullYear() + '-' + p(y.getMonth() + 1) + '-' + p(y.getDate())
  };
  return [
    { name: 'Qatar debit card “was used”', acct: 'QAR', sms: 'Debit Card **4821 \nwas used for QAR 15.00\nat SALUTARY FOOD TRADIN\nat 07:34\n' + D.ddmon, want: { kind: 'expense', amt: 15, cur: '', merchant: 'Salutary Food Tradin', cat: 'food', wallet: 'bank', day: 'y', hm: '07:34', meal: 'breakfast' } },
    { name: 'Qatar credit card purchase', acct: 'QAR', sms: 'Purchase of QAR 45.50 with Credit Card ending 9902 at CARREFOUR CITY CENTER on ' + D.slash4 + ' 13:22. Avl limit QAR 9,500.00', want: { kind: 'expense', amt: 45.5, merchant: 'Carrefour City Center', cat: 'groceries', wallet: 'card', day: 'y', hm: '13:22' } },
    { name: 'Talabat at dinner time', acct: 'QAR', sms: 'Your Debit Card ending 4821 was used for QAR 32.00 at TALABAT QATAR on ' + D.ddmon + ' at 20:15', want: { kind: 'expense', amt: 32, merchant: 'Talabat Qatar', cat: 'food', meal: 'dinner', hm: '20:15' } },
    { name: 'Salary credit in QAR', acct: 'QAR', sms: 'Dear Customer, QAR 5,000.00 has been credited to your account 4821 on ' + D.slash4 + '. Ref: SALARY OCT', want: { kind: 'income', amt: 5000, day: 'y' } },
    { name: 'ATM cash withdrawal', acct: 'QAR', sms: 'Cash withdrawal of QAR 500.00 from ATM at QNB DOHA on ' + D.ddmmyy + ' 18:00', want: { kind: 'expense', amt: 500, merchant: 'ATM withdrawal', hm: '18:00' } },
    { name: 'UAE POS debit, upper-case month', acct: 'AED', sms: 'AED 120.00 has been debited from your account XXXX5678 for a POS transaction at NOON.COM on ' + D.DDMON4 + '.', want: { kind: 'expense', amt: 120, merchant: 'Noon', cat: 'shopping', day: 'y' } },
    { name: 'UPI debit to a VPA', acct: 'INR', sms: 'Rs.250.00 debited from a/c **4821 on ' + D.ddmmyy + ' to VPA swiggy@icici UPI Ref 1234', want: { kind: 'expense', amt: 250, merchant: 'Swiggy', cat: 'food', wallet: 'bank', day: 'y' } },
    { name: 'UPI “Sent … To”', acct: 'INR', sms: 'Sent Rs.120.00 From HDFC Bank A/C x4821 To ZEPTO MARKETPLACE On ' + D.slash2 + ' Ref 530612345678', want: { kind: 'expense', amt: 120, merchant: 'Zepto Marketplace', cat: 'groceries', day: 'y' } },
    { name: 'Card spend, limit after amount', acct: 'INR', sms: 'INR 1,499.00 spent on ICICI Bank Card XX9902 on ' + D.ddmon + ' at AMAZON PAY INDIA. Avl Lmt: INR 85,000.00', want: { kind: 'expense', amt: 1499, merchant: 'Amazon Pay India', cat: 'shopping', wallet: 'card', day: 'y' } },
    { name: 'NEFT salary credit', acct: 'INR', sms: 'Your A/c XX4821 credited with INR 45,000.00 on ' + D.iso + ' by NEFT from ACME TECHNOLOGIES PVT LTD', want: { kind: 'income', amt: 45000, merchant: 'Acme', day: 'y' } },
    { name: 'Refund credit', acct: 'INR', sms: 'Refund of Rs.399.00 credited to your account from MYNTRA on ' + D.slash4, want: { kind: 'income', amt: 399, merchant: 'Myntra' } },
    { name: 'Balance mentioned first', acct: 'INR', sms: 'Avl Bal Rs 10,000.00. Rs 450.00 debited for UPI txn to blinkit@ybl', want: { kind: 'expense', amt: 450, merchant: 'Blinkit', cat: 'groceries' } },
    { name: 'Wallet payment', acct: 'INR', sms: 'Paid Rs.80 to Chai Point from Paytm Balance. Updated Balance: Rs 220.', want: { kind: 'expense', amt: 80, merchant: 'Chai Point', cat: 'coffee' } },
    { name: 'INR message on a QAR account', acct: 'QAR', sms: 'Rs.600.00 debited from A/c XX4821 to VPA blinkit.payu@okhdfc', want: { kind: 'expense', amt: 600, cur: 'INR', merchant: 'Blinkit' } },
    { name: 'OTP is ignored', acct: 'INR', sms: '123456 is your OTP for txn of Rs 500 at AMAZON. Do not share.', want: { ok: false } },
    { name: 'Failed payment is ignored', acct: 'INR', sms: 'Your transaction of Rs 300 at SWIGGY has failed.', want: { ok: false } },
    { name: 'Future mandate is ignored', acct: 'INR', sms: 'Rs 649 will be debited on ' + D.ddmmyy + ' for NETFLIX mandate', want: { ok: false } },
    { name: 'Collect request is ignored', acct: 'INR', sms: 'Rahul has sent you a collect request of Rs 200 on UPI', want: { ok: false } }
  ];
}

function runSelfTest() {
  var results = [], saved = S.p;
  function p2(x) { return ('0' + x).slice(-2); }
  function check(group, name, got, want) {
    var ok = typeof want === 'number' ? (typeof got === 'number' && Math.abs(got - want) < 0.01) : String(got) === String(want);
    results.push({ group: group, name: name, ok: ok, got: got, want: want });
  }
  try {
    S.p = migrate({ currency: 'INR', income: 100000, cycleStart: 1, fixed: [{ id: 'f', label: 'Fixed', amount: 57000 }], createdAt: 0,
      wallets: [{ id: 'wb', name: 'Bank 4821', type: 'bank', opening: 0 }, { id: 'wc', name: 'Card 9902', type: 'card', opening: 0 }, { id: 'wk', name: 'Cash', type: 'cash', opening: 0 }], txns: [], settings: {} });
    var yd = startOfDay(new Date(Date.now() - DAY)).getTime();
    selfTestSms().forEach(function (tc) {
      S.p.currency = tc.acct;
      var r = parseSms(tc.sms, {}, {}), w = tc.want, G = 'Bank SMS';
      if (w.ok === false) { check(G, tc.name, !!(r && r.ok), false); return; }
      check(G, tc.name + ' · read', !!(r && r.ok), true);
      if (!r || !r.ok) return;
      if (w.kind) check(G, tc.name + ' · in or out', r.kind, w.kind);
      if (w.amt != null) check(G, tc.name + ' · amount', r.amt, w.amt);
      if ('cur' in w) check(G, tc.name + ' · currency flag', r.cur || '', w.cur);
      if (w.merchant != null) check(G, tc.name + ' · payee', (r.merchant || '').toLowerCase(), w.merchant.toLowerCase());
      if (w.cat) check(G, tc.name + ' · category', r.cat, w.cat);
      if (w.meal) check(G, tc.name + ' · meal', r.meal || '', w.meal);
      if (w.wallet) check(G, tc.name + ' · wallet', (S.p.wallets.filter(function (x) { return x.id === r.wallet; })[0] || {}).type, w.wallet);
      if (w.day === 'y') check(G, tc.name + ' · date', startOfDay(new Date(r.ts)).getTime() === yd, true);
      if (w.hm) { var d = new Date(r.ts); check(G, tc.name + ' · time', p2(d.getHours()) + ':' + p2(d.getMinutes()), w.hm); }
    });
    S.p.currency = 'INR';
    var B = 'Budget maths', nov2 = new Date(2026, 10, 2, 12, 0), cy = cycleFor(1, nov2);
    check(B, 'November cycle has 30 days', cy.days, 30);
    check(B, '2 November is day 2', cy.dayIndex, 2);
    var c25 = cycleFor(25, nov2);
    check(B, 'Cycle from the 25th starts 25 October', c25.start.getDate() + '/' + (c25.start.getMonth() + 1), '25/10');
    check(B, 'Cycle from the 25th has 31 days', c25.days, 31);
    check(B, 'February 2027 cycle has 28 days', cycleFor(1, new Date(2027, 1, 15)).days, 28);
    S.p.txns = [];
    check(B, 'Base: (100,000 − 57,000) ÷ 30', calc(S.p, nov2).base, 43000 / 30);
    S.p.txns = [{ id: 'a', ts: new Date(2026, 10, 1, 10).getTime(), kind: 'expense', amt: 2000, cat: 'food', merchant: 'X', wallet: 'wb' },
      { id: 'b', ts: new Date(2026, 10, 1, 11).getTime(), kind: 'expense', amt: 25000, cat: 'bills', merchant: 'Rent', wallet: 'wb' }];
    var k1 = calc(S.p, nov2);
    check(B, 'Yesterday’s 2,000 spread over the 29 days left', k1.todayBudget, 41000 / 29);
    check(B, 'Bills don’t count against the daily budget', k1.before, 2000);
    check(B, 'Tomorrow if nothing more is spent', k1.tomorrow, 41000 / 28);
    S.p.txns.push({ id: 'c', ts: new Date(2026, 10, 2, 9).getTime(), kind: 'save', amt: 500, cat: 'savings', goal: 'g', merchant: 'Goal', wallet: '' });
    check(B, 'Money moved to a goal uses today’s allowance', calc(S.p, nov2).left, 41000 / 29 - 500);
    check(B, '7 am is breakfast', mealFor(new Date(2026, 10, 2, 7).getTime()), 'breakfast');
    check(B, '1 pm is lunch', mealFor(new Date(2026, 10, 2, 13).getTime()), 'lunch');
    check(B, '8 pm is dinner', mealFor(new Date(2026, 10, 2, 20).getTime()), 'dinner');
    check(B, '2 am counts as dinner', mealFor(new Date(2026, 10, 2, 2).getTime()), 'dinner');
    S.p.txns = [];
    var Q = 'One-line entry', q;
    q = parseQuick('15 shawarma lunch', {});
    check(Q, '“15 shawarma lunch” · amount', q.amt, 15); check(Q, '“15 shawarma lunch” · payee', q.merchant, 'Shawarma'); check(Q, '“15 shawarma lunch” · category', q.cat, 'food'); check(Q, '“15 shawarma lunch” · meal', q.meal, 'lunch');
    q = parseQuick('karak 3 cash', {});
    check(Q, '“karak 3 cash” · amount', q.amt, 3); check(Q, '“karak 3 cash” · category', q.cat, 'coffee'); check(Q, '“karak 3 cash” · wallet', q.wallet, 'wk');
    q = parseQuick('salary 12000', {});
    check(Q, '“salary 12000” · income', q.kind, 'income'); check(Q, '“salary 12000” · amount', q.amt, 12000);
    q = parseQuick('taxi 25 yesterday', {});
    check(Q, '“taxi 25 yesterday” · category', q.cat, 'transport'); check(Q, '“taxi 25 yesterday” · date', startOfDay(new Date(q.ts)).getTime(), yd);
    q = parseQuick('1.5k amazon card', {});
    check(Q, '“1.5k amazon card” · amount', q.amt, 1500); check(Q, '“1.5k amazon card” · category', q.cat, 'shopping'); check(Q, '“1.5k amazon card” · wallet', q.wallet, 'wc');
    q = parseQuick('QAR 40 dinner at 8pm', {});
    check(Q, '“QAR 40 dinner at 8pm” · amount', q.amt, 40); check(Q, '“QAR 40 dinner at 8pm” · time', new Date(q.ts).getHours(), 20); check(Q, '“QAR 40 dinner at 8pm” · meal', q.meal, 'dinner');
    var C = 'CSV';
    check(C, '“1,23,456.00” is 123456', parseAmt('1,23,456.00'), 123456);
    check(C, '“1.234,56” is 1234.56', parseAmt('1.234,56'), 1234.56);
    check(C, '“(250.00)” is −250', parseAmt('(250.00)'), -250);
    check(C, '“450 Dr” is −450', parseAmt('450 Dr'), -450);
    var csv = parseCsv('Account statement\nName: Example\nTxn Date,Narration,Withdrawal Amt.,Deposit Amt.\n01/11/26,UPI-ZEPTO-zepto.rzp@axisbank-ref,"1,250.00",\n31/10/26,NEFT SALARY ACME,,"50,000.00"');
    check(C, 'Finds the header row below junk lines', csv.headers[0], 'Txn Date');
    check(C, 'Reads every data row', csv.rows.length, 2);
    var cols = detectCols(csv.headers);
    check(C, 'Spots the money-out column', cols.debit, 'Withdrawal Amt.');
    check(C, 'Spots the money-in column', cols.credit, 'Deposit Amt.');
    check(C, 'Spots the description column', cols.desc, 'Narration');
    var B = 'App files';
    var vers = [].slice.call(document.querySelectorAll('script[src^="js/"], link[href^="css/"]')).map(function (el) { var m = (el.getAttribute('src') || el.getAttribute('href') || '').match(/[?&]v=([^&]+)/); return m ? m[1] : '(none)'; });
    check(B, 'Every app file was loaded', vers.length >= 40, true);
    check(B, 'All app files are on version ' + RELEASES[0].v, vers.filter(function (v) { return v !== RELEASES[0].v; }).join(', '), '');
    var LG = 'Languages', keepLang = LANG, I = window.BASKAR_I18N || {};
    var RW = window.BASKAR_I18N_ROWS || [];
    check(LG, 'Every translation row has English, Arabic and Tamil', RW.filter(function (r) { return !r || r.length !== 3 || !r[0] || !r[1] || !r[2]; }).length, 0);
    check(LG, 'No English text is listed twice', RW.length - Object.keys(I.ar || {}).length, 0);
    ['ar', 'ta'].forEach(function (lg) {
      var D = I[lg] || {}, keys = Object.keys(D), badPh = keys.filter(function (k) { var a = (k.match(/\{\*\}/g) || []).length, b = (D[k].match(/\{\*\}/g) || []).length; return a !== b || !D[k]; });
      check(LG, LANGS[lg].name + ': dictionary loaded', keys.length > 600, true);
      check(LG, LANGS[lg].name + ': same keys as the other language', keys.length, Object.keys(I[lg === 'ar' ? 'ta' : 'ar'] || {}).length);
      check(LG, LANGS[lg].name + ': no broken name slots', badPh.length, 0);
      LANG = lg;
      check(LG, LANGS[lg].name + ': amounts carry over', trText('Safe to spend today: QAR 1,250.50.').indexOf('QAR 1,250.50') >= 0, true);
      check(LG, LANGS[lg].name + ': names carry over', trText('Remove Corner Café').indexOf('Corner Café') >= 0 && trText('Remove Corner Café') !== 'Remove Corner Café', true);
      check(LG, LANGS[lg].name + ': unknown text stays as typed', trText('Salutary Food Tradin'), 'Salutary Food Tradin');
      LANG = keepLang;
    });
  } catch (e) {
    LANG = typeof keepLang !== 'undefined' ? keepLang : LANG;
    results.push({ group: 'Runner', name: 'Self-check crashed: ' + (e && e.message), ok: false, got: '', want: '' });
  } finally { S.p = saved; }
  var pass = results.filter(function (r) { return r.ok; }).length;
  return { pass: pass, total: results.length, results: results };
}

/* Encryption checks are asynchronous (Web Crypto), so they run separately and are merged in by runAllChecks(). */
function runVaultTest() {
  var G = 'Encryption', out = [];
  function check(name, got, want) { out.push({ group: G, name: name, ok: String(got) === String(want), got: got, want: want }); }
  if (!Vault.ok) { check('This browser can encrypt', false, true); return Promise.resolve(out); }
  var sample = { currency: 'QAR', txns: [{ id: 'a', ts: 1, amt: 15, kind: 'expense', merchant: 'Secret Shawarma Place' }] };
  return Promise.all([vaultDerive('correct horse', 'salt1'), vaultDerive('wrong horse', 'salt1'), vaultDerive('correct horse', 'salt2')]).then(function (k) {
    check('A key is made from the password', !!(k[0] && k[0].key), true);
    check('Different salt gives a different key', k[0].raw !== k[2].raw, true);
    return vaultSeal(sample, k[0].key).then(function (rec) {
      check('Sealed data hides the payee', JSON.stringify(rec).indexOf('Secret') < 0, true);
      check('Sealed data is marked as sealed', isSealed(rec), true);
      return vaultOpen(rec, k[0].key).then(function (back) {
        check('The right password opens it', back.txns[0].merchant, 'Secret Shawarma Place');
        return vaultOpen(rec, k[1].key).then(function () { check('A wrong password can’t open it', 'opened', 'refused'); }, function () { check('A wrong password can’t open it', 'refused', 'refused'); });
      });
    });
  }).then(function () { return out; }, function (e) { check('Encryption runs', String(e && e.message), 'ok'); return out; });
}
function runAllChecks() {
  var r = runSelfTest();
  return runVaultTest().then(function (v) {
    var results = r.results.concat(v);
    return { pass: results.filter(function (x) { return x.ok; }).length, total: results.length, results: results };
  });
}
