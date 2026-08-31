# NELOdev

Static Astro one-page site for NELOdev — Django and Python web development for business applications.

## Commands

- `npm install` — install dependencies.
- `npm run dev` — start the Astro dev server with hot reload.
- `npm run build` — generate local assets and build the static site into `dist/`.
- `npm run preview` — serve the production build from `dist/` locally.
- `npm run validate` — deterministic checks against `dist/` (structure, copy, metadata, privacy, payload).
- `npm test` — production build followed by validation.

## Structure

- `src/pages/index.astro` — the single public page.
- `src/styles/global.css` — palette, typography, layout.
- `public/` — favicon, `robots.txt`, `sitemap.xml`.
- `scripts/` — deterministic asset generation and build validation (Node standard library only).
