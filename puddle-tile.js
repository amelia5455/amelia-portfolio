/* Puddle tile on the Play page. The tile itself is playable (click the water to jump in);
   only the expand button in its upper-left corner spins the card up into #puddle-panel,
   where the design/development story sits beside a larger puddle.
   Closing spins it back down into the tile. */
(function () {
  var opener = document.querySelector('[data-puddle-open]');
  var tile = opener && opener.closest('.t-puddle');
  var dlg = document.getElementById('puddle-panel');
  if (!opener || !tile || !dlg || typeof dlg.showModal !== 'function') return;

  var card = dlg.querySelector('.pp-card');
  var stage = dlg.querySelector('[data-pp-stage]');
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var busy = false;

  // where the tile sits, as a transform on the card in its final, centered place
  function tileTransform() {
    var a = tile.getBoundingClientRect(), b = card.getBoundingClientRect();
    var dx = (a.left + a.width / 2) - (b.left + b.width / 2);
    var dy = (a.top + a.height / 2) - (b.top + b.height / 2);
    return 'translate(' + dx + 'px,' + dy + 'px) scale(' + (a.width / b.width) + ',' + (a.height / b.height) + ')';
  }

  function fadeBackdrop(from, to, ms) {
    try { dlg.animate({ opacity: [from, to] }, { duration: ms, pseudoElement: '::backdrop', fill: 'forwards' }); } catch (e) {}
  }

  function open() {
    if (busy || dlg.open) return;
    busy = true;
    // a fresh, playable copy; the tile's own copy stays non-interactive
    stage.innerHTML = '<iframe src="puddle.html?embed&v=2" title="Puddle: click the water to jump in"></iframe>';
    dlg.showModal();
    root.classList.add('pp-lock');

    if (reduce.matches) {
      card.animate({ opacity: [0, 1] }, { duration: 200 }).onfinish = function () { busy = false; };
      return;
    }
    fadeBackdrop(0, 1, 800);
    var anim = card.animate([
      { transform: tileTransform() + ' rotateY(0deg)' },
      { transform: 'translate(0px, 0px) scale(1, 1) rotateY(360deg)' }
    ], { duration: 1400, easing: 'cubic-bezier(.45,.05,.2,1)' });
    anim.onfinish = function () { busy = false; };
  }

  function close() {
    if (busy || !dlg.open) return;
    busy = true;
    function done() {
      dlg.close();
      stage.innerHTML = '';
      root.classList.remove('pp-lock');
      busy = false;
      opener.focus({ preventScroll: true });
    }
    if (reduce.matches) {
      card.animate({ opacity: [1, 0] }, { duration: 160, fill: 'forwards' }).onfinish = function () { done(); card.getAnimations().forEach(function (a) { a.cancel(); }); };
      return;
    }
    fadeBackdrop(1, 0, 1000);
    var anim = card.animate([
      { transform: 'translate(0px, 0px) scale(1, 1) rotateY(0deg)' },
      { transform: tileTransform() + ' rotateY(-360deg)' }
    ], { duration: 1100, easing: 'cubic-bezier(.55,0,.35,1)', fill: 'forwards' });
    anim.onfinish = function () {
      done();
      anim.cancel();
      dlg.getAnimations({ subtree: false }).forEach(function (a) { a.cancel(); });
    };
  }

  opener.addEventListener('click', open);
  dlg.querySelector('[data-puddle-close]').addEventListener('click', close);
  dlg.addEventListener('cancel', function (e) { e.preventDefault(); close(); });   // Esc
  dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });  // the dim area around the card
})();
