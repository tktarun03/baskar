/* BasKar · js/core/format.js
   Currencies (every ISO 4217 code), money(), dates and times.
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

var CURRENCIES = (function () {
  var list = [];
  try { list = Intl.supportedValuesOf('currency'); } catch (e) { }
  if (!list || !list.length) list = ['AED', 'ARS', 'AUD', 'BDT', 'BHD', 'BRL', 'CAD', 'CHF', 'CLP', 'CNY', 'COP', 'CZK', 'DKK', 'EGP', 'EUR', 'GBP', 'HKD', 'HUF', 'IDR', 'ILS', 'INR', 'JOD', 'JPY', 'KES', 'KRW', 'KWD', 'LKR', 'MXN', 'MYR', 'NGN', 'NOK', 'NPR', 'NZD', 'OMR', 'PEN', 'PHP', 'PKR', 'PLN', 'QAR', 'RUB', 'SAR', 'SEK', 'SGD', 'THB', 'TRY', 'TWD', 'USD', 'VND', 'ZAR'];
  var dn = null; try { dn = new Intl.DisplayNames(['en'], { type: 'currency' }); } catch (e) { }
  return list.map(function (code) { var name = code; try { name = dn ? (dn.of(code) || code) : code; } catch (e) { } return { code: code, name: name }; });
})();

var POPULAR = ['USD', 'EUR', 'GBP', 'INR', 'AED', 'QAR', 'SAR', 'SGD', 'JPY', 'CNY', 'AUD', 'CAD', 'CHF'];

var TZ_CUR = { 'Asia/Kolkata': 'INR', 'Asia/Calcutta': 'INR', 'Asia/Qatar': 'QAR', 'Asia/Dubai': 'AED', 'Asia/Riyadh': 'SAR', 'Asia/Kuwait': 'KWD', 'Asia/Bahrain': 'BHD', 'Asia/Muscat': 'OMR', 'Asia/Karachi': 'PKR', 'Asia/Dhaka': 'BDT', 'Asia/Colombo': 'LKR', 'Asia/Kathmandu': 'NPR', 'Asia/Singapore': 'SGD', 'Asia/Tokyo': 'JPY', 'Asia/Shanghai': 'CNY', 'Asia/Hong_Kong': 'HKD', 'Asia/Seoul': 'KRW', 'Asia/Jakarta': 'IDR', 'Asia/Manila': 'PHP', 'Asia/Bangkok': 'THB', 'Asia/Kuala_Lumpur': 'MYR', 'Europe/London': 'GBP', 'Europe/Zurich': 'CHF', 'Europe/Istanbul': 'TRY', 'Europe/Stockholm': 'SEK', 'Europe/Oslo': 'NOK', 'Europe/Copenhagen': 'DKK', 'Europe/Warsaw': 'PLN', 'Australia/Sydney': 'AUD', 'Australia/Melbourne': 'AUD', 'Pacific/Auckland': 'NZD', 'America/Toronto': 'CAD', 'America/Vancouver': 'CAD', 'America/Sao_Paulo': 'BRL', 'America/Mexico_City': 'MXN', 'Africa/Lagos': 'NGN', 'Africa/Nairobi': 'KES', 'Africa/Johannesburg': 'ZAR', 'Africa/Cairo': 'EGP' };

function guessCurrency() {
  try {
    var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (TZ_CUR[tz]) return TZ_CUR[tz];
    if (/^Europe\//.test(tz)) return 'EUR';
    if (/^America\//.test(tz)) return 'USD';
  } catch (e) { }
  return 'USD';
}

var nfCache = {}, symCache = {};

function locFor(cur) { if (cur === 'INR') return 'en-IN'; try { return navigator.language || 'en-US'; } catch (e) { return 'en-US'; } }

function digitsFor(cur) { try { return new Intl.NumberFormat('en', { style: 'currency', currency: cur }).resolvedOptions().maximumFractionDigits; } catch (e) { return 2; } }

function curNow() { return S.p ? S.p.currency : guessCurrency(); }

function hidden() { return !!(S.p && S.p.settings && S.p.settings.hide); }

function money(n, opts) {
  opts = opts || {};
  var cur = opts.cur || curNow();
  if (hidden() && !opts.show) return curSymbol(cur) + ' ••••';
  var key = cur + (opts.compact ? ':c' : '');
  if (!nfCache[key]) {
    try {
      nfCache[key] = new Intl.NumberFormat(locFor(cur), opts.compact
        ? { style: 'currency', currency: cur, notation: 'compact', maximumFractionDigits: 1 }
        : { style: 'currency', currency: cur, minimumFractionDigits: 0, maximumFractionDigits: digitsFor(cur) });
    } catch (e) { nfCache[key] = { format: function (v) { return cur + ' ' + Math.round(v).toLocaleString(); } }; }
  }
  var v = Number(n) || 0;
  if (!opts.compact && Math.abs(v) >= 10) v = Math.round(v);
  return nfCache[key].format(v);
}

function curSymbol(cur) {
  if (symCache[cur]) return symCache[cur];
  var out = cur;
  try {
    var parts = new Intl.NumberFormat(locFor(cur), { style: 'currency', currency: cur }).formatToParts(0);
    for (var i = 0; i < parts.length; i++) if (parts[i].type === 'currency') { out = parts[i].value; break; }
  } catch (e) { }
  symCache[cur] = out;
  return out;
}

function kb(n) { return n < 1024 ? n + ' B' : (n / 1024).toFixed(1) + ' KB'; }

function fmtDate(ts, o) { return new Date(ts).toLocaleDateString(LOC(), o || { weekday: 'short', day: 'numeric', month: 'short' }); }

function fmtTime(ts) { return new Date(ts).toLocaleTimeString(LOC(), { hour: 'numeric', minute: '2-digit' }); }

function toLocalInput(ts) { var d = new Date(ts); function p(x) { return ('0' + x).slice(-2); } return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes()); }

function currencyOptions(sel) {
  var pop = CURRENCIES.filter(function (c) { return POPULAR.indexOf(c.code) >= 0; });
  var dn = null; try { dn = LANG !== 'en' ? new Intl.DisplayNames([LANG], { type: 'currency' }) : null; } catch (e) { }
  function opt(c) { var nm = c.name; try { if (dn) nm = dn.of(c.code) || nm; } catch (e) { } return '<option value="' + c.code + '"' + (c.code === sel ? ' selected' : '') + '>' + esc(c.code + ' · ' + nm) + '</option>'; }
  return '<optgroup label="Popular">' + pop.map(opt).join('') + '</optgroup><optgroup label="All currencies">' + CURRENCIES.map(function (c) { return POPULAR.indexOf(c.code) >= 0 ? '' : opt(c); }).join('') + '</optgroup>';
}

function relDays(days) { return days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : days === -1 ? 'Yesterday' : days > 0 ? 'In ' + days + ' days' : (-days) + ' days ago'; }
