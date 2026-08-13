# webiko.dev

Landing page for Webiko doo — a Next.js (App Router) rebuild of the original
interactive prototype (`Webiko Landing.dc.html`), which is kept in the repo
as the design/interaction source of truth.

## Stack

- **Next.js 16** (App Router, Turbopack, React 19, TypeScript, static
  generation) — the whole page prerenders to static HTML at build time.
- **GSAP**, loaded on the client only and off the critical rendering path,
  for the letter drag/snap, wheel-zoom pulse, and menu→panel morph
  animations.
- No CSS framework — CSS Modules + a small global stylesheet, mirroring the
  original's inline-style approach but with the dynamic (per-frame) values
  kept in `style={}` and everything static moved into `.module.css`.

## Getting started

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # production build (also type-checks)
npm run start     # serve the production build
npm run lint
npm run typecheck
```

## What's implemented

**Interaction (ported from the prototype):**

- Full-viewport `webiko.dev` wordmark; letter weight/glow follows the
  cursor, background hue/lightness follows the cursor (subtle oklch shift).
- Letters are drag-and-drop reorderable (GSAP elastic snap-back on release).
- Scroll-wheel "pulse" zoom on the wordmark.
- Hamburger → clip-path menu reveal → clicking Services/Work/Contact morphs
  the clicked label into the panel heading, then reveals the panel.
- Contact form now round-trips for real: it posts JSON to
  `app/api/contact/route.ts`, which validates the payload and (for now)
  logs it server-side. **Before launch, wire that route up to a real
  delivery mechanism** (e.g. [Resend](https://resend.com) or Postmark) —
  see the `TODO` in that file.

**SEO:**

- Full `Metadata` API config in `app/layout.tsx` / `app/page.tsx`: title
  template, description, canonical URL, Open Graph + Twitter card tags,
  robots directives.
- `app/opengraph-image.tsx` — a generated 1200×630 social preview image.
- `app/icon.tsx` / `app/apple-icon.tsx` — generated favicon / touch icon.
- `app/manifest.ts`, `app/robots.ts`, `app/sitemap.ts` — Next's native file
  conventions, so `/manifest.webmanifest`, `/robots.txt`, `/sitemap.xml`
  are all generated automatically.
- JSON-LD (`ProfessionalService`) structured data in the root layout.
- Real semantic markup: the wordmark is an `<h1 aria-label="webiko.dev">`
  (decorative letter spans are `aria-hidden`, so reordering them never
  changes what a screen reader announces), panel titles are `<h2>`, the
  menu is a `<nav>` of real `<button>`s, form fields have associated
  (visually hidden) `<label>`s.
- Set `NEXT_PUBLIC_SITE_URL` in the deployment environment if the
  production domain isn't `https://webiko.dev` — it feeds
  `metadataBase`, the sitemap, and `robots.txt` (see `lib/site.ts`).

**Performance / Core Web Vitals:**

- Static generation for every route except the contact API — no
  server-side work on the hot path, so TTFB is just "serve static HTML."
  Confirmed via `next build` output (all routes marked `○ Static`).
- `next/font` self-hosts Inter (no Google Fonts network request, no
  render-blocking `<link>`, automatic `font-display: swap`).
- GSAP is dynamically `import()`-ed on mount instead of loaded upfront —
  it's not needed for first paint, so it doesn't add to initial JS/TBT.
  Mouse-move handling is throttled to one state update per animation
  frame; drag physics mutate the DOM directly through GSAP refs instead
  of going through React state, so a drag doesn't trigger re-renders.
- `prefers-reduced-motion` is respected: all CSS transitions collapse to
  near-zero duration, and GSAP tween durations are set to `0` (see
  `usePrefersReducedMotion` in `components/WebikoStage.tsx`).
- Long-lived caching headers for static assets (`next.config.ts`).

## Notes

- The whole experience is a single view (no real routing) — Services and
  Work intentionally still show "TBD," matching the original prototype.
  If/when there's real content for those, it's worth asking whether they
  should become their own routes (`/services`, `/work`) for that content's
  own SEO, rather than staying JS-only panels on `/`.
- Deploy anywhere that runs Node (Vercel is the path of least resistance
  for Next.js — automatic image/OG generation, edge caching, etc.).
