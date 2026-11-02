/* BasKar · js/core/util.js
   Small helpers used everywhere: $, esc, uid, num, plural.
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

var DAY = 86400000;

function $(s, r) { return (r || document).querySelector(s); }

function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

function uid() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-5); }

function num(v) { var n = parseFloat(String(v == null ? '' : v).replace(/[^0-9.\-]/g, '')); return isFinite(n) ? n : 0; }

function sumA(a, t) { return a + t.amt; }

function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }

function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
