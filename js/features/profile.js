/* BasKar · js/features/profile.js
   Settings → Edit profile: photo, name, email and change password. Also the per-account theme colour.
   The photo, name and email live in the account list (bk_idx), which is not encrypted, so they can show on the
   sign-in screen before unlocking. Changing the password re-seals the data with a new key.
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

var PHOTO_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$/;
var THEME_COLOURS = [
  ['', 'App colour'], ['#876628', 'Brass'], ['#2F6FB2', 'Ocean'], ['#2E7D5B', 'Forest'], ['#B4436C', 'Rose'],
  ['#6A4FB6', 'Grape'], ['#C2562B', 'Saffron'], ['#3A3D43', 'Graphite']
];

/* The accent in use: this account's theme colour, else the device's brand colour. */
function themeAccent() { var a = S.p && S.p.settings && S.p.settings.accent; return HEX_RE.test(a || '') ? a : (HEX_RE.test(BR.accent || '') ? BR.accent : ''); }
function applyAccent() {
  var st = document.getElementById('brand-css');
  if (!st) { st = document.createElement('style'); st.id = 'brand-css'; (document.head || document.documentElement).appendChild(st); }
  st.textContent = brandCss(themeAccent());
}

function colourRow() {
  var cur = (S.p.settings && S.p.settings.accent) || '';
  return '<div class="swatches" role="group" aria-label="Theme colour">' + THEME_COLOURS.map(function (c) {
    var fill = c[0] || BR.accent || '#876628';
    return '<button type="button" class="swatch' + (c[0] ? '' : ' brand') + '" data-act="theme-colour" data-k="' + c[0] + '" aria-pressed="' + (cur === c[0]) + '" aria-label="' + esc(c[1]) + '" title="' + esc(c[1]) + '" style="--sw:' + fill + '">' + (cur === c[0] ? ic('check', 16) : '') + '</button>';
  }).join('') + '</div>';
}

function sheetProfile(sh) {
  var m = meta() || {}, d = sh.draft;
  return sheetHead('Edit profile') +
    '<section class="stack" style="align-items:center">' + avatar({ name: d.name || m.name, photo: d.photo }, 96) +
    '<div class="row wrap" style="justify-content:center"><input type="file" id="pf-photo" accept="image/*" class="sr-only"><label for="pf-photo" class="btn quiet sm">' + ic('pen', 16) + ' ' + (d.photo ? 'Change photo' : 'Add photo') + '</label>' +
    (d.photo ? '<button type="button" class="btn ghost sm" data-act="pf-photo-remove">Remove photo</button>' : '') + '</div>' +
    '<p class="error" id="pf-err" role="alert" hidden></p></section>' +
    '<form id="profile-form" class="stack" novalidate>' +
    '<div class="field"><label for="pf-name">Your name</label><input id="pf-name" class="input" value="' + esc(d.name) + '" autocomplete="name" required></div>' +
    '<div class="field"><label for="pf-email">Email <span class="muted">(optional)</span></label><input id="pf-email" class="input" type="email" value="' + esc(d.email) + '" autocomplete="email"></div>' +
    '<p class="hint">Your photo, name and email show on the sign-in screen of this device, so they aren’t encrypted.</p>' +
    (sh.err ? '<p class="error" role="alert">' + esc(sh.err) + '</p>' : '') +
    '<button type="submit" class="btn block">Save profile</button></form>' +
    '<span class="eyebrow pad">Password</span>' +
    (sh.pw ? '<form id="pw-form" class="card stack" novalidate>' +
      '<div class="field"><label for="pw-cur">Current password</label><input id="pw-cur" class="input" type="password" autocomplete="current-password"></div>' +
      '<div class="field"><label for="pw-new">New password</label><input id="pw-new" class="input" type="password" autocomplete="new-password"></div>' +
      '<div class="field"><label for="pw-new2">Confirm new password</label><input id="pw-new2" class="input" type="password" autocomplete="new-password"></div>' +
      '<p class="error" id="pw-err" role="alert"' + (sh.pwErr ? '' : ' hidden') + '>' + esc(sh.pwErr || '') + '</p>' +
      '<p class="hint">Your data is re-encrypted with the new password. Face ID has to be turned on again afterwards.</p>' +
      '<div class="duo"><button type="button" class="btn ghost" data-act="pf-pw-cancel">Cancel</button><button type="submit" class="btn"' + (sh.busy ? ' disabled' : '') + '>' + (sh.busy ? 'Changing…' : 'Change password') + '</button></div></form>'
      : '<section class="card tight">' + setItem('pf-pw', 'lock', 'Change password', 'Re-encrypts your data with the new one') + '</section>');
}

function processPhoto(file) {
  var err = $('#pf-err');
  function fail(t) { if (err) { err.textContent = t; err.hidden = false; } }
  if (!file) return;
  if (!/^image\//.test(file.type)) return fail('Use a photo: JPG, PNG or HEIC.');
  if (file.size > 15 * 1024 * 1024) return fail('That photo is over 15 MB. Try another one.');
  var url = URL.createObjectURL(file), img = new Image();
  img.onerror = function () { URL.revokeObjectURL(url); fail('Couldn’t read that photo. Try a JPG or PNG.'); };
  img.onload = function () {
    try {
      var w = img.naturalWidth, h = img.naturalHeight, side = Math.min(w, h), N = 160;
      var cv = document.createElement('canvas'); cv.width = N; cv.height = N;
      cv.getContext('2d').drawImage(img, (w - side) / 2, (h - side) / 2, side, side, 0, 0, N, N);
      var out = cv.toDataURL('image/jpeg', 0.82);
      URL.revokeObjectURL(url);
      if (!PHOTO_RE.test(out) || out.length > 30000) return fail('Couldn’t shrink that photo. Try another one.');
      S.sheet.draft.photo = out; renderSheet();
    } catch (e) { fail('Couldn’t read that photo. Try a JPG or PNG.'); }
  };
  img.src = url;
}

function saveProfileInfo() {
  var sh = S.sheet, m = meta(); if (!m) return;
  var name = ($('#pf-name').value || '').trim(), email = ($('#pf-email').value || '').trim();
  if (!name) { sh.draft.name = name; sh.draft.email = email; sh.err = 'Add your name so you can tell accounts apart.'; renderSheet(); return; }
  m.name = name.slice(0, 40); m.email = email.slice(0, 80);
  if (sh.draft.photo && PHOTO_RE.test(sh.draft.photo)) m.photo = sh.draft.photo; else delete m.photo;
  saveIndex(); S.sheet = { type: 'settings' }; renderAll();
  toast('Profile saved', 'Your photo and name show on this device’s sign-in screen.');
}

/* Re-seal the data with a key from the new password before switching the stored hash, so a failure can't lock anyone out. */
function changePassword() {
  var sh = S.sheet, m = meta(); if (!m) return;
  var cur = $('#pw-cur').value, nw = $('#pw-new').value, nw2 = $('#pw-new2').value;
  /* Show problems in place, so the typed passwords aren't wiped by a re-render. */
  function busy(on) { sh.busy = on; var btn = $('#pw-form button[type=submit]'); if (btn) { btn.disabled = on; btn.textContent = on ? 'Changing…' : 'Change password'; } }
  function bad(t) { sh.pwErr = t; busy(false); var el = $('#pw-err'); if (el) { el.textContent = t; el.hidden = false; } else renderSheet(); }
  if (nw.length < 4) return bad('Use a password of at least 4 characters.');
  if (nw !== nw2) return bad('The two passwords don’t match.');
  sh.pwErr = ''; var pe = $('#pw-err'); if (pe) pe.hidden = true; busy(true);
  hashPw(cur, m.salt).then(function (h) {
    if (h !== m.hash) return bad('That password doesn’t match this account. Try again.');
    var salt = uid(), oldKey = Vault.key, oldRaw = Vault.raw, pid = S.pid;
    return Promise.all([hashPw(nw, salt), vaultDerive(nw, salt)]).then(function (r) {
      var hash = r[0], kr = r[1];
      if (Vault.ok && !kr) return bad('This browser couldn’t make a new key. Nothing was changed.');
      if (kr) { Vault.key = kr.key; Vault.raw = kr.raw; }
      var snap = JSON.stringify(S.p);
      Vault.queue = Vault.queue.then(function () { return kr ? vaultSeal(snap, kr.key) : JSON.parse(snap); }).then(function (rec) {
        writeProfile(pid, rec);
        m.salt = salt; m.hash = hash; saveIndex();
        var stays = vaultStaysUnlocked(pid);
        vaultForget(pid, true); if (kr) vaultRemember(pid, kr.raw, stays);
        var hadBio = !!bioGet(pid); bioClear(pid);
        S.sheet = { type: 'settings' }; renderSheet();
        toast('Password changed', hadBio ? 'Turn Face ID on again in Settings.' : 'Use the new password next time you unlock.');
      }).catch(function () {
        Vault.key = oldKey; Vault.raw = oldRaw; saveProfile();
        bad('Couldn’t save with the new password. Nothing was changed.');
      });
    });
  });
}

/* Actions (data-act="…") for this feature. */
Object.assign(ACT, {
  'profile-edit': function () { var m = meta() || {}; openSub({ type: 'profile', draft: { name: m.name || '', email: m.email || '', photo: m.photo || '' } }); },
  'pf-photo-remove': function () { S.sheet.draft.photo = ''; renderSheet(); },
  'pf-pw': function () { S.sheet.pw = true; S.sheet.pwErr = ''; renderSheet(); focusSoon('#pw-cur'); },
  'pf-pw-cancel': function () { S.sheet.pw = false; S.sheet.pwErr = ''; renderSheet(); },
  'theme-colour': function (el) {
    var k = el.dataset.k || ''; if (k && !HEX_RE.test(k)) return;
    if (k) S.p.settings.accent = k; else delete S.p.settings.accent;
    saveProfile(); applyAccent(); renderSheet(); if (S.tab === 'insights') drawCharts();
  }
});
