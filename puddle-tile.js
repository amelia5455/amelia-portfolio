/* Puddle tile on the Play page: clicking it spins the card up into #puddle-panel,
   where the puddle is playable and the design/development story sits beside it.
   Closing spins it back down into the tile. */
(function () {
  var tile = document.querySelector('[data-puddle-open]');
  var dlg = document.getElementById('puddle-panel');
  if (!tile || !dlg || typeof dlg.showModal !== 'function') return;

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
    stage.innerHTML = '<iframe src="puddle.html?embed" title="Puddle: click the water to jump in"></iframe>';
    dlg.showModal();
    root.classList.add('pp-lock');

    if (reduce.matches) {
      card.animate({ opacity: [0, 1] }, { duration: 200 }).onfinish = function () { busy = false; };
      return;
    }
    fadeBackdrop(0, 1, 500);
    var anim = card.animate([
      { transform: tileTransform() + ' rotateY(0deg)' },
      { transform: 'translate(0px, 0px) scale(1, 1) rotateY(360deg)' }
    ], { duration: 850, easing: 'cubic-bezier(.22,.9,.24,1)' });
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
      tile.focus({ preventScroll: true });
    }
    if (reduce.matches) {
      card.animate({ opacity: [1, 0] }, { duration: 160, fill: 'forwards' }).onfinish = function () { done(); card.getAnimations().forEach(function (a) { a.cancel(); }); };
      return;
    }
    fadeBackdrop(1, 0, 600);
    var anim = card.animate([
      { transform: 'translate(0px, 0px) scale(1, 1) rotateY(0deg)' },
      { transform: tileTransform() + ' rotateY(-360deg)' }
    ], { duration: 650, easing: 'cubic-bezier(.6,0,.3,1)', fill: 'forwards' });
    anim.onfinish = function () {
      done();
      anim.cancel();
      dlg.getAnimations({ subtree: false }).forEach(function (a) { a.cancel(); });
    };
  }

  tile.addEventListener('click', open);
  tile.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
  });
  dlg.querySelector('[data-puddle-close]').addEventListener('click', close);
  dlg.addEventListener('cancel', function (e) { e.preventDefault(); close(); });   // Esc
  dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });  // the dim area around the card
})();
