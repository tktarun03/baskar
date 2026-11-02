/* BasKar · js/core/passkey.js
   Face ID / fingerprint unlock. A passkey on this device, protected by Face ID, produces a secret (WebAuthn "PRF")
   that encrypts a copy of the account's data key. Unlocking with Face ID recovers the data key, so the face check
   really opens the data; it is not a screen in front of it. The password always keeps working.
   Needs Safari 18+ on iOS 18.4+ (or a recent Chrome/Edge), on the website only (not inside Claude).
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

var Passkey = { ok: false, checked: false };

function rand(n) { return crypto.getRandomValues(new Uint8Array(n)); }

/* Works out once whether this browser can do it; Settings shows the switch only if so. */
function passkeyCheck() {
  var secure = location.protocol === 'https:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  if (!IS_TOP || !secure || !Vault.ok || !window.PublicKeyCredential || !PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
    Passkey.checked = true; return Promise.resolve(false);
  }
  return PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    .then(function (ok) { Passkey.ok = !!ok; Passkey.checked = true; return Passkey.ok; }, function () { Passkey.checked = true; return false; });
}
function isApple() { return /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent); }
function bioName() { return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ? 'Face ID' : isApple() ? 'Touch ID' : 'fingerprint or face'; }
function bioTitle() { var n = bioName(); return n.charAt(0).toUpperCase() + n.slice(1); }

/* Stored per device: { cred, salt, iv, w } — w is the data key, encrypted with a key only the passkey can produce. */
function bioGet(pid) { try { var r = JSON.parse(localStorage.getItem('bk_bio_' + pid) || 'null'); return r && r.cred && r.w ? r : null; } catch (e) { return null; } }
function bioSet(pid, rec) { try { localStorage.setItem('bk_bio_' + pid, JSON.stringify(rec)); return true; } catch (e) { return false; } }
function bioClear(pid) { try { localStorage.removeItem('bk_bio_' + pid); } catch (e) { } }

function prfWrapKey(prfOut) {
  return crypto.subtle.importKey('raw', new Uint8Array(prfOut), 'HKDF', false, ['deriveKey']).then(function (k) {
    return crypto.subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: new TextEncoder().encode('BasKar'), info: new TextEncoder().encode('unlock v1') }, k, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  });
}
function prfFrom(cred) {
  var ext = cred && cred.getClientExtensionResults ? cred.getClientExtensionResults() : {};
  return ext && ext.prf && ext.prf.results && ext.prf.results.first ? ext.prf.results.first : null;
}
/* Ask the passkey for its secret (shows Face ID). */
function prfEval(credId, salt) {
  return navigator.credentials.get({ publicKey: {
    challenge: rand(32), allowCredentials: [{ type: 'public-key', id: credId }], userVerification: 'required', timeout: 60000,
    extensions: { prf: { eval: { first: salt } } }
  } }).then(prfFrom);
}
function bioSeal(pid, credId, salt, prfOut, raw) {
  var iv = rand(12);
  return prfWrapKey(prfOut).then(function (k) { return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, k, unb64(raw)); }).then(function (w) {
    return bioSet(pid, { cred: b64(new Uint8Array(credId)), salt: b64(salt), iv: b64(iv), w: b64(new Uint8Array(w)) }) ? 'ok' : 'error';
  });
}
function bioError(e) { return e && (e.name === 'NotAllowedError' || e.name === 'AbortError') ? 'cancelled' : 'error'; }

/* Turn it on: create the passkey, get its secret, seal the data key. Resolves 'ok', 'unsupported', 'cancelled',
   'error' or 'finish' (the passkey exists but Safari needs one more tap to hand over its secret). */
function passkeyEnable(pid, m, raw) {
  var salt = rand(32);
  return navigator.credentials.create({ publicKey: {
    rp: { name: BR.name },
    user: { id: rand(16), name: m.email || m.name, displayName: m.name },
    challenge: rand(32),
    pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
    authenticatorSelection: { authenticatorAttachment: 'platform', residentKey: 'preferred', userVerification: 'required' },
    timeout: 60000,
    extensions: { prf: { eval: { first: salt } } }
  } }).then(function (cred) {
    var ext = cred.getClientExtensionResults ? cred.getClientExtensionResults() : {};
    if (!ext.prf || ext.prf.enabled === false) return 'unsupported';
    var out = prfFrom(cred);
    if (out) return bioSeal(pid, cred.rawId, salt, out, raw);
    Passkey.pending = { pid: pid, cred: cred.rawId, salt: salt, raw: raw };
    return 'finish';
  }, bioError);
}
function passkeyFinish() {
  var pd = Passkey.pending; if (!pd) return Promise.resolve('error');
  return prfEval(pd.cred, pd.salt).then(function (out) {
    Passkey.pending = null;
    return out ? bioSeal(pd.pid, pd.cred, pd.salt, out, pd.raw) : 'unsupported';
  }, bioError);
}

/* Unlock: Face ID → passkey secret → data key. Resolves { key, raw } or a reason string. */
function passkeyUnlock(pid) {
  var rec = bioGet(pid); if (!rec) return Promise.resolve('error');
  return prfEval(unb64(rec.cred), unb64(rec.salt)).then(function (out) {
    if (!out) return 'unsupported';
    return prfWrapKey(out).then(function (k) { return crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(rec.iv) }, k, unb64(rec.w)); })
      .then(function (raw) { return vaultImport(b64(new Uint8Array(raw))); })
      .then(function (kr) { return kr || 'error'; }, function () { return 'error'; });
  }, bioError);
}
