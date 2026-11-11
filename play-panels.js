/* Play panels: each interactive card on the Play page opens into its own panel
   (<dialog class="play-panel" data-panel="key">) with a single card flip.

   - [data-panel-open="key"] buttons open it (the "Read more" button in a card's upper-left).
   - A card with [data-panel-click] also opens when the card itself is clicked
     (cards that aren't playable in place: Frida, Froyo, 404).
   - A stage with [data-stage-src] gets a fresh iframe each time the panel opens,
     and loses it on close so nothing keeps running in the background.
   Closing flips the card back down into its tile. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var busy = false;

  function setup(dlg) {
    var key = dlg.getAttribute('data-panel');
    var tile = document.querySelector('[data-panel-tile="' + key + '"]');
    var openers = document.querySelectorAll('[data-panel-open="' + key + '"]');
    var card = dlg.querySelector('.pp-card');
    var stage = dlg.querySelector('[data-stage-src]');
    var closeBtn = dlg.querySelector('[data-panel-close]');
    if (!tile || !openers.length || !card) return;
    var returnTo = openers[0];

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

    function open(from) {
      if (busy || dlg.open) return;
      busy = true;
      returnTo = from || openers[0];
      if (stage) {
        var f = document.createElement('iframe');
        f.src = stage.getAttribute('data-stage-src');
        f.title = stage.getAttribute('data-stage-title') || '';
        stage.appendChild(f);
      }
      dlg.showModal();
      root.classList.add('pp-lock');

      if (reduce.matches) {
        card.animate({ opacity: [0, 1] }, { duration: 200 }).onfinish = function () { busy = false; };
        return;
      }
      fadeBackdrop(0, 1, 700);
      // one half-turn: the card leaves the grid face down and turns over as it settles
      var anim = card.animate([
        { transform: tileTransform() + ' rotateY(-180deg)' },
        { transform: 'translate(0px, 0px) scale(1, 1) rotateY(0deg)' }
      ], { duration: 1000, easing: 'cubic-bezier(.3,.7,.2,1)' });
      anim.onfinish = function () { busy = false; };
    }

    function close() {
      if (busy || !dlg.open) return;
      busy = true;
      function done() {
        dlg.close();
        if (stage) stage.innerHTML = '';
        root.classList.remove('pp-lock');
        busy = false;
        if (returnTo) returnTo.focus({ preventScroll: true });
      }
      if (reduce.matches) {
        var fade = card.animate({ opacity: [1, 0] }, { duration: 160, fill: 'forwards' });
        fade.onfinish = function () { done(); fade.cancel(); };
        return;
      }
      fadeBackdrop(1, 0, 700);
      var anim = card.animate([
        { transform: 'translate(0px, 0px) scale(1, 1) rotateY(0deg)' },
        { transform: tileTransform() + ' rotateY(180deg)' }
      ], { duration: 800, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' });
      anim.onfinish = function () {
        done();
        anim.cancel();
        dlg.getAnimations({ subtree: false }).forEach(function (a) { a.cancel(); });
      };
    }

    Array.prototype.forEach.call(openers, function (btn) {
      btn.addEventListener('click', function (e) { e.stopPropagation(); open(btn); });
    });
    if (tile.hasAttribute('data-panel-click')) {
      tile.addEventListener('click', function (e) {
        if (e.target.closest('a, button')) return;   // the card's own buttons and links do their own thing
        open(openers[0]);
      });
    }
    if (closeBtn) closeBtn.addEventListener('click', close);
    dlg.addEventListener('cancel', function (e) { e.preventDefault(); close(); });   // Esc
    dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });  // the dim area around the card
  }

  Array.prototype.forEach.call(document.querySelectorAll('dialog.play-panel'), setup);
})();
