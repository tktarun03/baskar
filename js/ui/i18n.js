/* BasKar · js/ui/i18n.js
   Languages: English, Arabic (right to left) and Tamil. Translations are applied after render; rows are in js/i18n-rows.js.
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

/*
   The UI is written in English. After each render, text nodes and a few attributes are looked up in
   window.BASKAR_I18N[lang], keyed by the English text with every number or amount replaced by {0}, {1}…
   so "Day 2 of 30" and "Day 9 of 31" share one entry. Text with no entry stays in English. */
var LANGS = { en: { name: 'English', dir: 'ltr', locale: undefined }, ar: { name: 'العربية', dir: 'rtl', locale: 'ar-u-nu-latn' }, ta: { name: 'தமிழ்', dir: 'ltr', locale: 'ta-IN' } };

var LANG = 'en';

function LOC() { return (LANGS[LANG] || LANGS.en).locale; }

function dots(parts) { return parts.filter(function (x) { return x !== '' && x != null; }).map(function (x) { return '<span>' + esc(x) + '</span>'; }).join(' · '); }

/* An amount: an optional sign, then either the Arabic form (right-to-left mark, number, currency after it: ‏12 ر.ق.‏, ‏12 US$)
   or a number with an optional currency before it (QAR 12, ₹12, 3%, 1.5K). */
var NUM_RE = /(?:[−\-+→≈]\s?)?(?:‏\d[\d,]*(?:\.\d+)?(?:[    ](?:[ء-ي]+\.)+|[    ]?(?:US\$|[A-Z]{3}|[₹$€£]))?‏?|(?:(?:[A-Z]{3}|[₹$€£])[    ]?)?(?:\d[\d,]*(?:\.\d+)?[KMB]?%?|••••))/g;

function normKey(s) { var vals = []; var key = s.replace(NUM_RE, function (m) { vals.push(m); return '{' + (vals.length - 1) + '}'; }); return { key: key, vals: vals }; }

function dict() { var d = window.BASKAR_I18N || {}; return d[LANG] || null; }

var WILD = {};

function wildTr(D, key) {
  var list = WILD[LANG];
  if (!list) {
    list = WILD[LANG] = [];
    Object.keys(D).forEach(function (k) {
      if (k.indexOf('{*}') < 0) return;
      var re = new RegExp('^' + k.split('{*}').map(function (x) { return x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('(.+?)') + '$');
      list.push([re, D[k]]);
    });
  }
  for (var i = 0; i < list.length; i++) {
    var m = key.match(list[i][0]);
    if (!m) continue;
    var j = 1;
    return list[i][1].replace(/\{\*\}/g, function () { var c = m[j++] || ''; var d = D[c]; return d != null ? d : (LANG === 'ar' ? '\u2068' + c + '\u2069' : c); });
  }
  return null;
}

function trText(s) {
  if (LANG === 'en' || !s) return s;
  var D = dict(); if (!D) return s;
  var lead = s.match(/^\s*/)[0], trail = s.match(/\s*$/)[0], core = s.trim();
  if (!core || !/[A-Za-z]/.test(core)) return s;
  var who = BR.showMascot ? BR.mascotName : BR.name, k0 = core;
  if (BR.name !== 'BasKar') k0 = k0.split(BR.name).join('BasKar');
  if (who !== 'Chillar') k0 = k0.split(who).join('Chillar');
  if (BR.catch !== BR_DEF.catch) k0 = k0.split(BR.catch).join(BR_DEF.catch);
  var nk = normKey(k0), t = D[nk.key];
  if (t == null) t = wildTr(D, nk.key);
  if (t == null) return s;
  /* Arabic: isolate each value, left to right unless it carries an Arabic currency sign (then it keeps its own order). */
  function iso(v) { return LANG !== 'ar' ? v : (/[\u0600-\u06FF]/.test(v) ? '\u2067' : '\u2066') + v + '\u2069'; }
  return lead + brandify(t.replace(/\{(\d+)\}/g, function (_, i) { return nk.vals[+i] != null ? iso(nk.vals[+i]) : ''; })) + trail;
}

var I18N_ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];

function skipEl(el) { return !el || el.closest('script,style,textarea,pre,[data-noi18n]'); }

function trNode(n) { if (skipEl(n.parentElement)) return; var v = n.nodeValue, t = trText(v); if (t !== v) n.nodeValue = t; }

function trAttrs(el) { for (var i = 0; i < I18N_ATTRS.length; i++) { var a = el.getAttribute(I18N_ATTRS[i]); if (a) { var t = trText(a); if (t !== a) el.setAttribute(I18N_ATTRS[i], t); } } }

function translateTree(root) {
  if (LANG === 'en' || !root) return;
  if (root.nodeType === 3) { trNode(root); return; }
  if (root.nodeType !== 1 || skipEl(root)) return;
  trAttrs(root);
  var w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, { acceptNode: function (n) { if (n.nodeType === 1 && (/^(SCRIPT|STYLE|TEXTAREA|PRE)$/.test(n.tagName) || n.hasAttribute('data-noi18n'))) return NodeFilter.FILTER_REJECT; return NodeFilter.FILTER_ACCEPT; } }), n;
  while ((n = w.nextNode())) { if (n.nodeType === 3) { var v = n.nodeValue, t = trText(v); if (t !== v) n.nodeValue = t; } else trAttrs(n); }
}

try {
  new MutationObserver(function (muts) {
    if (LANG === 'en') return;
    muts.forEach(function (m) {
      if (m.type === 'childList') Array.prototype.forEach.call(m.addedNodes, translateTree);
      else if (m.type === 'characterData') trNode(m.target);
      else if (m.type === 'attributes') trAttrs(m.target);
    });
  }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: I18N_ATTRS });
} catch (e) { }

function applyLang() {
  var L = LANGS[LANG] || LANGS.en, root = document.documentElement;
  root.setAttribute('lang', LANG); root.setAttribute('dir', L.dir);
}

function detectLang() { try { var n = (navigator.language || '').toLowerCase(); if (n.indexOf('ar') === 0) return 'ar'; if (n.indexOf('ta') === 0) return 'ta'; } catch (e) { } return 'en'; }

function langSeg() {
  return '<div class="seg three" role="group" aria-label="Language" data-noi18n>' + ['en', 'ar', 'ta'].map(function (k) { return '<button type="button" data-act="lang" data-k="' + k + '" lang="' + k + '" aria-pressed="' + (LANG === k) + '">' + LANGS[k].name + '</button>'; }).join('') + '</div>';
}
