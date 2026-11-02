/* BasKar · js/ui/brand.js
   White label: app name, logo, accent colour, mascot and catchphrase (per device).
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

var BR_DEF = { name: 'BasKar', logo: '', hideName: false, mascotName: 'Chillar', showMascot: true, catch: 'Bas kar bhai.', accent: '' };

var BR = Object.assign({}, BR_DEF);

var LOGO_RE = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+\/=]+$/;

var HEX_RE = /^#[0-9a-fA-F]{6}$/;

function cleanBrand(b) {
  b = Object.assign({}, BR_DEF, b || {});
  b.name = String(b.name || '').trim().slice(0, 32) || BR_DEF.name;
  b.mascotName = String(b.mascotName || '').trim().slice(0, 20) || BR_DEF.mascotName;
  b.catch = String(b.catch || '').trim().slice(0, 40) || BR_DEF.catch;
  b.logo = LOGO_RE.test(String(b.logo || '')) ? b.logo : '';
  b.accent = HEX_RE.test(String(b.accent || '')) ? b.accent : '';
  b.hideName = !!b.hideName && !!b.logo;
  b.showMascot = b.showMascot !== false;
  return b;
}

function mixHex(a, b, t) {
  function ch(h, i) { return parseInt(h.substr(i, 2), 16); }
  return '#' + [1, 3, 5].map(function (i) { var v = Math.round(ch(a, i) * (1 - t) + ch(b, i) * t); return ('0' + v.toString(16)).slice(-2); }).join('');
}

function lum(hex) { var c = [1, 3, 5].map(function (i) { var v = parseInt(hex.substr(i, 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }

function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }

function brandCss(a) {
  if (!a) return '';
  var dark = '--accent:' + mixHex(a, '#FFFFFF', 0.4) + ';--accent-soft:' + mixHex(a, '#121214', 0.8) + ';';
  return ':root{--accent:' + a + ';--accent-soft:' + mixHex(a, '#FFFFFF', 0.87) + ';}' +
    '@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){' + dark + '}}:root[data-theme="dark"]{' + dark + '}';
}

function applyBrand(b) {
  b = b || BR;
  var st = document.getElementById('brand-css');
  if (!st) { st = document.createElement('style'); st.id = 'brand-css'; (document.head || document.documentElement).appendChild(st); }
  st.textContent = brandCss(HEX_RE.test(b.accent || '') ? b.accent : '');
  try { document.title = b.name; } catch (e) { }
  try { localStorage.setItem('bk_splash', JSON.stringify({ name: b.name, logo: b.logo || '', accent: b.accent || '', mascot: !!b.showMascot })); } catch (e) { }
  if (S.tab === 'insights' && S.p) setTimeout(drawCharts, 0);
}

/* Fade the launch screen once the first screen is drawn: at least 400 ms after load starts so it doesn't flash, and at most 1.2 s waiting for fonts. */
function hideSplash() {
  var el = document.getElementById('splash');
  if (!el) return;
  var fonts = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
  Promise.race([fonts, new Promise(function (r) { setTimeout(r, 1200); })]).then(function () {
    var since = (window.performance && performance.now) ? performance.now() : 400;
    setTimeout(function () {
      el.classList.add('out');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 450);
    }, Math.max(0, 400 - since));
  });
}

function stampText(c) { return c.replace(/[^\p{L}\p{N} ]/gu, '').trim().toUpperCase().slice(0, 14) || 'OVER'; }

/* Swaps the built-in name, mascot and catchphrase in rendered copy for the custom ones. */
function brandify(s, html) {
  var b = BR, e = html ? esc : function (x) { return x; };
  if (b.catch !== BR_DEF.catch) s = s.replace(/Bas kar bhai\./g, function () { return e(b.catch); }).replace(/BAS KAR/g, function () { return e(stampText(b.catch)); });
  if (b.name !== BR_DEF.name) s = s.replace(/BASKAR/g, function () { return e(b.name.toUpperCase()); }).replace(/BasKar/g, function () { return e(b.name); });
  var who = b.showMascot ? b.mascotName : b.name;
  if (who !== 'Chillar') s = s.replace(/Chillar/g, function () { return e(who); });
  return s;
}

function moodLine(m) { return BR.showMascot ? MOOD_LINE[m] : { chill: 'On track', nervous: 'Getting close', broke: 'Over budget' }[m]; }

function heroMark(mood, size) { return BR.showMascot ? mascot(mood, size) : ''; }

function wordmark(b) {
  var mark = b.logo ? '<img class="logo" src="' + esc(b.logo) + '" alt="' + esc(b.name) + (b.hideName ? '' : ' logo') + '">' : (b.showMascot ? mascot('chill', 28) : '');
  return mark + (b.logo && b.hideName ? '' : '<span>' + esc(b.name) + '</span>');
}

function headMark() { return BR.logo ? '<span class="head-mark"><img class="logo sm" src="' + esc(BR.logo) + '" alt="' + esc(BR.name) + '"></span>' : ''; }

function appIcon(mood) {
  if (BR.logo) return '<img src="' + esc(BR.logo) + '" alt="" style="width:26px;height:26px;object-fit:contain">';
  if (BR.showMascot) return mascot(mood, 28);
  return '<span style="font-weight:500">' + esc(BR.name.charAt(0).toUpperCase()) + '</span>';
}
