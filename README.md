# Amelia Simpson — Portfolio

A single-page personal portfolio for Amelia Simpson, a Seattle-based product designer
who builds the interfaces she designs.

Features an interactive **bubble mode** — a translucent bubble canvas you can toggle
on and pop with your cursor — alongside a mono / terminal-style case study layout.

## Stack

Plain static HTML/CSS/JS — no build step, no dependencies, no framework. Three files:

- [`index.html`](index.html) — markup and structure
- [`styles.css`](styles.css) — all styling (theme tokens, layout, animations)
- [`app.js`](app.js) — ~780 lines of vanilla JavaScript: the `<canvas>` bubble
  simulation, a custom cursor follower, the Nested case-study canvas animation
  (with `requestAnimationFrame`, `IntersectionObserver`, `ResizeObserver`), and
  the Work / Gallery / About view switcher.

## Local preview

Open the file in a browser:

```bash
open index.html
```

Or serve it locally:

```bash
npx serve .
```

## Deploy on Vercel

This is a zero-config static site. To deploy:

1. Push this repo to GitHub.
2. In [Vercel](https://vercel.com/new), import the repository.
3. Leave **Framework Preset** as **Other** and the build/output settings empty.
4. Deploy.

Or from the CLI:

```bash
vercel
```

---

2026 · coded in Claude ♥
