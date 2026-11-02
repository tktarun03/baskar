/* BasKar · js/features/accounts.js
   Switch account, add account, sign out.
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

function sheetProfiles() {
  return sheetHead('Accounts') + '<div class="plist">' +
    S.index.profiles.map(function (m) {
      var me = m.id === S.pid;
      return '<button type="button" class="prow" data-act="' + (me ? 'close' : 'switch-to') + '" data-id="' + esc(m.id) + '">' + avatar(m, 42) + '<span class="grow"><strong>' + esc(m.name) + '</strong><span class="hint">' + dots([me ? 'Signed in' : 'Tap to switch', m.demo ? 'Example data' : '']) + '</span></span>' + (me ? '<span style="color:var(--good)">' + ic('check', 20) + '</span>' : ic('chev', 18)) + '</button>';
    }).join('') + '</div>' +
    '<div class="duo"><button type="button" class="btn quiet" data-act="add-profile">' + ic('plus', 18) + ' New account</button><button type="button" class="btn quiet" data-act="signout">' + ic('logout', 18) + ' Sign out</button></div>';
}

/* Actions (data-act="…") for this feature. */
Object.assign(ACT, {
  profiles: function () { S.sheet = { type: 'profiles' }; renderSheet(); },
  'switch-to': function (el) { var id = el.dataset.id; signOut(true); S.auth = { mode: 'signin', pick: id, err: '' }; renderAll(); toTop(); focusSoon('#si-pw'); },
  'add-profile': function () { signOut(true); ACT.create(); },
  signout: function () { signOut(); }
});
