/* BasKar · js/features/feedback.js
   Spread the word and hear back: invite friends (link or QR code), rate the app, and send feedback.
   Feedback becomes a GitHub issue on the app's repository: the app opens a pre-filled "new issue" page and the
   person submits it there (it needs a free GitHub account and is public). Without GitHub, they can share the
   same text privately. Nothing is sent by the app itself, and no budget data is ever included.
   For a white-label copy, change APP_SITE and APP_REPO below.
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

var APP_SITE = 'https://tktarun03.github.io/baskar/';
var APP_REPO = 'tktarun03/baskar';
var QR_SRC = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js';
var RATE_AFTER_DAYS = 7, RATE_MIN_SPENDS = 10, RATE_AGAIN_DAYS = 45;
var STAR_WORDS = { 1: 'Not for me', 2: 'Needs work', 3: 'It’s okay', 4: 'Really good', 5: 'Love it' };

function siteLink() { return appLink() || APP_SITE; }
function stars(n) { var s = ''; for (var i = 1; i <= 5; i++) s += i <= n ? '★' : '☆'; return s; }

/* Ask once a person has used it for a week, then not again for 45 days; never on the demo. */
function rateDue() {
  if (!S.p || S.p.demo || S.p.rated) return false;
  var now = Date.now(), age = now - (S.p.createdAt || now), spends = S.p.txns.filter(function (t) { return t.kind === 'expense'; }).length;
  return age > RATE_AFTER_DAYS * DAY && spends >= RATE_MIN_SPENDS && !(S.p.rateAskedAt && now - S.p.rateAskedAt < RATE_AGAIN_DAYS * DAY);
}
function rateCard() {
  if (!rateDue()) return '';
  return '<section class="card"><div class="row"><span class="tile" style="--c:var(--accent)">' + ic('star', 18) + '</span><div class="grow"><strong>How’s BasKar so far?</strong><span class="hint">Tap a star. It takes ten seconds.</span></div></div>' +
    starRow(0, 'rate-star') + '<button type="button" class="btn-link" data-act="rate-later" style="align-self:flex-start">Not now</button></section>';
}
function starRow(sel, act) {
  var h = '<div class="stars" role="group" aria-label="Rating" data-noi18n>';
  for (var i = 1; i <= 5; i++) h += '<button type="button" class="star' + (i <= sel ? ' on' : '') + '" data-act="' + act + '" data-k="' + i + '" aria-label="' + i + ' of 5" aria-pressed="' + (i === sel) + '">' + (i <= sel ? '★' : '☆') + '</button>';
  return h + '</div>';
}

function sheetFeedback(sh) {
  var low = sh.rating && sh.rating <= 3;
  return sheetHead('Rate and send feedback') +
    '<section class="stack" style="align-items:center;text-align:center">' + starRow(sh.rating || 0, 'fb-star') +
    '<span class="h3">' + (sh.rating ? esc(STAR_WORDS[sh.rating]) : 'Tap a star') + '</span></section>' +
    '<div class="field"><label for="fb-liked">What do you like?</label><textarea id="fb-liked" class="input prose" rows="3" placeholder="e.g. the daily number, bank SMS">' + esc(sh.liked || '') + '</textarea></div>' +
    '<div class="field"><label for="fb-improve">' + (low ? 'What should be better?' : 'What would make it better?') + '</label><textarea id="fb-improve" class="input prose" rows="3" placeholder="e.g. a feature you miss, something confusing">' + esc(sh.improve || '') + '</textarea></div>' +
    '<label class="setrow set-row" style="cursor:pointer"><span class="grow"><span class="label">Include app version and device</span><span class="hint">Helps fix problems. Never includes your money or names.</span></span><input type="checkbox" id="fb-tech"' + (sh.tech === false ? '' : ' checked') + ' style="width:22px;height:22px;accent-color:var(--ink)"></label>' +
    '<button type="button" class="btn block" data-act="fb-github"' + (sh.rating ? '' : ' disabled') + '>' + ic('github', 18) + ' <span>Post on GitHub</span></button>' +
    '<p class="fine">Opens GitHub with your feedback filled in. You need a free GitHub account, and posts there are public.</p>' +
    '<button type="button" class="btn quiet block" data-act="fb-share"' + (sh.rating ? '' : ' disabled') + '>' + ic('share', 18) + ' <span>Send it privately instead</span></button>';
}

function fbRead() {
  var sh = S.sheet;
  sh.liked = ($('#fb-liked') || {}).value || ''; sh.improve = ($('#fb-improve') || {}).value || ''; sh.tech = !!($('#fb-tech') || {}).checked;
  return sh;
}
function fbTech() {
  var ua = navigator.userAgent, dev = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : /Mac/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : 'Other';
  var os = (ua.match(/OS (\d+[_.]\d+)/) || ua.match(/Android (\d+(\.\d+)?)/) || [])[1] || '';
  var standalone = navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
  return 'Version ' + APP_VERSION + ' · ' + dev + (os ? ' ' + os.replace('_', '.') : '') + ' · ' + (standalone ? 'Home Screen app' : 'browser') + ' · ' + LANG + ' · ' + (S.p ? S.p.currency : '');
}
function fbDone(sh) {
  if (S.p) { S.p.rated = sh.rating; S.p.rateAskedAt = Date.now(); saveProfile(); }
  S.sheet = { type: 'feedback-thanks', rating: sh.rating }; renderSheet();
}
function sheetFeedbackThanks(sh) {
  return sheetHead('Thank you') +
    '<section class="stack" style="align-items:center;text-align:center"><span class="stars big" data-noi18n>' + stars(sh.rating) + '</span>' +
    '<p class="hint">Every note gets read. Fixes and ideas show up in Version history.</p></section>' +
    (sh.rating >= 4 ? '<section class="card stack"><strong>Know someone who’d like it?</strong><span class="hint">Share the link or show them the QR code.</span><div class="duo">' + shareButton('share-app', 'Share link') + '<button type="button" class="btn quiet" data-act="share-qr">' + ic('qr', 18) + ' <span>QR code</span></button></div></section>' : '') +
    '<button type="button" class="btn quiet block" data-act="close">Done</button>';
}

/* QR code of the app link, for a friend standing next to you. */
function loadQr() {
  if (window.qrcode) return Promise.resolve(window.qrcode);
  return new Promise(function (res, rej) {
    var s = document.createElement('script'); s.src = QR_SRC; s.async = true;
    s.onload = function () { window.qrcode ? res(window.qrcode) : rej(new Error('qr')); }; s.onerror = function () { rej(new Error('qr')); };
    document.head.appendChild(s);
  });
}
function sheetQr(sh) {
  return sheetHead('Scan to open ' + BR.name) +
    '<section class="stack" style="align-items:center;text-align:center"><div class="qr-box" id="qr-box">' + (sh.svg || '<p class="hint">' + (sh.err ? esc(sh.err) : 'Making the code…') + '</p>') + '</div>' +
    '<p class="hint iso" dir="ltr" data-noi18n>' + esc(siteLink()) + '</p><p class="hint">Point the phone camera at the code. It opens the app in the browser.</p></section>' +
    '<div class="duo">' + shareButton('share-app', 'Share link') + '<button type="button" class="btn quiet" data-act="close">Done</button></div>';
}

/* Actions (data-act="…") for this feature. */
Object.assign(ACT, {
  'rate-star': function (el) { S.sheet = { type: 'feedback', rating: +el.dataset.k }; if (S.p) { S.p.rateAskedAt = Date.now(); saveProfile(); } renderAll(); },
  'rate-later': function () { S.p.rateAskedAt = Date.now(); saveProfile(); renderAll(); },
  feedback: function () { S.sheet = { type: 'feedback', rating: S.p && S.p.rated || 0 }; renderSheet(); },
  'fb-star': function (el) { fbRead().rating = +el.dataset.k; renderSheet(); },
  'fb-github': function () {
    var sh = fbRead(); if (!sh.rating) return;
    var q = { template: 'feedback.yml', title: 'Feedback: ' + stars(sh.rating) + ' (' + sh.rating + '/5)', rating: sh.rating + ' – ' + STAR_WORDS[sh.rating], liked: sh.liked.trim(), improve: sh.improve.trim(), details: sh.tech ? fbTech() : '' };
    var url = 'https://github.com/' + APP_REPO + '/issues/new?' + Object.keys(q).filter(function (k) { return q[k]; }).map(function (k) { return k + '=' + encodeURIComponent(q[k]); }).join('&');
    window.open(url, '_blank', 'noopener');
    fbDone(sh);
  },
  'fb-share': function () {
    var sh = fbRead(); if (!sh.rating) return;
    var text = BR.name + ' · ' + stars(sh.rating) + ' (' + sh.rating + '/5)' +
      (sh.liked.trim() ? '\n\n' + T('What do you like?') + '\n' + sh.liked.trim() : '') +
      (sh.improve.trim() ? '\n\n' + T('What would make it better?') + '\n' + sh.improve.trim() : '') +
      (sh.tech ? '\n\n' + fbTech() : '');
    shareText(T('Feedback'), text).then(function (r) { if (r !== 'cancelled') fbDone(sh); });
  },
  'star-github': function () { window.open('https://github.com/' + APP_REPO, '_blank', 'noopener'); },
  'share-qr': function () {
    S.sheet = { type: 'share-qr' }; renderSheet();
    loadQr().then(function (qrcode) {
      var q = qrcode(0, 'M'); q.addData(siteLink()); q.make();
      if (S.sheet && S.sheet.type === 'share-qr') { S.sheet.svg = q.createSvgTag({ cellSize: 6, margin: 2, scalable: true }); renderSheet(); }
    }, function () { if (S.sheet && S.sheet.type === 'share-qr') { S.sheet.err = 'Connect to the internet once to make the code.'; renderSheet(); } });
  }
});
