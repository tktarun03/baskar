/* BasKar · js/core/content.js
   Content: categories, meals, wallet types, roast lines.
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

var CATS = {
  food: { short: 'Food', label: 'Food delivery & dining', color: '#C2704A' },
  groceries: { short: 'Groceries', label: 'Groceries & quick commerce', color: '#8170B8' },
  shopping: { short: 'Shopping', label: 'Shopping', color: '#4F7BB8' },
  transport: { short: 'Transport', label: 'Transport', color: '#3F8F7A' },
  coffee: { short: 'Coffee', label: 'Coffee & cafés', color: '#9A7B5A' },
  fun: { short: 'Fun', label: 'Entertainment', color: '#B4648A' },
  health: { short: 'Health', label: 'Health', color: '#3E93A0' },
  travel: { short: 'Travel', label: 'Travel', color: '#B88A3C' },
  other: { short: 'Other', label: 'Other', color: '#8A8F98' },
  bills: { short: 'Bills', label: 'Rent & bills (fixed)', color: '#7A808A' }
};

var INCOME_CAT = { short: 'Income', label: 'Income', color: '#3E9468' };

/* Meals for food spends, picked from the time of day: 4:00–10:59 breakfast, 11:00–16:59 lunch, otherwise dinner. */
var MEALS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' };

function mealFor(ts) { var h = new Date(ts).getHours(); return h >= 4 && h < 11 ? 'breakfast' : h >= 11 && h < 17 ? 'lunch' : 'dinner'; }

function mealOptions(sel) { return '<option value="">No meal</option>' + Object.keys(MEALS).map(function (k) { return '<option value="' + k + '"' + (sel === k ? ' selected' : '') + '>' + MEALS[k] + '</option>'; }).join(''); }

var AUTO_NOTES = /^(from bank sms|imported from csv|example data)$/i;

function remarkOf(t) { return t && t.note && !AUTO_NOTES.test(t.note) ? t.note : ''; }

var WTYPES = { bank: { label: 'Bank account', icon: 'bank' }, card: { label: 'Credit card', icon: 'card' }, cash: { label: 'Cash', icon: 'cash' }, wallet: { label: 'Digital wallet', icon: 'phone' } };

var CAT_ROAST = {
  food: 'Your kitchen is now officially a decoration.',
  groceries: '10 minutes to deliver. 10 days to recover.',
  shopping: 'Because apparently you deserve happiness.',
  transport: 'Could have walked. Did not.',
  coffee: 'Premium bean water. Iconic.',
  fun: 'Treat yourself. Again. And again.',
  health: 'Health spends get a pass. Chillar approves.',
  travel: 'Wanderlust, meet bank balance.',
  other: 'Tracked. Judged. Moving on.',
  bills: 'Bills. The one spend nobody enjoys.'
};

var MERCHANT_ROASTS = [
  [/blinkit|zepto|instamart|dunzo|bigbasket|getir|gopuff/i, '10 minutes to deliver. 10 days to recover.'],
  [/swiggy|zomato|uber ?eats|deliveroo|doordash|talabat|grubhub|foodpanda/i, 'Your kitchen is now officially a decoration.'],
  [/amazon|flipkart|myntra|noon|shein|ajio|meesho|temu/i, 'Because apparently you deserve happiness.'],
  [/starbucks|caf[eé]|coffee|chai|tea/i, 'Premium bean water. Iconic.'],
  [/uber|ola|lyft|careem|rapido|bolt|taxi|cab/i, 'Could have walked. Did not.']
];

function roastFor(t) { var m = t.merchant || ''; for (var i = 0; i < MERCHANT_ROASTS.length; i++) if (MERCHANT_ROASTS[i][0].test(m)) return MERCHANT_ROASTS[i][1]; return CAT_ROAST[t.cat] || CAT_ROAST.other; }
