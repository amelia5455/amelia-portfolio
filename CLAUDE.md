# Amelia's Portfolio

Personal portfolio for Amelia Simpson (product designer, Seattle). Live at **ameliarsimpson.com**.

## Stack

- Plain static HTML/CSS/JS. No build step, no framework, no package.json.
- `index.html` is the whole single-page site. Views switch through `html[data-view]` (`work` / `gallery` / `about`), driven by `app.js`.
- `styles.css` holds all site styling. `app.js` holds the weather toggle (rain/bubbles), the cursor, the view switcher and the canvas animations.
- Other pages: case studies (`booth.html`, `besties.html`, `nested.html`, each with its own CSS) and `404.html`, a pixel-art UFO-abducts-a-cow scene built with GSAP from cdnjs.
- `scratch-card.js` / `scratch-card.css` hold the scratch-art tile on the Play page.
- Assets live in `images/` (Play photos in `images/playground/`), `videos/`, `audio/` and `files/` (resume PDF).

## Play page (the "gallery" view)

- The nav label says **Play**, but internally everything is still called `gallery`: `data-view="gallery"`, `#view-gallery`, and the URL `/gallery`.
- Content is a bento grid: `<section class="bento">` in `index.html`, with `.tile` / `.t-*` rules in `styles.css`.
- Current tiles: scratch art, Frida litho, Froyo Shop (links out), Paros photo, and the 404 page.
- The 404 tile embeds `404.html?embed`, which loops the animation instead of redirecting home.
- The old pan-around canvas (`#galleryCanvas`) is hidden by CSS, not deleted.
- Responsive breakpoints use container queries on `#view-gallery` (760px and 520px), not media queries, because the sidebar takes 380px.

## Design rules (Amelia's preferences)

- **No hover zoom or hover nudge, anywhere.** No `transform: scale` or translate on hover.
- Captions stay compact (one line each, ellipsis) and must not cover the photo or overlap buttons.
- Photos fill their tile (`object-fit: cover`) with no zoom-in crop and no blur.
- The scratch-art rainbow stays steady: no hue shift, no example drawings.
- Everything must work on mobile. Check a phone width (375px) as well as desktop.

## Workflow

- **Cache busting:** when `styles.css`, `app.js` or the scratch-card files change, bump their `?v=N` in `index.html`.
- **Local preview:** run `python3 -m http.server` from the repo root, then open `http://localhost:<port>/index.html#gallery`. Paths like `/gallery` and `/work` only work on Vercel, where `vercel.json` rewrites them.
- The site has a fade-in entrance, so a screenshot taken right after load can look blank. Take it again.
- **Uncommitted edits Amelia made herself** (for example in `app.js` or `index.html`) must stay out of commits unless she says otherwise. Stage only your own lines; use `git add -p`, or build the blob from `HEAD` when a file mixes both.
- **Shipping:** don't commit or push unless asked. "Ship it" means commit to `main` and push. Vercel auto-deploys from GitHub `amelia5455/amelia-portfolio`.
- **Checking a deploy:** `gh api repos/amelia5455/amelia-portfolio/commits/<sha>/status`. The deploy is done when the Vercel state is `success`.
- `.vercelignore` keeps shelved drafts (`booth-case-study.html`) off the live site.
- **Figma:** the portfolio designs live in Figma ("Amelia's Portfolio (Final)"). When given a Figma link, match the design but adapt it to this plain HTML/CSS setup.
