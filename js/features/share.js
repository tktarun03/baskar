/* BasKar · js/features/share.js
   Share buttons: tonight's recap (as an image), the weekly review, a goal, a single payment, this cycle's
   spending, a backup or CSV file, and an invite link to the app. Uses the phone's share sheet (WhatsApp,
   Messages, Mail, Files) where the browser has one; otherwise copies the text, or shows it to copy.
   Nothing is sent anywhere unless the person picks a target in the share sheet. "Hide amounts" also hides
   amounts in anything shared.
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

/* English text → the current language (same table as the screen), with the white-label names. */
function T(s) { return brandify(trText(s)); }
function appLink() { return IS_TOP && /^https?:/.test(location.protocol) ? location.origin + location.pathname.replace(/index\.html$/, '') : ''; }
function shareFooter() { var u = appLink(); return '\n— ' + T('Made with BasKar') + (u ? ' · ' + u : ''); }
function canShare() { return !!(navigator.share && IS_TOP); }

/* Text: share sheet → clipboard → a sheet to copy from. */
function shareText(title, text) {
  if (canShare()) {
    return navigator.share({ title: title, text: text }).then(function () { return 'shared'; }, function (e) {
      if (e && e.name === 'AbortError') return 'cancelled';
      return copyShare(title, text);
    });
  }
  return copyShare(title, text);
}
function copyShare(title, text) {
  function show() { S.sheet = { type: 'share-out', title: title, text: text, back: S.sheet }; renderSheet(); return 'shown'; }
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { toast('Copied', 'Paste it into any chat or email.'); return 'copied'; }, show);
    }
  } catch (e) { }
  return Promise.resolve(show());
}

/* Files (image, backup, CSV): share sheet if it takes files, else a normal download. Everything up to share() is
   synchronous so iPhone still treats it as part of the tap. */
function dataUrlBlob(url) {
  var parts = url.split(','), mime = parts[0].match(/:(.*?);/)[1], bin = atob(parts[1]), arr = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}
function shareFile(name, data, type, title, text) {
  var file = null;
  try { file = new File([data], name, { type: type }); } catch (e) { }
  if (file && canShare() && navigator.canShare && navigator.canShare({ files: [file] })) {
    var payload = { files: [file], title: title }; if (text) payload.text = text;
    return navigator.share(payload).then(function () { return 'shared'; }, function (e) { return e && e.name === 'AbortError' ? 'cancelled' : saveFile(name, data, type); });
  }
  return saveFile(name, data, type);
}

/* ---- What each share says ---- */
function recapShareText() {
  var c = calc(S.p), date = fmtDate(Date.now(), { weekday: 'short', day: 'numeric', month: 'short' });
  var lines = [T('Tonight’s recap') + ' · ' + date];
  if (c.usedToday === 0) lines.push(T('No spending today'));
  else lines.push(T('I spent ' + money(c.spentToday) + ' of my ' + money(c.todayBudget) + ' budget today.'));
  if (c.usedToday) lines.push(c.over ? T('Over by ' + money(-c.left) + '.') : T('Kept ' + money(c.left) + '.'));
  var st = streakInfo(S.p, c); if (st.current >= 2) lines.push(T(st.current + ' day streak'));
  return lines.join('\n') + shareFooter();
}
function weekShareText() {
  var w = weekStats(), lines = [T('My week') + ': ' + T(money(w.tot) + ' spent')];
  if (w.ptot) lines.push(T(deltaText(w)));
  if (w.judged) lines.push(T('Days on budget') + ': ' + w.onBudget + ' / ' + w.judged);
  if (w.payees[0]) lines.push(T('Your biggest spend: ' + money(w.payees[0].a) + '.').replace(/\.$/, '') + ' · ' + w.payees[0].name);
  return lines.join('\n') + shareFooter();
}
function goalShareText(g) {
  var saved = goalSaved(g), target = num(g.target), pct = target > 0 ? Math.min(100, Math.round(saved / target * 100)) : 0;
  return '“' + g.name + '”\n' + (pct >= 100 ? T('Goal reached!') : T('I’m ' + pct + '% of the way to my goal.')) + '\n' + money(saved) + ' / ' + money(target) + shareFooter();
}
function txnShareText(t) {
  var cat = CATS[t.cat] || CATS.other;
  var head = t.kind === 'income' ? T('Received') : T('Paid');
  var parts = [head + ' ' + money(t.amt), t.merchant || T(cat.short), fmtDate(t.ts, { weekday: 'short', day: 'numeric', month: 'short' }) + ' ' + fmtTime(t.ts)];
  return parts.join(' · ') + (t.note ? '\n' + t.note : '') + shareFooter();
}
function cycleShareText() {
  var c = calc(S.p), tot = catTotals(c.cyc), keys = Object.keys(tot).sort(function (a, b) { return tot[b].a - tot[a].a; }).slice(0, 4);
  var lines = [T('Where it went') + ' · ' + T('This cycle · day ' + c.cy.dayIndex + ' of ' + c.cy.days), T(money(c.cycleSpent) + ' spent')];
  keys.forEach(function (k) { lines.push('• ' + T((CATS[k] || CATS.other).label) + ': ' + money(tot[k].a) + ' (' + Math.round(tot[k].a / Math.max(c.cycleSpent, 1) * 100) + '%)'); });
  return lines.join('\n') + shareFooter();
}
function inviteText() { return T('I’m budgeting with BasKar. It tells me what I can safely spend today, and my data stays on my phone.') + '\n' + siteLink(); }

/* ---- Tonight's recap as a receipt image (PNG) ---- */
function recapImage() {
  var c = calc(S.p), roast = S.p.settings.roast, rtl = LANGS[LANG].dir === 'rtl';
  var items = S.p.txns.filter(function (t) { return t.ts >= c.t0 && t.ts < c.t1 && counts(t); }).sort(function (a, b) { return a.ts - b.ts; });
  var show = items.slice(0, 10), W = 720, pad = 56, lineH = 44, H = 600 + Math.max(1, show.length) * lineH + (items.length > show.length ? lineH : 0);
  var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  var x = cv.getContext('2d'), ink = '#17171A', muted = '#6C6A64', paper = '#FDFCF9';
  var mono = '"IBM Plex Mono", ui-monospace, Menlo, monospace', sans = '"Hanken Grotesk", "Noto Sans Arabic", "Noto Sans Tamil", system-ui, sans-serif';
  x.fillStyle = '#EEF0F2'; x.fillRect(0, 0, W, H);
  x.fillStyle = paper; x.fillRect(24, 24, W - 48, H - 48);
  x.direction = rtl ? 'rtl' : 'ltr';
  var L = rtl ? W - pad : pad, R = rtl ? pad : W - pad;
  function txt(s, px, y, font, color, align) { x.font = font; x.fillStyle = color || ink; x.textAlign = align; x.fillText(s, px, y); }
  function row(a, b, y, font, color) { txt(a, L, y, font, color, 'start'); txt(b, R, y, font, color, 'end'); }
  function rule(y) { x.strokeStyle = 'rgba(23,23,26,.45)'; x.setLineDash([6, 6]); x.beginPath(); x.moveTo(pad, y); x.lineTo(W - pad, y); x.stroke(); x.setLineDash([]); }
  txt(BR.name.toUpperCase(), W / 2, 100, '500 30px ' + mono, ink, 'center');
  txt(T(roast ? 'BILL OF BAD DECISIONS' : 'DAILY SUMMARY'), W / 2, 140, '400 20px ' + sans, ink, 'center');
  var word = LANG === 'en' ? mono : sans; // Arabic and Tamil letters break apart in a monospace font
  txt(fmtDate(Date.now(), { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }), W / 2, 174, '400 18px ' + word, muted, 'center');
  rule(204);
  var y = 250;
  if (!show.length) { txt(T(roast ? 'NO ITEMS. SUSPICIOUS.' : 'NO SPENDS LOGGED.'), W / 2, y, '400 20px ' + word, ink, 'center'); y += lineH; }
  show.forEach(function (t) {
    var name = t.kind === 'save' ? '→ ' + ((goalById(t.goal) || {}).name || T('Goal')) : (t.merchant || T((CATS[t.cat] || CATS.other).short));
    if (name.length > 22) name = name.slice(0, 21) + '…';
    row(fmtTime(t.ts) + '  ' + name.toUpperCase(), money(t.amt), y, '400 20px ' + word); y += lineH;
  });
  if (items.length > show.length) { txt('+ ' + (items.length - show.length), L, y, '400 18px ' + mono, muted, 'start'); y += lineH; }
  rule(y - 14); y += 30;
  row(T('SPENT'), money(c.spentToday), y, '500 22px ' + word); y += lineH;
  row(T('BUDGET'), money(c.todayBudget), y, '500 22px ' + word); y += lineH;
  var bad = c.over;
  row(T(bad ? 'OVER BY' : 'KEPT'), money(Math.abs(c.left)), y, '600 26px ' + word, bad ? '#B4432E' : '#1F7A50'); y += lineH + 10;
  // stamp
  x.save(); x.translate(W / 2, y + 30); x.rotate(-0.21); x.strokeStyle = x.fillStyle = bad ? '#B4432E' : '#1F7A50'; x.lineWidth = 3; x.globalAlpha = 0.85;
  var stamp = c.usedToday === 0 ? T('ZERO DAY') : bad ? (roast ? stampText(BR.catch) : T('OVER')) : (roast ? T('SHABASH') : T('ON TRACK'));
  x.font = '600 28px ' + sans; var sw = x.measureText(stamp).width + 36; x.strokeRect(-sw / 2, -30, sw, 52); x.textAlign = 'center'; x.fillText(stamp, 0, 6); x.restore();
  txt(T('Made with BasKar'), W / 2, H - 60, '400 18px ' + sans, muted, 'center');
  return cv.toDataURL('image/png');
}

/* Fallback when the browser has no share sheet and no clipboard. */
function sheetShareOut(sh) {
  return sheetHead(sh.title || 'Share') +
    '<p class="hint">Copy this and paste it into any chat or email.</p>' +
    '<textarea id="share-txt" class="input" rows="8" readonly data-noi18n>' + esc(sh.text) + '</textarea>' +
    '<button type="button" class="btn block" data-act="share-copy">' + ic('copy', 18) + ' Copy</button>';
}
function shareButton(act, label, extra) { return '<button type="button" class="btn quiet" data-act="' + act + '"' + (extra || '') + '>' + ic('share', 18) + ' <span>' + esc(label) + '</span></button>'; }

/* Actions (data-act="…") for this feature. */
Object.assign(ACT, {
  'share-recap': function () {
    var text = recapShareText(), name = fileSlug() + '-recap-' + new Date().toISOString().slice(0, 10) + '.png';
    var blob = null; try { blob = dataUrlBlob(recapImage()); } catch (e) { }
    if (blob && canShare()) { shareFile(name, blob, 'image/png', T('Tonight’s recap'), text); return; }
    shareText(T('Tonight’s recap'), text);
  },
  'share-week': function () { shareText(T('Your week'), weekShareText()); },
  'share-goal': function (el) { var g = goalById(el.dataset.id); if (g) shareText(g.name, goalShareText(g)); },
  'share-txn': function () { var t = S.p.txns.filter(function (x) { return x.id === (S.sheet && S.sheet.id); })[0]; if (t) shareText(t.merchant || T('Payment'), txnShareText(t)); },
  'share-cycle': function () { shareText(T('Where it went'), cycleShareText()); },
  'share-app': function () { shareText(BR.name, inviteText()); },
  'share-backup': function () {
    var fn = fileSlug() + '-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    var data = JSON.stringify({ app: 'BasKar', kind: 'backup', version: RELEASES[0].v, savedAt: new Date().toISOString(), profile: S.p }, null, 1);
    shareFile(fn, data, 'application/json', T('Back up your data')).then(function (r) {
      if (r === 'shared' || r === 'saved' || r === 'delivered') { S.p.lastBackup = Date.now(); S.p.backupSnooze = 0; saveProfile(); if (S.sheet) renderSheet(); toast('Backup saved', 'The file isn’t encrypted. Keep it somewhere private.'); }
    });
  },
  'share-csv': function () {
    if (!S.p.txns.length) { toast('Nothing to export yet', 'Log a few spends first.'); return; }
    var fn = fileSlug() + '-transactions-' + new Date().toISOString().slice(0, 10) + '.csv';
    shareFile(fn, buildCsv(), 'text/csv', T('Export CSV')).then(function (r) { if (r === 'saved') toast('CSV saved', fn); });
  },
  'share-copy': function () {
    var ta = $('#share-txt'); if (!ta) return;
    ta.focus(); ta.select();
    try { if (document.execCommand('copy')) { toast('Copied', 'Paste it into any chat or email.'); return; } } catch (e) { }
    toast('Copy isn’t allowed here', 'The text is selected. Copy it with your keyboard or long-press.');
  }
});
