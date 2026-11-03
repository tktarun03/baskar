/* BasKar · js/core/parse.js
   Reading money text: bank SMS, CSV statements, one-line entry, payee rules, duplicates, add/undo.
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

var MON = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11 };

function parseWhen(s, maxBackDays) {
  var now = new Date(), d = null, m = null, rest = String(s || '');
  if ((m = rest.match(/\b(20\d{2})[-\/.](\d{1,2})[-\/.](\d{1,2})/))) d = new Date(+m[1], +m[2] - 1, +m[3]);
  else if ((m = rest.match(/\b(\d{1,2})[-\/. ]?(jan|feb|mar|apr|may|jun|jul|aug|sept?|oct|nov|dec)[a-z]*\.?[-\/., ]*((?:19|20)?\d{2})?\b/i))) { var y = m[3] ? +m[3] : now.getFullYear(); if (y < 100) y += 2000; d = new Date(y, MON[m[2].toLowerCase()], +m[1]); }
  else if ((m = rest.match(/\b(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})\b/))) { var yy = +m[3], a = +m[1], b = +m[2]; if (yy < 100) yy += 2000; d = b > 12 ? new Date(yy, a - 1, b) : new Date(yy, b - 1, a); }
  if (!d || isNaN(d.getTime())) return null;
  rest = rest.replace(m[0], ' ');
  var t = rest.match(/\b(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)?/i);
  if (t) { var hh = +t[1] % 24, ap = (t[3] || '').toLowerCase(); if (ap === 'pm' && hh < 12) hh += 12; if (ap === 'am' && hh === 12) hh = 0; d.setHours(hh, +t[2] % 60, 0, 0); }
  else if (startOfDay(d).getTime() === startOfDay(now).getTime()) d = now;
  else d.setHours(12, 0, 0, 0);
  var ts = d.getTime();
  if (ts > Date.now() + DAY || ts < Date.now() - (maxBackDays || 400) * DAY) return null;
  return ts;
}

var CUR_TOK = '(?:rs\\.?|inr|₹|aed|qar|qr|sar|kwd|bhd|omr|usd|eur|gbp|sgd|dhs?|\\$|€|£)';

var AMT_RE = (function () {
  try { return new RegExp('(?<![a-z])' + CUR_TOK + '\\s*([0-9][0-9,]*(?:\\.[0-9]{1,3})?)|([0-9][0-9,]*\\.[0-9]{2})\\s*' + CUR_TOK + '(?![a-z])', 'gi'); }
  catch (e) { return new RegExp(CUR_TOK + '\\s*([0-9][0-9,]*(?:\\.[0-9]{1,3})?)|([0-9][0-9,]*\\.[0-9]{2})\\s*' + CUR_TOK, 'gi'); }
})();

var CUR_MAP = { 'RS': 'INR', 'INR': 'INR', '₹': 'INR', 'AED': 'AED', 'DH': 'AED', 'DHS': 'AED', 'QAR': 'QAR', 'QR': 'QAR', 'SAR': 'SAR', 'KWD': 'KWD', 'BHD': 'BHD', 'OMR': 'OMR', 'USD': 'USD', '$': 'USD', 'EUR': 'EUR', '€': 'EUR', 'GBP': 'GBP', '£': 'GBP', 'SGD': 'SGD' };

/* First amount in the text that isn't a balance or limit, plus the currency it was written in. */
function smsMoney(s) {
  var m; AMT_RE.lastIndex = 0;
  while ((m = AMT_RE.exec(s))) {
    if (/(bal|balance|avl|avbl|limit|lmt|available)[^0-9]*$/i.test(s.slice(Math.max(0, m.index - 22), m.index))) continue;
    var v = parseFloat((m[1] || m[2]).replace(/,/g, ''));
    if (v > 0) { AMT_RE.lastIndex = 0; return { amt: v, cur: CUR_MAP[m[0].replace(/[0-9.,\s]/g, '').toUpperCase()] || '' }; }
  }
  return { amt: 0, cur: '' };
}

function smsAmount(s) { return smsMoney(s).amt; }

function ruleFor(name) { var k = String(name || '').trim().toLowerCase(); if (!k || !S.p || !S.p.rules) return null; return S.p.rules.filter(function (r) { return r.match === k; })[0] || null; }

function applyRule(item) {
  var r = ruleFor(item.merchant);
  if (!r) return item;
  item.merchant = r.name;
  if (r.cat && item.kind === 'expense' && CATS[r.cat]) item.cat = r.cat;
  return item;
}

var SMS_SKIP = /(\botp\b|one[- ]time password|collect request|requested (?:money|payment)|will be (?:debited|deducted|charged)|\bis due\b|due (?:on|date|by)|minimum (?:amount )?due|e-?mandate|pre-?approved|apply now|congrat|\bfailed\b|\bdeclined\b|unsuccessful)/i;

var SMS_DEBIT = /\b(debited|debit(?!\s*card)|spent|paid|sent|withdrawn|withdrawal|purchased?|charged|deducted|txn of|payment of|(?:was|been|is) used|used (?:for|at|on)|transaction (?:of|for|at)|pos (?:txn|transaction|purchase))\b/i;

var SMS_CREDIT = /\b(credited|credit(?!\s*card)|received|deposited|refund(?:ed)?|cashback|reversed)\b/i;

var PSP = /^(paytm|payu|ybl|okaxis|oksbi|okhdfcbank|okicici|axl|ibl|apl|rzp|razorpay|pay|payments?|upi|bharatpe|gpay|phonepe|mer|merchant|pos|online|in|com|www|icici|hdfc|sbi|axis|kotak|yes|bank|\d+|[a-z]?\d+[a-z0-9]*)$/i;

var NOT_NAME = /^(upi|neft|imps|rtgs|your|my|a\/?c|ac|acct|account|card|vpa|you|us|the|bank|atm|self|mobile|net ?banking|ref|txn|info)$/i;

function tidyName(n) {
  n = String(n || '').replace(/\s+/g, ' ').replace(/^((upi|neft|imps|rtgs|pos|ach|nach|atw|atm|ecom|bil|onl|mmt|ib|mb)[\s\/\-:]+)+/i, '').replace(/\b(pvt|private|ltd|limited|llp|inc|technologies|payments?|services|retail)\b\.?/gi, '').replace(/[\s.\-,]+$/, '').trim();
  if (!n) return '';
  if (n === n.toUpperCase() || n === n.toLowerCase()) n = n.toLowerCase().replace(/(^|\s)[a-z]/g, function (c) { return c.toUpperCase(); });
  return n.slice(0, 32);
}

function smsMerchant(s) {
  var m = s.match(/([a-z0-9][a-z0-9._-]{1,48})@([a-z][a-z0-9]{1,15})\b/i);
  if (m) { var parts = m[1].split(/[._-]/).filter(function (p) { return p && !PSP.test(p); }); if (parts.length) return tidyName(parts[0]); }
  var re = /\b(?:at|to|towards|trf to|transfer to|paid to|sent to|from|by|info:?)\s+([A-Za-z][A-Za-z0-9&'. -]{1,40}?)(?=\s+(?:on|via|ref|upi|txn|avl|avbl|bal|using|from|for|dated|at|with|in|thru|through)\b|[.,;:\n(]|$)/gi, x;
  while ((x = re.exec(s))) {
    var nm = x[1].trim();
    /* Skip phrases about the customer's own account ("from your account XXXX5678"), not the payee. */
    if (NOT_NAME.test(nm) || /^(a\/c|x+\d+)/i.test(nm) || /^(your|my|our|the)\b|\b(account|a\/c|acct)\b|x{2,}\d|\*{2,}\d/i.test(nm)) continue;
    return tidyName(nm);
  }
  m = s.match(/UPI\/(?:P2[AM]\/)?\d*\/?([A-Za-z][A-Za-z .]{1,30})/i);
  return m ? tidyName(m[1]) : '';
}

function smsWallet(s) {
  var ws = S.p.wallets, m = s.match(/(?:a\/?c|acct|account|card)[^0-9]{0,14}(\d{3,4})\b/i);
  if (m) { var hit = ws.filter(function (w) { return w.name.indexOf(m[1]) >= 0; })[0]; if (hit) return hit.id; }
  var bw = ws.filter(function (w) { return w.type === 'bank'; })[0];
  if (/debit card|atm card/i.test(s) && bw) return bw.id;
  if (/\bcard\b/i.test(s)) { var cw = ws.filter(function (w) { return w.type === 'card'; })[0]; if (cw) return cw.id; }
  return (bw || ws[0] || {}).id || '';
}

var CAT_RULES = [
  ['groceries', /blinkit|zepto|instamart|big ?basket|d-?mart|jiomart|grofers|dunzo|lulu|carrefour|spinneys|grocer|supermarket|kirana|nature'?s basket/i],
  ['food', /swiggy|zomato|uber ?eats|talabat|deliveroo|snoonu|domino|mcdonald|kfc|pizza|burger|restaurant|resturant|dhaba|biryani|eatsure|keeta|doordash|grubhub|foodpanda|\bfoods?\b|cafeteria|bakery|shawarma|grill|kitchen/i],
  ['coffee', /starbucks|caf[eé]|coffee|chai|third wave|blue tokai|costa|tim hortons|barista/i],
  ['shopping', /amazon|flipkart|myntra|noon|ajio|meesho|nykaa|ikea|decathlon|zara|h&m|uniqlo|shein|temu|tata ?cliq|croma|reliance digital/i],
  ['transport', /uber|\bola\b|rapido|careem|lyft|\bbolt\b|metro|irctc|petrol|fuel|\bshell\b|indian ?oil|iocl|hpcl|bpcl|parking|fastag|\btoll\b|taxi|\bcab\b|\bbus\b/i],
  ['fun', /netflix|spotify|bookmyshow|pvr|inox|prime ?video|hotstar|youtube|steam|playstation|xbox|cinema|movie|disney/i],
  ['health', /pharm|apollo|medplus|1mg|netmeds|hospital|clinic|diagnostic|\blab\b|dental|doctor/i],
  ['travel', /makemytrip|goibibo|cleartrip|airbnb|indigo|air india|vistara|emirates|qatar ?airways|etihad|flydubai|booking\.com|agoda|\boyo\b|hotel|airline|ixigo/i],
  ['bills', /electric|bescom|tata ?power|msedcl|airtel|\bjio\b|vodafone|\bvi\b|broadband|recharge|insurance|\blic\b|\brent\b|ooredoo|\bdu\b|etisalat|kahramaa|dewa|\bemi\b|loan/i]
];

function catMemory() { var mem = {}; S.p.txns.forEach(function (t) { if (t.kind === 'expense' && t.merchant) mem[t.merchant.trim().toLowerCase()] = t.cat; }); return mem; }

function guessCat(name, mem) {
  var k = String(name || '').trim().toLowerCase();
  if (k && mem && mem[k]) return mem[k];
  for (var i = 0; i < CAT_RULES.length; i++) if (CAT_RULES[i][1].test(name || '')) return CAT_RULES[i][0];
  return 'other';
}

function dupIndex() { var idx = {}; S.p.txns.forEach(function (t) { var k = startOfDay(new Date(t.ts)).getTime(); (idx[k] = idx[k] || []).push(t); }); return idx; }

function isDup(item, idx) {
  var list = (idx || dupIndex())[startOfDay(new Date(item.ts)).getTime()] || [], m = String(item.merchant || '').toLowerCase();
  return list.some(function (t) { return t.kind === item.kind && Math.abs(t.amt - item.amt) < 0.01 && (!t.merchant || !m || t.merchant.toLowerCase() === m); });
}

function parseSms(raw, mem, idx) {
  var s = String(raw).replace(/\s+/g, ' ').trim();
  if (SMS_SKIP.test(s)) return { ok: false, raw: s, why: 'Looks like an OTP, reminder or offer, not a payment.' };
  var mon = smsMoney(s), amt = mon.amt;
  if (!amt) return { ok: false, raw: s, why: 'No amount found.' };
  var d = s.search(SMS_DEBIT), c = s.search(SMS_CREDIT);
  if (d < 0 && c < 0) return { ok: false, raw: s, why: 'Couldn’t tell whether money went out or came in.' };
  var kind = d >= 0 && (c < 0 || d < c) ? 'expense' : 'income', merchant = smsMerchant(s);
  if (kind === 'expense' && /\batm\b/i.test(s) && /withdr/i.test(s)) merchant = 'ATM withdrawal';
  var item = { ok: true, raw: s, kind: kind, amt: amt, merchant: merchant, cat: kind === 'income' ? 'income' : guessCat(merchant, mem), ts: parseWhen(s) || Date.now(), wallet: smsWallet(s) };
  item.cur = mon.cur && mon.cur !== S.p.currency ? mon.cur : '';
  applyRule(item);
  item.dup = !item.cur && isDup(item, idx); item.on = !item.dup; item.note = '';
  if (item.cat === 'food') item.meal = mealFor(item.ts);
  return item;
}

function splitSms(text) {
  var t = String(text || '').trim(); if (!t) return [];
  var chunks = t.split(/\n\s*\n/).map(function (x) { return x.trim(); }).filter(Boolean);
  if (chunks.length === 1) {
    var lines = t.split(/\n/).map(function (x) { return x.trim(); }).filter(Boolean);
    if (lines.length > 1 && lines.every(function (l) { return smsAmount(l) > 0 || SMS_SKIP.test(l); })) chunks = lines;
  }
  return chunks.slice(0, 100);
}

function sampleSms() {
  var n = new Date(), y = new Date(n.getTime() - DAY);
  function p(x) { return ('0' + x).slice(-2); }
  var ddmmyy = p(n.getDate()) + '-' + p(n.getMonth() + 1) + '-' + String(n.getFullYear()).slice(2);
  var iso = n.getFullYear() + '-' + p(n.getMonth() + 1) + '-' + p(n.getDate());
  var slash = p(n.getDate()) + '/' + p(n.getMonth() + 1) + '/' + n.getFullYear();
  var mon = p(y.getDate()) + '-' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][y.getMonth()] + '-' + String(y.getFullYear()).slice(2);
  return ['Rs.600.00 debited from A/c XX4821 on ' + ddmmyy + ' to VPA blinkit.payu@okhdfc (UPI Ref No 530612345678). Not you? Call your bank.',
    'INR 500.00 spent on Credit Card XX9902 at SWIGGY on ' + iso + ':13:40:12. Avl Lmt: INR 1,23,456.00',
    'Rs 180 paid to CHAI POINT via UPI on ' + slash + ' 09:05. UPI Ref 530698765432.',
    'Debit Card **4821\nwas used for QAR 15.00\nat CORNER BAKERY TRADIN\nat 07:34\n' + mon,
    'Your A/c XX4821 is credited with Rs 2,500.00 on ' + mon + ' by UPI from RAHUL S. Avl Bal Rs 45,210.55',
    'Your OTP for login is 482913. Do not share it with anyone.'].join('\n\n');
}

function parseAmt(v) {
  var s = String(v == null ? '' : v).trim(); if (!s) return 0;
  var neg = /^-|^\(.*\)$|-$|\bdr\.?$/i.test(s);
  s = s.replace(/[^0-9.,]/g, '');
  if (s.indexOf(',') >= 0 && s.indexOf('.') >= 0) s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  else if (/,\d{1,2}$/.test(s)) s = s.replace(',', '.');
  else s = s.replace(/,/g, '');
  var n = parseFloat(s);
  return isFinite(n) ? (neg ? -n : n) : 0;
}

function csvArrays(text) {
  text = String(text || '').replace(/^﻿/, '');
  if (window.Papa) return Papa.parse(text, { skipEmptyLines: 'greedy' }).data || [];
  var rows = [], row = [], f = '', q = false;
  for (var i = 0; i < text.length; i++) {
    var ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { row.push(f); f = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(f); f = ''; if (row.some(function (x) { return x.trim(); })) rows.push(row); row = []; }
    else f += ch;
  }
  row.push(f); if (row.some(function (x) { return x.trim(); })) rows.push(row);
  return rows;
}

function parseCsv(text) {
  var arr = csvArrays(text), hi = 0;
  for (var i = 0; i < Math.min(arr.length, 30); i++) { var line = arr[i].join(' '); if (/date|\bdt\b/i.test(line) && /amount|amt|debit|withdrawal|credit|deposit/i.test(line)) { hi = i; break; } }
  var headers = (arr[hi] || []).map(function (h, k) { h = String(h || '').trim(); return h || 'Column ' + (k + 1); });
  var rows = arr.slice(hi + 1, hi + 5001).map(function (r) { var o = {}; headers.forEach(function (h, k) { o[h] = r[k] == null ? '' : String(r[k]); }); return o; });
  return { headers: headers, rows: rows };
}

function detectCols(h) {
  function find(re) { for (var i = 0; i < h.length; i++) if (re.test(h[i])) return h[i]; return ''; }
  return {
    date: find(/^(txn |transaction |value |posting |booking )?(date|dt)\b/i) || find(/date|\bdt\b/i),
    desc: find(/payee|merchant|description|narration|particulars|details|remarks/i) || find(/name/i),
    amount: find(/^amount|^amt\b|transaction amount|^value$/i),
    debit: find(/debit|withdrawal|money out|paid out|^dr\b/i),
    credit: find(/credit|deposit|money in|paid in|^cr\b/i),
    type: find(/^type$|dr\s*\/\s*cr|cr\s*\/\s*dr|transaction type/i),
    cat: find(/categor/i),
    wallet: find(/wallet|^account$|account name/i),
    note: find(/^note|remark|memo|comment/i),
    meal: find(/^meal/i)
  };
}

function matchCat(v) { v = String(v || '').trim().toLowerCase(); if (!v) return ''; for (var k in CATS) if (k === v || CATS[k].label.toLowerCase() === v || CATS[k].short.toLowerCase() === v) return k; return ''; }

function matchWallet(v) { v = String(v || '').trim().toLowerCase(); if (!v) return ''; var w = S.p.wallets.filter(function (x) { return x.name.toLowerCase() === v; })[0]; return w ? w.id : ''; }

function csvItems(sh) {
  var mp = sh.map, mem = catMemory(), idx = dupIndex(), items = [], bad = 0, dups = 0;
  sh.rows.forEach(function (r) {
    var ts = mp.date ? parseWhen(r[mp.date], 3650) : null;
    if (!ts) { bad++; return; }
    var rawDesc = mp.desc ? String(r[mp.desc] || '') : '', desc = (/@|\bupi\b/i.test(rawDesc) && smsMerchant(rawDesc)) || tidyName(rawDesc);
    var kind = 'expense', amt = 0, typ = mp.type ? String(r[mp.type] || '') : '';
    if (mp.debit || mp.credit) {
      var dv = mp.debit ? Math.abs(parseAmt(r[mp.debit])) : 0, cv = mp.credit ? Math.abs(parseAmt(r[mp.credit])) : 0;
      if (dv > 0) amt = dv; else if (cv > 0) { amt = cv; kind = 'income'; }
    }
    if (!amt && mp.amount) {
      var a = parseAmt(r[mp.amount]); amt = Math.abs(a);
      if (typ) kind = /sav/i.test(typ) ? 'save' : /inc|credit|^cr|deposit|receiv|refund/i.test(typ) ? 'income' : 'expense';
      else if (sh.sign === 'signed') kind = a < 0 ? 'expense' : 'income';
    }
    if (!(amt > 0)) { bad++; return; }
    var item = { kind: kind, amt: Math.round(amt * 100) / 100, ts: ts, merchant: desc, note: mp.note ? String(r[mp.note] || '').trim().slice(0, 120) : '' };
    if (kind === 'save') {
      var g = S.p.goals.filter(function (x) { return x.name.toLowerCase() === desc.toLowerCase(); })[0];
      if (!g) { bad++; return; }
      item.goal = g.id; item.cat = 'savings'; item.wallet = '';
    } else {
      item.cat = kind === 'income' ? 'income' : (matchCat(mp.cat ? r[mp.cat] : '') || guessCat(desc, mem));
      applyRule(item);
      var ml = mp.meal ? String(r[mp.meal] || '').trim().toLowerCase() : '';
      if (item.cat === 'food' && MEALS[ml]) item.meal = ml;
      item.wallet = matchWallet(mp.wallet ? r[mp.wallet] : '') || sh.wallet;
    }
    if (isDup(item, idx)) { dups++; if (!sh.keepDups) return; }
    items.push(item);
  });
  return { items: items, bad: bad, dups: dups };
}

function addItems(items, src) {
  var b0 = calc(S.p), ids = [];
  items.forEach(function (x) {
    var t = { id: uid(), ts: x.ts, kind: x.kind, amt: x.amt, cat: x.cat, merchant: x.merchant || '', wallet: x.wallet || '', note: String(x.note || '').trim().slice(0, 120), src: src };
    if (x.goal) t.goal = x.goal;
    if (x.cat === 'food' && MEALS[x.meal]) t.meal = x.meal;
    if (x.orig) t.orig = x.orig;
    if (x.items && x.items.length) t.items = x.items.slice(0, 60).map(function (it) { return { name: String(it.name || '').slice(0, 40), amt: num(it.amt) }; });
    S.p.txns.push(t); ids.push(t.id);
  });
  S.p.txns.sort(function (a, b) { return a.ts - b.ts; });
  saveProfile();
  var c = calc(S.p);
  return { tipped: !b0.over && c.over, ids: ids };
}

/* Removes transactions by id and returns them, so an Undo can put them back. */
function removeTxns(ids) {
  var gone = S.p.txns.filter(function (t) { return ids.indexOf(t.id) >= 0; });
  S.p.txns = S.p.txns.filter(function (t) { return ids.indexOf(t.id) < 0; });
  saveProfile();
  return gone;
}

function restoreTxns(list) {
  var have = {}; S.p.txns.forEach(function (t) { have[t.id] = 1; });
  list.forEach(function (t) { if (!have[t.id]) S.p.txns.push(t); });
  S.p.txns.sort(function (a, b) { return a.ts - b.ts; });
  saveProfile();
}

function undoAdd(ids, what) { return function () { removeTxns(ids); renderAll(); toast('Undone', what + ' removed.'); }; }

function undoDelete(list) { return function () { restoreTxns(list); renderAll(); toast('Restored', plural(list.length, 'transaction') + ' back.'); }; }

var QUICK_CATS = [
  ['food', /\b(food|lunch|dinner|breakfast|brunch|supper|meal|shawarma|biryani|pizza|burger|restaurant|snacks?|sandwich)\b/i],
  ['groceries', /\b(grocer(?:y|ies)|vegetables|veggies|fruits?|milk|supermarket|hypermarket)\b/i],
  ['coffee', /\b(coffee|karak|chai|tea|latte|cappuccino|caf[eé])\b/i],
  ['transport', /\b(taxi|cab|uber|careem|karwa|metro|bus|fuel|petrol|diesel|parking|toll)\b/i],
  ['shopping', /\b(shopping|clothes|shoes|amazon|noon|gift)\b/i],
  ['fun', /\b(movie|cinema|netflix|games?|concert|outing)\b/i],
  ['health', /\b(pharmacy|medicine|doctor|clinic|gym|dentist)\b/i],
  ['travel', /\b(flight|hotel|trip|travel|visa)\b/i],
  ['bills', /\b(rent|bill|electricity|internet|recharge|ooredoo|vodafone|insurance)\b/i]
];

function parseQuick(text, mem) {
  var s = ' ' + String(text || '').replace(/\s+/g, ' ').trim() + ' ';
  if (!s.trim()) return null;
  var out = { amt: 0, kind: 'expense', merchant: '', cat: '', meal: '', wallet: '', ts: null }, m, now = new Date(), day = 0, hh = null, mm = 0, explicitCat = '';
  if (/\byesterday\b/i.test(s)) { day = -1; s = s.replace(/\byesterday\b/i, ' '); }
  s = s.replace(/\btoday\b/i, ' ');
  if ((m = s.match(/\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i))) { hh = (+m[1] % 12) + (/pm/i.test(m[3]) ? 12 : 0); mm = m[2] ? +m[2] : 0; s = s.replace(m[0], ' '); }
  else if ((m = s.match(/\bat\s+(\d{1,2}):(\d{2})\b/i))) { hh = +m[1] % 24; mm = +m[2]; s = s.replace(m[0], ' '); }
  if ((m = s.match(/(\d[\d,]*(?:\.\d+)?)\s*(k)?(?![\w.])/i))) { out.amt = parseFloat(m[1].replace(/,/g, '')) * (m[2] ? 1000 : 1); s = s.replace(m[0], ' '); }
  s = s.replace(/\b(rs\.?|inr|qar|qr|riyals?|aed|dhs?|dirhams?|usd|dollars?|rupees?|bucks)\b/gi, ' ').replace(/[₹$€£]/g, ' ');
  if (/\b(salary|income|received|got paid|refund|cashback|bonus)\b/i.test(s)) out.kind = 'income';
  if ((m = s.match(/\b(breakfast|brunch|lunch|dinner|supper)\b/i))) { var w = m[1].toLowerCase(); out.meal = w === 'brunch' ? 'lunch' : w === 'supper' ? 'dinner' : w; s = s.replace(m[0], ' '); }
  var low = s.toLowerCase();
  if (S.p) {
    S.p.wallets.slice().sort(function (a, b) { return b.name.length - a.name.length; }).some(function (wl) {
      var n = wl.name.toLowerCase();
      if (n && low.indexOf(' ' + n + ' ') >= 0) { out.wallet = wl.id; s = s.replace(new RegExp('\\b' + n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i'), ' '); return true; }
      return false;
    });
    if (!out.wallet && /\bcash\b/i.test(s)) { var cw = S.p.wallets.filter(function (x) { return x.type === 'cash'; })[0]; if (cw) { out.wallet = cw.id; s = s.replace(/\bcash\b/i, ' '); } }
    if (!out.wallet && /\b(credit )?card\b/i.test(s)) { var kw = S.p.wallets.filter(function (x) { return x.type === 'card'; })[0]; if (kw) { out.wallet = kw.id; s = s.replace(/\b(credit )?card\b/i, ' '); } }
  }
  for (var i = 0; i < QUICK_CATS.length; i++) if (QUICK_CATS[i][1].test(s)) { explicitCat = QUICK_CATS[i][0]; break; }
  s = s.replace(/\b(for|at|on|to|paid|spent|bought|via|from|with|my|the|a|an|and|got|salary|income|received|refund|cashback|bonus)\b/gi, ' ');
  out.merchant = tidyName(s.replace(/[^\p{L}\p{N}&'\- ]/gu, ' ').replace(/\s+/g, ' ').trim());
  if (out.kind === 'expense') {
    var item = applyRule({ merchant: out.merchant, kind: 'expense', cat: '' });
    out.merchant = item.merchant;
    out.cat = item.cat || explicitCat || (out.merchant ? guessCat(out.merchant, mem) : '') || '';
    if (out.cat === 'other' && out.meal) out.cat = 'food';
    if (!out.cat) out.cat = out.meal ? 'food' : 'other';
  } else out.cat = 'income';
  if (day || hh !== null) { var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + day, hh === null ? now.getHours() : hh, hh === null ? now.getMinutes() : mm); out.ts = d.getTime(); }
  if (out.cat === 'food' && !out.meal) out.meal = mealFor(out.ts || Date.now());
  return out;
}
