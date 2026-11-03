/* BasKar · js/features/backup.js
   Backup file and the reminders on Today: back up after 7 days, and (iPhone Safari) add the app to the Home Screen.
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

var BACKUP_EVERY = 7 * DAY;

function backupDue() {
  if (!S.p || S.p.demo || S.p.txns.length < 5) return false;
  var now = Date.now(), last = S.p.lastBackup || S.p.createdAt || now;
  return now - last > BACKUP_EVERY && !(S.p.backupSnooze > now);
}
function lastBackupText() { return S.p.lastBackup ? 'Last backup ' + relDays(-Math.round((startOfDay(new Date()) - startOfDay(new Date(S.p.lastBackup))) / DAY)).toLowerCase() : 'Never backed up'; }

/* iPhone or iPad Safari, opened as a website rather than from the Home Screen (iosSafari() is in onboarding.js). */
function homeScreenTipDue() {
  if (!S.p) return false;
  try { if (localStorage.getItem('bk_a2hs_off')) return false; } catch (e) { }
  return iosSafari();
}

function renderReminders() {
  var h = '';
  if (backupDue()) {
    h += '<section class="card"><div class="row"><span class="tile" style="--c:var(--accent)">' + ic('database', 18) + '</span><div class="grow"><strong>Back up your data</strong><span class="hint">' + esc(lastBackupText()) + '</span></div></div>' +
      '<p class="hint">Your data lives only in this browser. Save a backup file somewhere safe, like Files or iCloud Drive.</p>' +
      '<div class="duo"><button type="button" class="btn sm" data-act="backup">Back up now</button><button type="button" class="btn ghost sm" data-act="backup-later">Later</button></div></section>';
  }
  if (homeScreenTipDue()) {
    h += '<section class="card"><div class="row"><span class="tile" style="--c:var(--accent)">' + ic('phone', 18) + '</span><div class="grow"><strong>Add to your Home Screen</strong><span class="hint">Opens like an app and works offline.</span></div></div>' +
      '<p class="hint"><span>Tap the Share button, then “Add to Home Screen”.</span> <span>The Home Screen app keeps its own data, so back up here first, then restore the file there from Settings → Storage and backup.</span></p>' +
      '<button type="button" class="btn ghost sm" data-act="a2hs-off">Got it</button></section>';
  }
  return h;
}

function backupNow() {
  if (!S.p) return;
  var fn = fileSlug() + '-backup-' + new Date().toISOString().slice(0, 10) + '.json';
  var data = JSON.stringify({ app: 'BasKar', kind: 'backup', version: RELEASES[0].v, savedAt: new Date().toISOString(), profile: S.p }, null, 1);
  saveFile(fn, data, 'application/json').then(function (r) {
    if (r === 'saved' || r === 'delivered') {
      S.p.lastBackup = Date.now(); S.p.backupSnooze = 0; saveProfile(); renderAll(); if (S.sheet) renderSheet();
      toast('Backup saved', 'The file isn’t encrypted. Keep it somewhere private.');
    } else if (r === 'busy') toast('A save prompt is already open', 'Finish that one first.');
    else if (r !== 'declined') { S.showJson = true; S.sheet = { type: 'storage' }; renderSheet(); toast('Saving files isn’t available here', 'Copy the JSON below and keep it somewhere safe.'); }
  });
}

/* Restore: accepts a backup file ({ kind: 'backup', profile }) or a plain account export. */
function restoreFrom(text) {
  var obj = JSON.parse(text);
  if (obj && obj.kind === 'backup' && obj.profile) obj = obj.profile;
  if (!obj || !Array.isArray(obj.txns) || typeof obj.currency !== 'string') throw new Error('shape');
  S.p = migrate(obj); nfCache = {}; saveProfile(); S.plan = planFrom(S.p); S.showImport = false; applyTheme(); renderAll(); if (S.sheet) renderSheet();
  toast('Imported', S.p.txns.length + ' transactions loaded into this account.');
}

/* Actions (data-act="…") for this feature. */
Object.assign(ACT, {
  backup: function () { backupNow(); },
  'backup-later': function () { S.p.backupSnooze = Date.now() + 3 * DAY; saveProfile(); renderAll(); },
  'a2hs-off': function () { try { localStorage.setItem('bk_a2hs_off', '1'); } catch (e) { } renderAll(); }
});
