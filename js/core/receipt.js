/* BasKar · js/core/receipt.js
   Reading a paper bill: turns the text that OCR found on one or more photos into a store name, date, total,
   currency and line items. No UI and no network; the OCR itself is in js/features/scan-receipt.js.
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

var RC_TOTAL = [
  [3, /\b(grand\s*total|total\s*payable|net\s*payable|amount\s*payable|total\s*due|amount\s*due|balance\s*due|to\s*pay|bill\s*amount)\b/i],
  [2, /\b(net\s*(?:total|amount)|total\s*(?:amount|incl\.?|inc\.?|with\s*vat)|total\s*(?:qar|qr|inr|rs\.?|aed|sar))\b/i],
  [1, /\btotal\b/i]
];
var RC_NOT_TOTAL = /\b(sub\s*-?\s*total|total\s*(?:items?|qty|quantity|savings?|discount|vat|tax|gst|pieces|pcs|no)|items?\s*total|you\s*saved|savings?|total\s*before)\b/i;
var RC_NOT_ITEM = /\b(total|sub\s*total|vat|tax|gst|cgst|sgst|cash|change|card|visa|master|mada|tender(?:ed)?|paid|balance|round(?:ing)?|discount|saving|points|invoice|receipt|tel|phone|mobile|www|thank|welcome|qty|cashier|counter|bill\s*no|date|time|amount|net|due|refund|auth|approval|ref)\b/i;
var RC_NOT_NAME = /\b(tax\s*invoice|invoice|receipt|welcome|tel|phone|fax|www|vat\s*(no|reg)|cr\s*no|trn|gstin|p\.?o\.?\s*box|cashier|counter|date|time|bill|order|table)\b|@|\.com\b/i;
var RC_AMT = /(\d{1,3}(?:[,\s]\d{3})+|\d+)[.,](\d{2})(?!\d)/g;
var RC_CUR = [[/\b(qar|qr|q\.r\.?)\b/i, 'QAR'], [/\b(inr|rs\.?)(?=\s*\d)|₹/i, 'INR'], [/\b(aed|dhs?)\b/i, 'AED'], [/\bsar\b/i, 'SAR'], [/\bkwd\b/i, 'KWD'], [/\bbhd\b/i, 'BHD'], [/\bomr\b/i, 'OMR'], [/\busd\b|\$/i, 'USD']];

function rcAmounts(line) {
  var out = [], m; RC_AMT.lastIndex = 0;
  while ((m = RC_AMT.exec(line))) out.push(parseFloat(m[1].replace(/[,\s]/g, '') + '.' + m[2]));
  return out;
}
function rcClean(text) {
  return String(text || '').split(/\r?\n/).map(function (l) {
    return l.replace(/[|_]+/g, ' ').replace(/\s{2,}/g, ' ').replace(/(\d)\s*[.,]\s*(\d{2})\b/g, '$1.$2').trim();
  }).filter(function (l) { return l.length > 1; });
}

/* Main entry. Returns { merchant, amt, ts, cur, items: [{ name, amt }], found: { total, date, merchant } }. */
function parseReceipt(text) {
  var lines = rcClean(text), all = lines.join('\n');
  // Total: the strongest "total" keyword wins; on a tie, the one lowest on the bill.
  var best = null;
  lines.forEach(function (l, i) {
    if (RC_NOT_TOTAL.test(l)) return;
    for (var k = 0; k < RC_TOTAL.length; k++) {
      if (!RC_TOTAL[k][1].test(l)) continue;
      var a = rcAmounts(l); if (!a.length && lines[i + 1] && !/[a-z]{3}/i.test(lines[i + 1])) a = rcAmounts(lines[i + 1]);
      if (a.length && a[a.length - 1] > 0 && (!best || RC_TOTAL[k][0] >= best.p)) best = { p: RC_TOTAL[k][0], amt: a[a.length - 1] };
      break;
    }
  });
  // Items: a line with words and a price at the end that isn't a total, tax or payment line.
  var items = [];
  lines.forEach(function (l) {
    if (RC_NOT_ITEM.test(l) || !/[a-z]{2}/i.test(l)) return;
    var m = l.match(/^(.*?[A-Za-z][^]*?)\s+(?:[x×@]\s*\d+(?:[.,]\d+)?\s+)?(?:qar|qr|rs\.?|inr|₹|aed|sar)?\s*(\d{1,3}(?:,\d{3})*|\d+)[.,](\d{2})\s*[A-Z*]?$/i);
    if (!m) return;
    var name = m[1].replace(/^\d+\s+/, '').replace(/\s+\d+(?:[.,]\d+)?\s*(?:x|×|@)?\s*$/i, '').replace(/[^\p{L}\p{N}&'’ .\-\/]/gu, ' ').replace(/\s+/g, ' ').trim();
    if (name.replace(/[^A-Za-z؀-ۿ]/g, '').length < 2) return;
    items.push({ name: name.slice(0, 40), amt: parseFloat(m[2].replace(/,/g, '') + '.' + m[3]) });
  });
  if (items.length > 60) items = items.slice(0, 60);
  var sum = Math.round(items.reduce(function (s, x) { return s + x.amt; }, 0) * 100) / 100;
  // No total keyword: use the item sum, else the largest amount that isn't cash handed over or change.
  var amt = best ? best.amt : 0;
  if (!amt && sum) amt = sum;
  if (!amt) lines.forEach(function (l) { if (/\b(cash|change|tender|paid)\b/i.test(l)) return; rcAmounts(l).forEach(function (a) { if (a > amt && a < 1e7) amt = a; }); });
  // Store: the first line near the top that reads like a name.
  var merchant = '';
  for (var i = 0; i < Math.min(lines.length, 8) && !merchant; i++) {
    var l = lines[i], letters = (l.match(/[A-Za-z؀-ۿ]/g) || []).length;
    if (letters >= 3 && letters / l.length > 0.55 && !RC_NOT_NAME.test(l) && !rcAmounts(l).length) merchant = tidyName(l.replace(/[^\p{L}\p{N}&'’ .\-]/gu, ' '));
  }
  var cur = ''; for (var c = 0; c < RC_CUR.length; c++) if (RC_CUR[c][0].test(all)) { cur = RC_CUR[c][1]; break; }
  var ts = parseWhen(all, 400);
  return { merchant: merchant, amt: amt, ts: ts, cur: cur, items: items, sum: sum, found: { total: !!best, date: !!ts, merchant: !!merchant } };
}

/* Example bills for the self-check (typed the way OCR returns them, including its typical noise). */
function selfTestReceipts() {
  var y = new Date(Date.now() - DAY), p = function (x) { return ('0' + x).slice(-2); };
  var d1 = p(y.getDate()) + '/' + p(y.getMonth() + 1) + '/' + y.getFullYear();
  return [
    { name: 'Qatar hypermarket', text: 'LULU HYPERMARKET\nD-Ring Road, Doha\nTel: 4466 0000\nTAX INVOICE\nDate: ' + d1 + ' 18:42\nAlmarai Milk 2L 12.50\nTomato Kg 1 x 6.75 6.75\nKhubz Arabic 2.00\nSub Total 21.25\nTotal Items 3\nNET TOTAL QAR 21.25\nCash 50.00\nChange 28.75\nThank you',
      want: { merchant: 'Lulu Hypermarket', amt: 21.25, items: 3, cur: 'QAR', day: 'y', hm: '18:42' } },
    { name: 'Indian kirana bill', text: 'SRI RAM STORES\nGSTIN 33ABCDE1234F1Z5\nBill No 4521  Date ' + p(y.getDate()) + '-' + p(y.getMonth() + 1) + '-' + String(y.getFullYear()).slice(2) + '\nToor Dal 1kg  145.00\nSunflower Oil 1L 168.00\nSugar  48.00\nCGST 2.5% 9.03\nSGST 2.5% 9.03\nGrand Total Rs. 379.06\nUPI',
      want: { merchant: 'Sri Ram Stores', amt: 379.06, items: 3, cur: 'INR', day: 'y' } },
    { name: 'Total on the next line', text: 'CORNER BAKERY\nCroissant 8.00\nLatte 14.00\nTOTAL\n22.00\nVisa ****4821',
      want: { merchant: 'Corner Bakery', amt: 22, items: 2 } },
    { name: 'No total word: items are summed', text: 'FRESH MART\nBananas 4.50\nBread 3.25',
      want: { merchant: 'Fresh Mart', amt: 7.75, items: 2 } }
  ];
}
