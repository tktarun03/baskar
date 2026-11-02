/* BasKar · js/features/money.js
   Money tab: switches between goals, bills and wallets.
   All app files share one global scope and load in the order listed in index.html. */
'use strict';

function renderMoney(c) {
  var seg = S.money || 'goals';
  var h = '<div class="seg three" role="group" aria-label="Money section">' + [['goals', 'Goals'], ['bills', 'Bills'], ['wallets', 'Wallets']].map(function (x) { return '<button type="button" data-act="money-seg" data-k="' + x[0] + '" aria-pressed="' + (seg === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div>';
  if (seg === 'goals') h += renderGoals(c); else if (seg === 'bills') h += renderBills(c); else h += renderWallets(c);
  return h;
}
