/* BasKar · js/ui/icons.js
   Icons (inline SVG paths) and the mascot.
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

var P = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
  chart: '<path d="M5 20V11M12 20V4M19 20v-6"/>',
  wallet: '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3"/><rect x="4" y="8" width="16" height="11" rx="2.5"/><path d="M16 13.5h.01"/>',
  sliders: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  chev: '<path d="M9 6l6 6-6 6"/>',
  back: '<path d="M15 6l-6 6 6 6"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  face: '<path d="M4 8.5V6.5A2.5 2.5 0 0 1 6.5 4h2M15.5 4h2A2.5 2.5 0 0 1 20 6.5v2M20 15.5v2a2.5 2.5 0 0 1-2.5 2.5h-2M8.5 20h-2A2.5 2.5 0 0 1 4 17.5v-2M9 9.5v1.2M15 9.5v1.2M12 9.5v3.8h-1M9.5 16q2.5 1.8 5 0"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  logout: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10"/>',
  trash: '<path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  bank: '<path d="M3 10h18M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18M12 3l9 5H3z"/>',
  card: '<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10.5h18M7 15h4"/>',
  cash: '<rect x="3" y="7" width="18" height="11" rx="2"/><circle cx="12" cy="12.5" r="2.5"/><path d="M6.5 10v.01M17.5 15v.01"/>',
  phone: '<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 17.5h2"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/>',
  users: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3 19.5a6 6 0 0 1 12 0M16 5.5a3 3 0 0 1 0 6M18 19.5a5.5 5.5 0 0 0-2.5-4.6"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  flame: '<path d="M12 21c-3.9 0-7-2.8-7-6.6 0-3.1 2-5.3 3.6-7 .4 1.8 1.5 3 2.6 3.4C11 7.6 12.4 5 15 3c.2 3 1.7 4.6 2.8 6.2A7.2 7.2 0 0 1 19 13.9C19 18 15.9 21 12 21z"/>',
  calendar: '<rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  repeat: '<path d="M4 11V9a3 3 0 0 1 3-3h12M16 3l3 3-3 3M20 13v2a3 3 0 0 1-3 3H5M8 21l-3-3 3-3"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  refresh: '<path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v5h-5"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
  pen: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
  message: '<path d="M4 5h16v11H9l-5 4z"/>',
  upload: '<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',
  database: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/>',
  eyeoff: '<path d="M3 3l18 18M10.6 6.1A9.7 9.7 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3.2 3.9M6.5 7.6A16.6 16.6 0 0 0 2.5 12S6 18 12 18a9.4 9.4 0 0 0 4.2-1M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  food: '<path d="M4 11h16a8 8 0 0 1-16 0z"/><path d="M8.5 7.5c0-1.2 1-1.5 1-3M12 7.5c0-1.2 1-1.5 1-3M15.5 7.5c0-1.2 1-1.5 1-3"/>',
  groceries: '<path d="M5 8h14l-1.2 12H6.2z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
  shopping: '<path d="M3.5 12.5V4h8.5L21 13l-8 8z"/><circle cx="8" cy="8.5" r="1.2"/>',
  transport: '<path d="M5 16v-5l2-5h10l2 5v5"/><path d="M4 16h16v2.5H4zM7.5 13h.01M16.5 13h.01"/>',
  coffee: '<path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 10.5h1.5a2.5 2.5 0 0 1 0 5H16M9 3.5v3M12.5 3.5v3"/>',
  fun: '<path d="M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4z"/><path d="M14.5 7v10"/>',
  health: '<path d="M20 8.6a4.5 4.5 0 0 0-8-2.9 4.5 4.5 0 0 0-8 2.9C4 14 12 19 12 19s8-5 8-10.4z"/>',
  travel: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 3.5 5.5 3.5 8.5s-1 5.9-3.5 8.5c-2.5-2.6-3.5-5.5-3.5-8.5s1-5.9 3.5-8.5z"/>',
  other: '<circle cx="6" cy="12" r="1.1"/><circle cx="12" cy="12" r="1.1"/><circle cx="18" cy="12" r="1.1"/>',
  bills: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  income: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'
};

function ic(n, s) { s = s || 20; return '<svg' + (n === 'chev' || n === 'back' ? ' class="mir"' : '') + ' width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[n] || '') + '</svg>'; }

function mascot(mood, size) {
  var s = size || 56, sw = 'stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"', face;
  if (mood === 'broke') face = '<path d="M35 40l8 8M43 40l-8 8M57 40l8 8M65 40l-8 8" ' + sw + '/><path d="M38 66q12-10 24 0" ' + sw + '/>';
  else if (mood === 'nervous') face = '<circle cx="39" cy="44" r="2.8" fill="currentColor"/><circle cx="61" cy="44" r="2.8" fill="currentColor"/><path d="M36 61q3.5-3.5 7 0t7 0t7 0t7 0" ' + sw + '/><path d="M81 14q5 8 0 12q-5-4 0-12z" style="fill:var(--accent)"/>';
  else face = '<path d="M34 45q5-6 10 0M56 45q5-6 10 0" ' + sw + '/><path d="M38 57q12 11 24 0" ' + sw + '/>';
  return '<svg class="mascot" width="' + s + '" height="' + s + '" viewBox="0 0 100 100" aria-hidden="true"' + (mood === 'broke' ? ' style="opacity:.7"' : '') + '>' +
    '<circle cx="50" cy="50" r="41" ' + sw + '/><circle cx="50" cy="50" r="34" stroke="currentColor" stroke-width="1.3" stroke-dasharray="1.5 4" stroke-linecap="round" fill="none" opacity=".55"/>' + face + '</svg>';
}

function ring(pct, size) {
  var r = (size - 6) / 2, C = 2 * Math.PI * r, cx = size / 2;
  return '<svg class="ring" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" aria-hidden="true">' +
    '<circle cx="' + cx + '" cy="' + cx + '" r="' + r + '" fill="none" stroke-width="2" style="stroke:var(--line)"/>' +
    '<circle cx="' + cx + '" cy="' + cx + '" r="' + r + '" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="' + C.toFixed(2) + '" stroke-dashoffset="' + (C * (1 - pct)).toFixed(2) + '" transform="rotate(-90 ' + cx + ' ' + cx + ')" style="stroke:var(--accent)"/>' +
    '<text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" style="fill:var(--ink);font:300 15px \'Hanken Grotesk\', sans-serif;letter-spacing:-0.02em">' + Math.round(pct * 100) + '%</text></svg>';
}

function moodOf(c) {
  if (c.over || (c.todayBudget <= 0 && c.usedToday > 0)) return 'broke';
  if (c.todayBudget > 0 && c.usedToday / c.todayBudget >= 0.8) return 'nervous';
  return 'chill';
}

var MOOD_LINE = { chill: 'Chillar is chilling', nervous: 'Chillar is sweating', broke: 'Chillar has left the chat' };
