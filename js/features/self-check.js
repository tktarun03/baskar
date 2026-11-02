/* BasKar · js/features/self-check.js
   Settings → Self-check.
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

function sheetSelfTest() {
  var r = S.sheet.result || runSelfTest(), fails = r.results.filter(function (x) { return !x.ok; }), groups = {};
  S.sheet.result = r;
  r.results.forEach(function (x) { if (!groups[x.group]) groups[x.group] = { pass: 0, total: 0 }; groups[x.group].total++; if (x.ok) groups[x.group].pass++; });
  return sheetHead('Self-check') +
    '<section class="stack-xs"><span class="num xl" style="color:' + (fails.length ? 'var(--bad)' : 'var(--good)') + '">' + r.pass + ' of ' + r.total + '</span><span class="hint">' + (fails.length ? plural(fails.length, 'check') + ' failed. Send a screenshot of the list below so it can be fixed.' : 'All checks passed on this device.') + '</span></section>' +
    '<section class="card tight">' + Object.keys(groups).map(function (g) { var x = groups[g]; return '<div class="wk-row"><div class="grow"><strong style="font-size:15px">' + esc(g) + '</strong></div><span class="pillx ' + (x.pass === x.total ? 'good' : 'bad') + '">' + x.pass + ' / ' + x.total + '</span></div>'; }).join('') + '</section>' +
    (fails.length ? '<section class="card tight">' + fails.map(function (x) { return '<div class="wk-row" data-noi18n><div class="grow"><strong style="font-size:14px">' + esc(x.group + ': ' + x.name) + '</strong><span class="hint">Got ' + esc(JSON.stringify(x.got)) + ', expected ' + esc(JSON.stringify(x.want)) + '</span></div></div>'; }).join('') + '</section>' : '') +
    '<p class="hint">The bank messages here are examples written in common formats, not real messages. Each run also checks dates against yesterday, so it stays valid over time.</p>' +
    '<button type="button" class="btn ghost block" data-act="selftest-again">Run again</button>';
}

/* Actions (data-act="…") for this feature. */
Object.assign(ACT, {
  selftest: function () { openSub({ type: 'selftest' }); },
  'selftest-again': function () { S.sheet.result = null; renderSheet(); toast('Self-check finished', S.sheet.result ? S.sheet.result.pass + ' of ' + S.sheet.result.total + ' passed.' : ''); }
});
