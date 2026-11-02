/* BasKar · js/features/branding.js
   Settings → App name and branding.
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

function processLogo(file) {
  var err = $('#b-err');
  function fail(m) { if (err) { err.textContent = m; err.hidden = false; } }
  if (!file) return;
  if (!/^image\/(png|jpeg|webp|svg\+xml|gif)$/.test(file.type)) return fail('Use a PNG, JPG, WebP or SVG file.');
  if (file.size > 5 * 1024 * 1024) return fail('That file is over 5 MB. Use a smaller logo.');
  var fr = new FileReader();
  fr.onerror = function () { fail('Couldn’t read that file. Try another one.'); };
  fr.onload = function () {
    var img = new Image();
    img.onerror = function () { fail('Couldn’t read that image. Try a PNG or JPG.'); };
    img.onload = function () {
      try {
        var w = img.naturalWidth || 160, h = img.naturalHeight || 160, s = 160 / Math.max(w, h);
        if (file.type !== 'image/svg+xml') s = Math.min(1, s);
        var cw = Math.max(1, Math.round(w * s)), chh = Math.max(1, Math.round(h * s));
        var cv = document.createElement('canvas'); cv.width = cw; cv.height = chh;
        cv.getContext('2d').drawImage(img, 0, 0, cw, chh);
        var url = cv.toDataURL('image/png');
        try { var wp = cv.toDataURL('image/webp', 0.9); if (wp.indexOf('data:image/webp') === 0 && wp.length < url.length) url = wp; } catch (e) { }
        if (url.length > 60000) return fail('That logo is still too large after shrinking. Try a simpler image.');
        if (!S.brandDraft) return;
        S.brandDraft.logo = url;
        renderSheet();
      } catch (e) { fail('Couldn’t process that image. Try a PNG or JPG.'); }
    };
    img.src = fr.result;
  };
  fr.readAsDataURL(file);
}

function brandPreview(d) {
  return '<div class="row between"><div class="brand">' + wordmark(d) + '</div><span class="pillx gold">Accent</span></div>' +
    '<p class="hint">' + (d.showMascot ? esc(d.mascotName) + ' is sweating' : 'Getting close') + ' · “' + esc(d.catch) + '”</p>';
}

function sheetBrand() {
  var d = S.brandDraft, low = d.accent && contrast(d.accent, '#FFFFFF') < 4.5;
  return sheetHead('Branding') +
    '<p class="hint">Rename the app, add your logo and pick an accent colour. It applies to every account on this device.</p>' +
    '<section class="card" id="b-preview" aria-live="polite">' + brandPreview(d) + '</section>' +
    '<form id="brand-form" class="stack" novalidate>' +
    '<div class="field"><label for="b-name">Product name</label><input id="b-name" class="input" data-b="name" maxlength="32" value="' + esc(d.name) + '" required></div>' +
    '<div class="field"><span class="label">Logo</span><div class="logo-box">' + (d.logo ? '<img src="' + esc(d.logo) + '" alt="Logo preview">' : '<span class="hint">No logo yet</span>') + '</div>' +
    '<div class="row wrap"><input id="b-logo" class="sr-only" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml"><label for="b-logo" class="btn ghost sm">' + (d.logo ? 'Replace logo' : 'Upload logo') + '</label>' + (d.logo ? '<button type="button" class="btn quiet sm" data-act="brand-logo-remove">Remove</button>' : '') + '</div>' +
    '<span class="hint">PNG, JPG, WebP or SVG. It’s shrunk to 160px so it fits in cookie storage.</span></div>' +
    (d.logo ? '<div class="setrow"><div class="grow"><span class="label" id="b-hn-lbl">Logo already shows the name</span><span class="hint">Hides the text next to the logo.</span></div><button type="button" class="switch" role="switch" aria-labelledby="b-hn-lbl" aria-checked="' + !!d.hideName + '" data-act="brand-hidename"><span></span></button></div>' : '') +
    '<div class="field"><label for="b-accent">Accent colour</label><div class="color-row"><input id="b-accent" type="color" data-b="accent" value="' + esc(d.accent || '#876628') + '"><button type="button" class="btn quiet sm" data-act="brand-accent-reset">Use default</button></div><span class="hint" id="b-contrast">' + (low ? 'This colour is light for text on white. A darker shade will read better.' : 'Used for savings, streaks and today’s bar. Dark mode gets a lighter version automatically.') + '</span></div>' +
    '<div class="setrow"><div class="grow"><span class="label" id="b-m-lbl">Show mascot</span><span class="hint">Off replaces the coin and its jokes with plain status words.</span></div><button type="button" class="switch" role="switch" aria-labelledby="b-m-lbl" aria-checked="' + d.showMascot + '" data-act="brand-mascot"><span></span></button></div>' +
    (d.showMascot ? '<div class="field"><label for="b-mname">Mascot name</label><input id="b-mname" class="input" data-b="mascotName" maxlength="20" value="' + esc(d.mascotName) + '"></div>' : '') +
    '<div class="field"><label for="b-catch">Over-budget catchphrase</label><input id="b-catch" class="input" data-b="catch" maxlength="40" value="' + esc(d.catch) + '"><span class="hint">Shown when someone goes over their daily budget, and stamped on the nightly receipt.</span></div>' +
    '<p class="error" id="b-err" role="alert" hidden></p>' +
    '<button type="submit" class="btn block">Save branding</button>' +
    '<button type="button" class="btn ghost block danger-text" data-act="brand-reset">' + (S.brandConfirm ? 'Tap again to restore the original branding' : 'Restore the original branding') + '</button>' +
    '</form>';
}

function saveBrand() {
  var d = S.brandDraft, err = $('#b-err');
  if (!String(d.name || '').trim()) { err.textContent = 'Give the app a name.'; err.hidden = false; $('#b-name').focus(); return; }
  BR = cleanBrand(d);
  var r = Store.set('bk_brand', BR);
  var backTo = S.sheet && S.sheet.from === 'settings' && S.p;
  applyBrand(); S.sheet = backTo ? { type: 'settings' } : null; S.brandDraft = null; renderAll();
  toast(r.ok ? 'Branding saved' : 'Branding applied, not saved', r.ok ? 'It now shows on this device, for every account.' : 'Your browser blocked storage, so this resets when you close the tab.');
}

/* Actions (data-act="…") for this feature. */
Object.assign(ACT, {
  brand: function () { S.brandDraft = Object.assign({}, BR); S.brandConfirm = false; openSub({ type: 'brand' }); },
  'brand-logo-remove': function () { S.brandDraft.logo = ''; S.brandDraft.hideName = false; renderSheet(); },
  'brand-hidename': function (el) { S.brandDraft.hideName = !S.brandDraft.hideName; el.setAttribute('aria-checked', String(S.brandDraft.hideName)); var pv = $('#b-preview'); if (pv) pv.innerHTML = brandPreview(S.brandDraft); },
  'brand-mascot': function () { S.brandDraft.showMascot = !S.brandDraft.showMascot; renderSheet(); },
  'brand-accent-reset': function () { S.brandDraft.accent = ''; applyBrand(S.brandDraft); renderSheet(); },
  'brand-reset': function () {
    if (!S.brandConfirm) { S.brandConfirm = true; renderSheet(); return; }
    BR = Object.assign({}, BR_DEF); Store.remove('bk_brand'); S.brandConfirm = false; S.brandDraft = null; S.sheet = null; applyBrand(); renderAll();
    toast('Original branding restored');
  }
});
