/* BasKar · js/features/intro.js
   The intro tour: five swipeable slides that explain the app to someone new. Shown once on a device that has no
   accounts yet (before the sign-up screen), and any time from Settings → How BasKar works. Skip is always there.
   On a new device, Get started opens sign-up; Skip goes to the sign-in screen.
   Slides use CSS scroll-snap, so swiping is the browser's own; the dots and Next button follow the scroll.
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

function introSeen() { try { return !!localStorage.getItem('bk_intro_done'); } catch (e) { return true; } }
function introDone() { try { localStorage.setItem('bk_intro_done', '1'); } catch (e) { } }

/* First visit with no accounts on this device. */
function introDue() { return !S.p && !S.index.profiles.length && !introSeen(); }

function introSlides() {
  var cur = S.p ? S.p.currency : guessCurrency(), m = function (v) { return money(v, { cur: cur, show: true }); };
  function txn(cat, name, amt) { var c = CATS[cat]; return '<div class="intro-row"><span class="tile" style="--c:' + c.color + '">' + ic(cat, 16) + '</span><span class="grow" data-noi18n>' + esc(name) + '</span><span class="amt">−' + esc(m(amt)) + '</span></div>'; }
  return [
    { art: '<div class="intro-art">' + mascot('chill', 92) + '<span class="num big">' + esc(m(85)) + '</span><span class="eyebrow">Safe to spend today</span></div>',
      title: 'One number a day', text: 'Tell BasKar your monthly pay and fixed costs. It works out what you can safely spend today, so you don’t have to.' },
    { art: '<div class="intro-art card tight">' + txn('food', 'Shawarma', 15) + txn('coffee', 'Karak', 3) + txn('groceries', 'Lulu', 59) + '</div>',
      title: 'Every spend counts it down', text: 'Log a spend in a tap, or type “15 shawarma lunch”. Spend more today and tomorrow’s number shrinks; spend less and it grows.' },
    { art: '<div class="intro-art intro-tiles"><span class="tile" style="--c:var(--accent)">' + ic('message', 22) + '</span><span class="tile" style="--c:var(--accent)">' + ic('camera', 22) + '</span><span class="tile" style="--c:var(--accent)">' + ic('upload', 22) + '</span></div>',
      title: 'Less typing', text: 'Paste your bank SMS, scan a paper receipt, or import a bank statement. You check everything before it’s added.' },
    { art: '<div class="intro-art row" style="justify-content:center;gap:18px">' + ring(0.62, 92) + '<span class="flame">' + ic('flame', 26) + '</span></div>',
      title: 'Keep what you don’t spend', text: 'Each night, move what’s left into a goal like a trip or an emergency fund. Stay under budget to build a streak.' },
    { art: '<div class="intro-art intro-tiles"><span class="tile" style="--c:var(--good)">' + ic('lock', 22) + '</span><span class="tile" style="--c:var(--good)">' + ic('face', 22) + '</span><span class="tile" style="--c:var(--good)">' + ic('phone', 22) + '</span></div>',
      title: 'Private by design', text: 'There’s no server and no bank login. Your data stays on this phone, locked with your password or Face ID.' }
  ];
}

function renderIntro() {
  var sl = introSlides(), i = S.intro.i || 0, last = i === sl.length - 1;
  return '<section class="intro-wrap" aria-roledescription="carousel" aria-label="How BasKar works">' +
    '<header class="row between"><span class="brand">' + esc(BR.name) + '</span><button type="button" class="btn-link" data-act="intro-skip">' + (S.p ? 'Close' : 'Skip') + '</button></header>' +
    '<div class="intro-track" id="intro-track">' + sl.map(function (s, k) {
      return '<article class="intro-slide" aria-roledescription="slide" aria-label="' + (k + 1) + ' / ' + sl.length + '">' + s.art + '<h2 class="h2">' + esc(s.title) + '</h2><p class="lede">' + esc(s.text) + '</p></article>';
    }).join('') + '</div>' +
    '<div class="intro-dots" aria-hidden="true">' + sl.map(function (s, k) { return '<i class="' + (k === i ? 'on' : '') + '"></i>'; }).join('') + '</div>' +
    '<button type="button" class="btn block" data-act="intro-next" id="intro-next">' + (last ? (S.p ? 'Done' : 'Get started') : 'Next') + '</button>' +
    '</section>';
}

/* Keep dots and the button in step with the swipe, without re-rendering (that would reset the scroll). */
function introSync() {
  var tr = $('#intro-track'); if (!tr || !S.intro) return;
  var w = tr.clientWidth || 1, i = Math.round(Math.abs(tr.scrollLeft) / w), n = tr.children.length;
  i = Math.max(0, Math.min(n - 1, i)); S.intro.i = i;
  [].forEach.call(document.querySelectorAll('.intro-dots i'), function (d, k) { d.className = k === i ? 'on' : ''; });
  var b = $('#intro-next'); if (b) b.textContent = T(i === n - 1 ? (S.p ? 'Done' : 'Get started') : 'Next');
}
document.addEventListener('scroll', function (e) { if (e.target && e.target.id === 'intro-track') introSync(); }, true);

function introClose() {
  introDone(); S.intro = null;
  if (!S.p) { S.auth = { mode: 'home' }; }
  renderAll(); toTop();
}

/* Actions (data-act="…") for this feature. */
Object.assign(ACT, {
  'intro-next': function () {
    var tr = $('#intro-track'); if (!tr) return;
    var n = tr.children.length, i = S.intro.i || 0;
    if (i >= n - 1) { if (S.p) introClose(); else { introDone(); S.intro = null; ACT.create(); } return; }  // Get started goes straight to sign-up
    tr.children[i + 1].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
  },
  'intro-skip': function () { introClose(); },
  intro: function () { S.sheet = null; S.intro = { i: 0 }; renderAll(); }
});
