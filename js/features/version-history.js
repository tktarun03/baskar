/* BasKar · js/features/version-history.js
   Settings → Version history.
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

function sheetHistory() {
  return sheetHead('Version history') +
    '<p class="hint">You’re on version ' + esc(APP_VERSION) + '.</p>' +
    '<section class="card tight">' + RELEASES.map(function (r, i) {
      return '<div class="rel"><div class="row between"><strong style="font-size:16px">Version ' + esc(r.v) + '</strong><span class="hint">' + esc(r.date) + (i === 0 ? ' · current' : '') + '</span></div><ul>' + r.notes.map(function (n) { return '<li data-noi18n>' + esc(n) + '</li>'; }).join('') + '</ul></div>';
    }).join('') + '</section>' +
    '<button type="button" class="btn quiet block" data-act="close">Done</button>';
}

/* Actions (data-act="…") for this feature. */
Object.assign(ACT, {
  history: function () { openSub({ type: 'history' }); }
});
