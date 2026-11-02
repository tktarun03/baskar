/* BasKar · js/core/vault.js
   Encryption at rest. Each account's data is sealed with AES-GCM using a key made from its password
   (PBKDF2-SHA-256, 150,000 rounds, its own salt). Other pages on the same web address see only ciphertext.
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

var Vault = {
  ok: !!(window.crypto && crypto.subtle && window.TextEncoder && window.TextDecoder),
  key: null,          // CryptoKey for the open account
  raw: '',            // the same key as base64, kept so the tab can reopen after a refresh
  queue: Promise.resolve(),
  ROUNDS: 150000
};

function b64(bytes) {
  var s = '', CH = 0x8000;
  for (var i = 0; i < bytes.length; i += CH) s += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
  return btoa(s);
}
function unb64(str) { var s = atob(str), out = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) out[i] = s.charCodeAt(i); return out; }

/* The login check hashes PBKDF2(password, salt). The key uses a different salt ("enc:" + salt) and round count,
   so the stored hash reveals nothing about the key. */
function vaultDerive(pw, salt) {
  if (!Vault.ok) return Promise.resolve(null);
  var enc = new TextEncoder();
  return crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits'])
    .then(function (k) { return crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode('enc:' + salt), iterations: Vault.ROUNDS, hash: 'SHA-256' }, k, 256); })
    .then(function (bits) { return vaultImport(b64(new Uint8Array(bits))); })
    .catch(function () { return null; });
}
function vaultImport(raw) {
  if (!Vault.ok || !raw) return Promise.resolve(null);
  return crypto.subtle.importKey('raw', unb64(raw), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
    .then(function (key) { return { key: key, raw: raw }; })
    .catch(function () { return null; });
}

/* obj → JSON → lz-string bytes → AES-GCM → { enc: 1, iv, d } */
function vaultSeal(obj, key) {
  var json = typeof obj === 'string' ? obj : JSON.stringify(obj);
  var bytes = window.LZString ? LZString.compressToUint8Array(json) : new TextEncoder().encode(json);
  var iv = crypto.getRandomValues(new Uint8Array(12));
  return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, bytes).then(function (ct) {
    return { enc: 1, z: window.LZString ? 1 : 0, iv: b64(iv), d: b64(new Uint8Array(ct)) };
  });
}
function vaultOpen(rec, key) {
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(rec.iv) }, key, unb64(rec.d)).then(function (buf) {
    var bytes = new Uint8Array(buf);
    var json = rec.z ? LZString.decompressFromUint8Array(bytes) : new TextDecoder().decode(bytes);
    return JSON.parse(json);
  });
}
function isSealed(rec) { return !!(rec && rec.enc === 1 && rec.iv && rec.d); }

/* Remembered keys: this tab only (sessionStorage), or this device if the person chose "Stay unlocked". */
function vaultRemember(pid, raw, device) {
  try { sessionStorage.setItem('bk_k_' + pid, raw); } catch (e) { }
  try { if (device) localStorage.setItem('bk_k_' + pid, raw); } catch (e) { }
}
function vaultRecall(pid) {
  var raw = '';
  try { raw = sessionStorage.getItem('bk_k_' + pid) || ''; } catch (e) { }
  if (!raw) try { raw = localStorage.getItem('bk_k_' + pid) || ''; } catch (e) { }
  return raw;
}
function vaultForget(pid, deviceToo) {
  try { sessionStorage.removeItem('bk_k_' + pid); } catch (e) { }
  try { if (deviceToo) localStorage.removeItem('bk_k_' + pid); } catch (e) { }
}
function vaultStaysUnlocked(pid) { try { return !!localStorage.getItem('bk_k_' + pid); } catch (e) { return false; } }
