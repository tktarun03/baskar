/* BasKar · js/features/scan-receipt.js
   Scan a paper bill: take or choose one or more photos (top to bottom for a long bill), read them with OCR on
   this phone, check the store, date, total and items, then add it as a spend. The photos are never saved:
   they are read in memory and dropped as soon as the text is out. Only the details are kept.
   OCR is Tesseract.js (open source), loaded from jsDelivr the first time someone scans (about 7 MB, then cached).
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

var OCR_SRC = {
  lib: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js',
  worker: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js',
  core: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1',
  lang: 'https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng@1.0.0/4.0.0_best_int'
};
var RC_MAX_PHOTOS = 6, RC_MAX_SIDE = 2000;

function loadOcr() {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  return new Promise(function (res, rej) {
    var s = document.createElement('script'); s.src = OCR_SRC.lib; s.async = true; s.crossOrigin = 'anonymous';
    s.onload = function () { window.Tesseract ? res(window.Tesseract) : rej(new Error('ocr')); };
    s.onerror = function () { rej(new Error('ocr')); };
    document.head.appendChild(s);
  });
}

/* Photo → grey canvas no bigger than 2000 px, which reads faster and better. The file itself isn't kept. */
function photoCanvas(file) {
  return new Promise(function (res, rej) {
    var url = URL.createObjectURL(file), img = new Image();
    img.onload = function () {
      var s = Math.min(1, RC_MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
      var cv = document.createElement('canvas'); cv.width = Math.round(img.naturalWidth * s); cv.height = Math.round(img.naturalHeight * s);
      var x = cv.getContext('2d'); x.filter = 'grayscale(1) contrast(1.25)'; x.drawImage(img, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(url); res(cv);
    };
    img.onerror = function () { URL.revokeObjectURL(url); rej(new Error('img')); };
    img.src = url;
  });
}

function readPhotos() {
  var sh = S.sheet, files = sh.photos.slice(), texts = [];
  sh.step = 'reading'; sh.done = 0; sh.pct = 0; sh.err = ''; renderSheet();
  function prog(m) {
    if (!S.sheet || S.sheet.type !== 'receipt') return;
    if (m && m.status === 'recognizing text') S.sheet.pct = Math.round((m.progress || 0) * 100);
    else if (m && /loading|initializ/.test(m.status || '')) S.sheet.loading = true;
    var el = $('#rc-prog'); if (el) el.textContent = rcProgText(S.sheet);
  }
  var worker = null;
  loadOcr().then(function (T) {
    return T.createWorker('eng', 1, { workerPath: OCR_SRC.worker, corePath: OCR_SRC.core, langPath: OCR_SRC.lang, logger: prog });
  }).then(function (w) {
    worker = w; sh.loading = false;
    return files.reduce(function (chain, f, i) {
      return chain.then(function () {
        sh.done = i; sh.pct = 0; var el = $('#rc-prog'); if (el) el.textContent = rcProgText(sh);
        return photoCanvas(f).then(function (cv) { return w.recognize(cv).then(function (r) { cv.width = cv.height = 0; texts.push(r.data.text || ''); }); });
      });
    }, Promise.resolve());
  }).then(function () {
    if (worker) worker.terminate();
    sh.photos = []; files.length = 0;                     // drop the photos: only the text goes on
    var r = parseReceipt(texts.join('\n'));
    sh.r = r; sh.items = r.items.map(function (it) { return { name: it.name, amt: it.amt, on: true }; });
    sh.form = { merchant: r.merchant, amt: r.amt ? String(r.amt) : '', ts: r.ts || Date.now(), cat: rcCat(r.merchant), wallet: (S.p.wallets[0] || {}).id || '', note: '', fx: r.cur && S.p.fx[r.cur] ? String(S.p.fx[r.cur]) : '' };
    sh.step = 'review'; renderSheet();
  }).catch(function () {
    if (worker) try { worker.terminate(); } catch (e) { }
    sh.photos = []; sh.step = 'pick';
    sh.err = navigator.onLine === false ? 'The text reader needs the internet the first time. Connect and try again.' : 'Couldn’t read those photos. Try again with the whole bill in view and good light.';
    renderSheet();
  });
}
function rcCat(name) { var c = name ? guessCat(name, catMemory()) : 'groceries'; return c === 'other' ? 'groceries' : c; }
function rcProgText(sh) {
  if (sh.loading) return T('Getting the text reader ready…');
  return T('Reading photo ' + (sh.done + 1) + ' of ' + sh.total + '…') + (sh.pct ? ' ' + sh.pct + '%' : '');
}

function sheetReceipt(sh) {
  var h = sheetHead('Scan a receipt');
  if (sh.step === 'reading') {
    return h + '<section class="card stack" style="align-items:center;text-align:center"><span class="tile" style="--c:var(--accent)">' + ic('camera', 20) + '</span>' +
      '<p class="h3" id="rc-prog">' + esc(rcProgText(sh)) + '</p><p class="hint">Reading happens on this phone. Nothing is uploaded.</p></section>';
  }
  if (sh.step === 'review') return h + receiptReview(sh);
  var n = sh.photos.length;
  return h + '<p class="hint">Take a photo of the bill. For a long bill, add more photos from top to bottom.</p>' +
    '<div class="stack-xs"><input type="file" id="rc-cam" accept="image/*" capture="environment" class="sr-only"><label for="rc-cam" class="btn block">' + ic('camera', 18) + ' <span>Take photo</span></label>' +
    '<input type="file" id="rc-pick" accept="image/*" multiple class="sr-only"><label for="rc-pick" class="btn quiet block">' + ic('upload', 18) + ' <span>Choose from your photos</span></label></div>' +
    (n ? '<section class="card tight">' + sh.photos.map(function (f, i) { return '<div class="wk-row"><span class="tile" style="--c:var(--ink-2)">' + ic('camera', 16) + '</span><div class="grow"><strong style="font-size:15px"><span>Photo</span> ' + (i + 1) + '</strong><span class="hint">' + esc(kb(f.size)) + '</span></div><button type="button" class="icon-btn" data-act="rc-del" data-i="' + i + '" aria-label="Remove photo ' + (i + 1) + '">' + ic('x', 16) + '</button></div>'; }).join('') + '</section>' : '') +
    (sh.err ? '<p class="error" role="alert">' + esc(sh.err) + '</p>' : '') +
    '<button type="button" class="btn block" data-act="rc-read"' + (n ? '' : ' disabled') + '>' + (n > 1 ? 'Read ' + n + ' photos' : 'Read receipt') + '</button>' +
    '<p class="fine">Photos stay on this phone and are discarded as soon as they’re read. Only the store, date, total and items are saved. The first scan downloads the text reader (about 7 MB); after that it works offline.</p>';
}

function receiptReview(sh) {
  var f = sh.form, r = sh.r, on = sh.items.filter(function (x) { return x.on; }), sum = Math.round(on.reduce(function (s, x) { return s + x.amt; }, 0) * 100) / 100;
  var foreign = rcForeign(sh), billMoney = function (v) { return foreign ? foreign + ' ' + Number(v).toFixed(2) : money(v, { exact: true }); };
  var warn = [];
  if (!r.found.total) warn.push('Couldn’t find the total on the bill. Check the amount.');
  if (foreign) warn.push('This bill is in ' + foreign + ' and your account uses ' + S.p.currency + '. Enter the exchange rate below.');
  if (sum && num(f.amt) && Math.abs(sum - num(f.amt)) > 0.05 * num(f.amt) && on.length) warn.push('The items add up to ' + billMoney(sum) + ', not the total. Some lines may be missing or misread.');
  return (warn.length ? '<div class="notice stack-xs">' + warn.map(function (w) { return '<span>' + esc(w) + '</span>'; }).join('') + '</div>' : '') +
    '<form id="receipt-form" class="stack" novalidate>' +
    '<div class="field"><label for="rc-amt">Total</label><div class="money-input"><span class="cur">' + esc(foreign || curSymbol(S.p.currency)) + '</span><input id="rc-amt" type="number" inputmode="decimal" step="any" min="0" value="' + esc(f.amt) + '" placeholder="0" required></div></div>' +
    (foreign ? '<div class="fxrow"><span class="iso">1 ' + esc(foreign) + ' =</span><input id="rc-fx" class="input" type="number" inputmode="decimal" step="any" min="0" value="' + esc(f.fx || '') + '" aria-label="Exchange rate"><span class="iso">' + esc(S.p.currency) + '</span></div><p class="hint">Saved for next time. Check today’s rate with your bank.</p>' : '') +
    '<div class="field"><label for="rc-merchant">Store</label><input id="rc-merchant" class="input" value="' + esc(f.merchant) + '" placeholder="e.g. Lulu Hypermarket"></div>' +
    '<div class="grid2"><div class="field"><label for="rc-cat">Category</label><select id="rc-cat" class="input">' + catOptions(f.cat) + '</select></div>' +
    '<div class="field"><label for="rc-wallet">Wallet</label><select id="rc-wallet" class="input">' + S.p.wallets.map(function (w) { return '<option value="' + esc(w.id) + '"' + (w.id === f.wallet ? ' selected' : '') + '>' + esc(w.name) + '</option>'; }).join('') + '</select></div></div>' +
    '<div class="field"><label for="rc-when">When</label><input id="rc-when" class="input" type="datetime-local" value="' + esc(toLocalInput(f.ts)) + '"></div>' +
    '<div class="field"><label for="rc-note">Remarks <span class="muted">(optional)</span></label><input id="rc-note" class="input" value="' + esc(f.note) + '" placeholder="e.g. weekly groceries"></div>' +
    (sh.items.length ? '<details class="card" open><summary><span>Items on the bill</span> · ' + on.length + '/' + sh.items.length + (sum ? ' · ' + esc(billMoney(sum)) : '') + '</summary>' +
      sh.items.map(function (x, i) { return '<label class="srow" style="grid-template-columns:22px minmax(0,1fr) auto"><input type="checkbox" data-rcitem="' + i + '"' + (x.on ? ' checked' : '') + '><span data-noi18n>' + esc(x.name) + '</span><span class="amt">' + esc(billMoney(x.amt)) + '</span></label>'; }).join('') +
      '<p class="hint">Untick lines that aren’t items. Ticked items are saved with the spend.</p></details>' : '') +
    '<button type="submit" class="btn block">Add spend</button></form>' +
    '<button type="button" class="btn ghost block" data-act="rc-again">Scan again</button>';
}

function rcForeign(sh) { var c = sh.r && sh.r.cur; return c && c !== S.p.currency ? c : ''; }
function saveReceipt() {
  var sh = S.sheet, amt = num($('#rc-amt').value), foreign = rcForeign(sh), rate = 1, orig = null;
  if (!(amt > 0)) { toast('Enter an amount above zero.', ''); return; }
  if (foreign) {
    rate = num(($('#rc-fx') || {}).value);
    if (!(rate > 0)) { toast('Enter the exchange rate', '1 ' + foreign + ' in ' + S.p.currency + '.'); return; }
    S.p.fx[foreign] = rate; orig = { cur: foreign, amt: amt }; amt = Math.round(amt * rate * 100) / 100;
  }
  var when = $('#rc-when').value, ts = when ? new Date(when).getTime() : Date.now();
  var item = applyRule({ ts: isFinite(ts) ? ts : Date.now(), kind: 'expense', amt: amt, cat: $('#rc-cat').value, merchant: ($('#rc-merchant').value || '').trim().slice(0, 40), wallet: $('#rc-wallet').value, note: $('#rc-note').value, items: sh.items.filter(function (x) { return x.on; }).map(function (x) { return { name: x.name, amt: Math.round(x.amt * rate * 100) / 100 }; }) });
  if (orig) item.orig = orig;
  var before = calc(S.p), capsBefore = capStatus(S.p, before);
  var res = addItems([item], 'receipt');
  S.sheet = null; renderAll();
  var rec = S.p.txns.filter(function (t) { return t.id === res.ids[0]; })[0];
  if (rec) notifySpend(rec, before, capsBefore, '');
}

/* Actions (data-act="…") for this feature. */
Object.assign(ACT, {
  'open-receipt': function () { S.sheet = { type: 'receipt', step: 'pick', photos: [], err: '' }; renderSheet(); },
  'rc-del': function (el) { S.sheet.photos.splice(+el.dataset.i, 1); renderSheet(); },
  'rc-read': function () { var sh = S.sheet; if (!sh.photos.length) return; sh.total = sh.photos.length; readPhotos(); },
  'rc-again': function () { S.sheet = { type: 'receipt', step: 'pick', photos: [], err: '' }; renderSheet(); }
});

/* Photo inputs and item ticks (input/change events). */
document.addEventListener('change', function (e) {
  var el = e.target; if (!S.sheet || S.sheet.type !== 'receipt') return;
  if (el.id === 'rc-cam' || el.id === 'rc-pick') {
    var add = [].slice.call(el.files || []).filter(function (f) { return /^image\//.test(f.type) || /\.(heic|heif|jpe?g|png|webp)$/i.test(f.name); });
    S.sheet.photos = S.sheet.photos.concat(add).slice(0, RC_MAX_PHOTOS); S.sheet.err = '';
    if (add.length && S.sheet.photos.length >= RC_MAX_PHOTOS) S.sheet.err = 'Up to ' + RC_MAX_PHOTOS + ' photos per bill.';
    el.value = ''; renderSheet(); return;
  }
  if (el.hasAttribute('data-rcitem')) {
    var sh = S.sheet, f = sh.form;
    f.amt = $('#rc-amt').value; f.merchant = $('#rc-merchant').value; if ($('#rc-fx')) f.fx = $('#rc-fx').value; f.cat = $('#rc-cat').value; f.wallet = $('#rc-wallet').value; f.note = $('#rc-note').value;
    var w = $('#rc-when').value; if (w) f.ts = new Date(w).getTime();
    sh.items[+el.dataset.rcitem].on = el.checked; renderSheet();
  }
});
