/* BasKar · js/core/storage.js
   Store: JSON → lz-string → chunked cookies, falling back to local storage or memory. Password hashing (PBKDF2).
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

var CHUNK = 3600, MAX_CHUNKS = 45;

/* Embedded (inside Claude): partitioned third-party cookies. Standalone (e.g. GitHub Pages): first-party cookies scoped to this app's folder. */
var IS_TOP = (function () { try { return window.top === window.self; } catch (e) { return false; } })();

var CK_PATH = IS_TOP ? (location.pathname.replace(/[^\/]*$/, '') || '/') : '/';

var COOKIE_OPTS = IS_TOP ? { expires: 400, path: CK_PATH, sameSite: 'Lax', secure: location.protocol === 'https:' } : { expires: 400, path: '/', sameSite: 'None', secure: true, partitioned: true };

var RM_OPTS = IS_TOP ? { path: CK_PATH, sameSite: 'Lax', secure: location.protocol === 'https:' } : { path: '/', sameSite: 'None', secure: true, partitioned: true };

var Store = {
  mode: 'memory', mem: {}, note: '',
  init: function () {
    var ok = false;
    try {
      if (window.Cookies && window.LZString) {
        Cookies.set('bk_probe', '1', COOKIE_OPTS);
        ok = Cookies.get('bk_probe') === '1';
        Cookies.remove('bk_probe', RM_OPTS);
      }
    } catch (e) { ok = false; }
    if (ok) { this.mode = 'cookie'; return; }
    try {
      localStorage.setItem('bk_probe', '1');
      var lok = localStorage.getItem('bk_probe') === '1';
      localStorage.removeItem('bk_probe');
      if (lok) { this.mode = 'local'; this.note = 'This browser blocks cookies inside this frame, so BasKar saves the same JSON to local storage instead.'; return; }
    } catch (e) { }
    this.mode = 'memory';
    this.note = 'This browser blocks cookies and local storage here. Your data lasts only until you close this tab.';
  },
  cookieCount: function (key) { try { return parseInt(Cookies.get(key + '_n') || '0', 10) || 0; } catch (e) { return 0; } },
  get: function (key) {
    try {
      if (this.mode === 'cookie') {
        var n = this.cookieCount(key);
        if (!n) return this.getLocal(key);
        var s = '';
        for (var i = 0; i < n; i++) { var part = Cookies.get(key + '_' + i); if (part == null) return null; s += part; }
        var json = LZString.decompressFromEncodedURIComponent(s);
        return json ? JSON.parse(json) : null;
      }
      if (this.mode === 'local') return this.getLocal(key);
      return this.mem[key] ? JSON.parse(this.mem[key]) : null;
    } catch (e) { return null; }
  },
  getLocal: function (key) { try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
  clearCookie: function (key) {
    var n = this.cookieCount(key);
    try { for (var i = 0; i < n; i++) Cookies.remove(key + '_' + i, RM_OPTS); Cookies.remove(key + '_n', RM_OPTS); } catch (e) { }
  },
  set: function (key, obj) {
    var json = JSON.stringify(obj);
    if (this.mode === 'cookie') {
      var comp = LZString.compressToEncodedURIComponent(json);
      var n = Math.max(1, Math.ceil(comp.length / CHUNK));
      if (n > MAX_CHUNKS) {
        try { localStorage.setItem(key, json); this.clearCookie(key); return { ok: true, overflow: true }; } catch (e) { return { ok: false }; }
      }
      this.clearCookie(key);
      try {
        for (var i = 0; i < n; i++) Cookies.set(key + '_' + i, comp.slice(i * CHUNK, (i + 1) * CHUNK), COOKIE_OPTS);
        Cookies.set(key + '_n', String(n), COOKIE_OPTS);
      } catch (e) { }
      if (Cookies.get(key + '_' + (n - 1)) == null || this.cookieCount(key) !== n) {
        this.clearCookie(key);
        try { localStorage.setItem(key, json); return { ok: true, overflow: true }; } catch (e) { return { ok: false }; }
      }
      try { localStorage.removeItem(key); } catch (e) { }
      return { ok: true };
    }
    if (this.mode === 'local') { try { localStorage.setItem(key, json); return { ok: true }; } catch (e) { return { ok: false }; } }
    this.mem[key] = json; return { ok: true };
  },
  remove: function (key) {
    if (this.mode === 'cookie') this.clearCookie(key);
    try { localStorage.removeItem(key); } catch (e) { }
    delete this.mem[key];
  },
  usage: function (key, obj) {
    var json = JSON.stringify(obj || {});
    var comp = window.LZString ? LZString.compressToEncodedURIComponent(json).length : 0;
    var chunks = this.mode === 'cookie' ? this.cookieCount(key) : 0;
    var where = this.mode === 'memory' ? 'memory' : (chunks ? 'cookie' : 'local');
    var total = 0; try { total = document.cookie.length; } catch (e) { }
    return { raw: json.length, comp: comp, chunks: chunks, where: where, cookieBytes: total };
  }
};

function hashPw(pw, salt) {
  try {
    var enc = new TextEncoder();
    return crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']).then(function (key) {
      return crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations: 120000, hash: 'SHA-256' }, key, 256);
    }).then(function (bits) {
      return 'pbkdf2$' + Array.prototype.map.call(new Uint8Array(bits), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    }).catch(function () { return fnv(pw, salt); });
  } catch (e) { return Promise.resolve(fnv(pw, salt)); }
}

function fnv(pw, salt) { var h = 2166136261, s = salt + ':' + pw; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return 'fnv$' + h.toString(16); }
