/**
 * ScratchCard — a rainbow scratch-art tile.
 *
 * Usage:
 *   <div class="scratch-card" data-scratch-card> ...label / pill / buttons... </div>
 *   <script src="scratch-card.js"></script>
 *
 * Every element with [data-scratch-card] is auto-initialised. Two canvases are
 * injected: a holographic "foil" underneath and a black "coat" on top that the
 * pointer erases, like the wooden stylus on those old scratch-art booklets.
 */
(function () {
  const RAINBOW = [
    '#ff3ea5', '#b04dff', '#5b6bff', '#2fd3ff',
    '#3dffb0', '#c8ff3d', '#ffe23d', '#ff9a3d', '#ff3ea5',
  ];

  // Small seeded RNG so the glitter pattern is stable across resizes.
  function rng(seed) {
    return function () {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
  }

  class ScratchCard {
    constructor(root, opts = {}) {
      this.root = root;
      this.opts = { brush: 4, ...opts };
      this.hasScratched = false;
      this.drawing = false;
      this.last = null;

      this.foil = document.createElement('canvas');
      this.coat = document.createElement('canvas');
      this.foil.className = 'scratch-foil';
      this.coat.className = 'scratch-coat';
      this.foil.setAttribute('aria-hidden', 'true');
      this.coat.setAttribute('aria-hidden', 'true');
      root.prepend(this.foil, this.coat);

      this.foilCtx = this.foil.getContext('2d');
      this.coatCtx = this.coat.getContext('2d', { willReadFrequently: false });

      this.resetBtn = root.querySelector('[data-scratch-reset]');
      this.saveBtn = root.querySelector('[data-scratch-save]');

      this.bind();
      new ResizeObserver(() => this.resize()).observe(root);
      this.resize();
    }

    /* ---------- sizing ---------- */

    resize() {
      const { width, height } = this.root.getBoundingClientRect();
      if (!width || !height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const first = !this.w;

      // Keep whatever has been scratched so far by scaling the old coat.
      let snapshot = null;
      if (!first) {
        snapshot = document.createElement('canvas');
        snapshot.width = this.coat.width;
        snapshot.height = this.coat.height;
        snapshot.getContext('2d').drawImage(this.coat, 0, 0);
      }

      this.w = width;
      this.h = height;
      this.dpr = dpr;
      for (const c of [this.foil, this.coat]) {
        c.width = Math.round(width * dpr);
        c.height = Math.round(height * dpr);
      }
      this.foilCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.coatCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      this.paintFoil();
      if (snapshot) {
        this.coatCtx.save();
        this.coatCtx.setTransform(1, 0, 0, 1, 0, 0);
        this.coatCtx.drawImage(snapshot, 0, 0, this.coat.width, this.coat.height);
        this.coatCtx.restore();
      } else {
        this.paintCoat();
      }
    }

    /* ---------- layers ---------- */

    paintFoil() {
      const ctx = this.foilCtx;
      const { w, h } = this;
      const rand = rng(7);

      // Diagonal rainbow bands.
      const g = ctx.createLinearGradient(0, 0, w, h);
      RAINBOW.forEach((c, i) => g.addColorStop(i / (RAINBOW.length - 1), c));
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // A second, cross-angled sweep gives that oily holographic shift.
      const g2 = ctx.createLinearGradient(w, 0, 0, h * 0.6);
      g2.addColorStop(0, 'rgba(255,255,255,0.35)');
      g2.addColorStop(0.3, 'rgba(120,80,255,0.0)');
      g2.addColorStop(0.55, 'rgba(0,255,220,0.30)');
      g2.addColorStop(0.8, 'rgba(255,60,200,0.0)');
      g2.addColorStop(1, 'rgba(255,255,140,0.35)');
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);

      // Glitter.
      ctx.globalCompositeOperation = 'source-over';
      const count = Math.round((w * h) / 14);
      for (let i = 0; i < count; i++) {
        const x = rand() * w;
        const y = rand() * h;
        const a = 0.15 + rand() * 0.55;
        ctx.fillStyle = rand() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(255,240,255,${a * 0.6})`;
        const s = rand() > 0.97 ? 1.6 : 0.8;
        ctx.fillRect(x, y, s, s);
      }
    }

    paintCoat() {
      const ctx = this.coatCtx;
      const { w, h } = this;
      const rand = rng(42);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#0a0a0b';
      ctx.fillRect(0, 0, w, h);

      // Faint waxy sheen + paper grain so it doesn't read as flat #000.
      const sheen = ctx.createLinearGradient(0, 0, w, h);
      sheen.addColorStop(0, 'rgba(255,255,255,0.045)');
      sheen.addColorStop(0.5, 'rgba(255,255,255,0)');
      sheen.addColorStop(1, 'rgba(255,255,255,0.03)');
      ctx.fillStyle = sheen;
      ctx.fillRect(0, 0, w, h);

      const grain = Math.round((w * h) / 30);
      for (let i = 0; i < grain; i++) {
        ctx.fillStyle = `rgba(255,255,255,${0.012 + rand() * 0.025})`;
        ctx.fillRect(rand() * w, rand() * h, 1, 1);
      }
    }

    /* ---------- scratching ---------- */

    widthFor(pressure) {
      // Mouse reports 0.5 while pressed; pens vary 0–1.
      const p = pressure || 0.5;
      return this.opts.brush * (0.6 + p * 0.8);
    }

    dot(x, y, r) {
      const ctx = this.coatCtx;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000'; // erase strength comes from alpha, so keep it opaque
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    line(x1, y1, x2, y2, width) {
      const ctx = this.coatCtx;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = '#000';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    point(e) {
      const r = this.coat.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top, p: e.pressure };
    }

    bind() {
      const c = this.coat;

      c.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        this.drawing = true;
        c.setPointerCapture(e.pointerId);
        const pt = this.point(e);
        this.last = pt;
        this.dot(pt.x, pt.y, this.widthFor(pt.p) / 2);
        this.markScratched();
      });

      c.addEventListener('pointermove', (e) => {
        this.tilt(e);
        if (!this.drawing) return;
        const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
        for (const ev of events) {
          const pt = this.point(ev);
          this.line(this.last.x, this.last.y, pt.x, pt.y, this.widthFor(pt.p));
          this.last = pt;
        }
      });

      const end = () => { this.drawing = false; this.last = null; };
      c.addEventListener('pointerup', end);
      c.addEventListener('pointercancel', end);
      c.addEventListener('pointerleave', () => this.root.style.removeProperty('--foil-hue'));

      this.resetBtn?.addEventListener('click', () => this.reset());
      this.saveBtn?.addEventListener('click', () => this.save());
    }

    // Holographic foil shifts hue as you move across it, like tilting the page.
    tilt(e) {
      const pt = this.point(e);
      const deg = ((pt.x / this.w) - 0.5) * 70 + ((pt.y / this.h) - 0.5) * 20;
      this.root.style.setProperty('--foil-hue', `${deg.toFixed(1)}deg`);
    }

    markScratched() {
      if (this.hasScratched) return;
      this.hasScratched = true;
      this.root.classList.add('is-scratched');
    }

    reset() {
      this.coatCtx.save();
      this.coatCtx.globalCompositeOperation = 'source-over';
      this.paintCoat();
      this.coatCtx.restore();
      this.hasScratched = false;
      this.root.classList.remove('is-scratched');
    }

    save() {
      const out = document.createElement('canvas');
      out.width = this.coat.width;
      out.height = this.coat.height;
      const ctx = out.getContext('2d');
      ctx.drawImage(this.foil, 0, 0);
      ctx.drawImage(this.coat, 0, 0);
      out.toBlob((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'my-scratch-art.png';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      }, 'image/png');
    }
  }

  window.ScratchCard = ScratchCard;
  document.querySelectorAll('[data-scratch-card]').forEach((el) => new ScratchCard(el));
})();
