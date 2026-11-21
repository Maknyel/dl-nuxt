# ADR-0002: The Dealer Website Is a Vue 3 Single-Page App, Not Nuxt

- **Date:** 2026-11-22
- **Status:** Accepted. Supersedes ADR-0001's Nuxt server parts; its page-for-page port and fidelity rules stand.

## Context

ADR-0001 built the dealer website in Nuxt with server rendering. That needs a Node.js process running on every dealer
server (pm2 or cPanel's Node.js app). The team deploys the monolith frontend as static files (`git pull`,
`npm run build`, the web server points at `dist/`) and asked for the same: plain Vue 3.

What the Nuxt server did, and what it becomes:

| Nuxt server | Vue 3 |
|---|---|
| Rendered each page's HTML | The browser renders the page (no full HTML for search engines on first load) |
| Called the Dealer Lion API from the server (`server/api/site/*`) | The same routes run in the browser and call the API directly (its CORS already allows `*.dealerlion.com` and localhost) |
| Cached the API's answers (version check, 15s) | The same cache, per visitor's page session |
| Held the J.D. Power key | The API holds it; the site uses the API's public website routes |
| Slimmed the company data (2 MB → 26 KB) | Each visit downloads the full ~2 MB (accepted for now) |
| Settings from environment variables | `config.json` next to `index.html` |

## Decision

- **Vite + Vue 3 + vue-router + Tailwind 4**, converted in place: the 92 components and pages are unchanged. Same
  addresses, same templates, same client / sales switch.
- **The Nuxt conventions the components rely on are kept:**
  - auto-imports (`unplugin-auto-import`: Vue, the router, `useHead`, the composables and utils);
  - components by folder (`unplugin-vue-components`, `template-1/Nav.vue` → `<Template1Nav>`);
  - `<NuxtLink>` (= `RouterLink`) and `<NuxtLayout>` (= the default layout), registered globally;
  - `app/shims/nuxt.ts`: `$fetch`, `useFetch`, `useState`, `useRequestURL`, `navigateTo`, `definePageMeta`.
- **The site's routes run in the browser** (`app/site-api`). The former `server/api/site/*.get.ts` files are
  unchanged except the J.D. Power ones. `dispatch.ts` matches `/api/site/...` to them by file name, as Nuxt did, and
  `runtime/h3.ts` provides the few h3 functions they use. An error status becomes a thrown error, as `$fetch` threw.
- **`config.json`** (`public/config.example.json`) holds each dealer's settings and is read at start-up, so one build
  serves every dealer. It's public, so it holds no secrets.
- **J.D. Power** (trade-in models, trims, drivetrain, VIN):
  - Models go through the API's existing public `website/get/vehicle/models`.
  - Trims, drivetrain and the trade-in VIN decode call `website/get/vehicle/trims`, `drivetrain` and `trade-vin`.
    These **don't exist in the API**: they were added and then reverted on request. Until such public routes exist,
    those lookups answer errors, and the forms show their "No trims found" / "Error loading data" states. The
    J.D. Power key is never sent to the browser.
- **Icons:** a build plugin bundles only the Ionicons the app names (`virtual:ion-icons`), drawn by `<Icon>` as inline
  SVG.
- **Unknown vehicle:** Vehicle Not Found shows as before, but without an HTTP 404 status; a static site can't set one.

## Consequences

- Deploys like the monolith frontend: `npm run build`, serve `dist/`, edit `dist/config.json`; SPA fallback via the
  included `.htaccess` (Apache) or `try_files` (Nginx). No Node.js on the server.
- Search engines get the page only after JavaScript runs (no server-rendered HTML). The Laravel sites and the Nuxt
  version sent full pages.
- Each visit downloads the dealer's full company data (~2 MB, mostly inline images) before the page shows.
- Trade-in trims, drivetrain and VIN decode need public API routes before they work (above).
- The `.env` file in this folder is no longer read (Vite only exposes `VITE_` variables). Its J.D. Power key is
  unused there and the file can be deleted.

## Verification

- `npm run build`: the type check passes (`vue-tsc`, 0 errors) and the build succeeds (main bundle 84 KB gzipped).
- In Edge, on the dev server and on the built `dist/` (`vite preview`), with the local API, every page rendered with
  no errors or Vue warnings:
  - home, inventory, vehicle, Vehicle Not Found, sell, finance, services, about, contact, privacy, terms, and an
    unknown address;
  - templates 2–4 through `?template=`.
- Page heights equal the Nuxt version's, which matched :8002: inventory 3392, vehicle 2600, privacy 2833, terms 2273,
  about 1305, contact 1644, services 1923, finance 1327, sell 970.
