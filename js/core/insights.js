/* BasKar · js/core/insights.js
   Insights helpers: top payees and time of day.
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

function payeeBoard(list) {
  var g = {};
  list.forEach(function (t) { if (!t.merchant) return; var k = t.merchant.trim().toLowerCase(); if (!g[k]) g[k] = { name: t.merchant.trim(), a: 0, n: 0, cat: t.cat }; g[k].a += t.amt; g[k].n++; });
  return Object.keys(g).map(function (k) { return g[k]; }).sort(function (a, b) { return b.a - a.a; });
}

var TOD = [['Early morning', 4, 8, '4–8 am'], ['Morning', 8, 11, '8–11 am'], ['Midday', 11, 15, '11 am–3 pm'], ['Afternoon', 15, 18, '3–6 pm'], ['Evening', 18, 22, '6–10 pm'], ['Late night', 22, 28, '10 pm–4 am']];

function todSplit(list) {
  var out = TOD.map(function (b) { return { label: b[0], range: b[3], a: 0, n: 0 }; });
  list.forEach(function (t) { var h = new Date(t.ts).getHours(); if (h < 4) h += 24; for (var i = 0; i < TOD.length; i++) if (h >= TOD[i][1] && h < TOD[i][2]) { out[i].a += t.amt; out[i].n++; break; } });
  return out;
}
