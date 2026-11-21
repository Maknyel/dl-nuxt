# Porting a Blade view to this site (Vue 3)

How the Laravel site's Blade views (`C:\dev\dealer-lion-client-templates`, :8002) become Vue components here. The goal is
**the same page, pixel for pixel**, on any of the 4 templates.

## Source and maps

- Blade views: `C:\dev\dealer-lion-client-templates\resources\views\wip-template-builder\` (read-only; never edit it).
- Which file renders what, per template: `views-map.md`. What each page gets from the API: `data-map.md`. Both are in
  the session scratchpad (`...\scratchpad\nuxt-port\`); sample API responses are in its `api-samples\`.

## Conventions

- **Components**: `<script setup lang="ts">` single-file components in `app/components/`:
  - `template-1/`, `template-2/`, `template-3/`, `template-4/`: a template's own sections (`Nav.vue`, `Footer.vue`,
    `home/*.vue`).
  - `global/`: shared by several templates (the Laravel `components/global/*`).
  - `ui/`: small reusable pieces (the Laravel `<x-...>` components, custom-components).
- **Data**: `const { company, mainCompany, template, templateNav, isMulti, menus, locations, mediaUrl, logoUrl } = useSite()`.
  - `menus`: the nav links (label + path) from the dealer's `template_nav` flags.
  - `locations`: name, phone, email, address, mapUrl, website, accountType and `raw` (the location's own company
    row) for each location, or for the company itself when there's no group.
  - `mediaUrl(file, companyId?)`: the Laravel `MAIN_WEBSITE_URL . 'media/company/{id}/' . $file`.
  - `logoUrl(company?)`: the logo with Dealer Lion's fallback.
  - Page data comes from the page (`useFetch('/api/site/home')` and so on) as props.
- **Helpers** (`app/utils/format.ts`, auto-imported): `capsOnly`, `formatAddress`, `formatPhone`, `money`, `mileage`, `firstImage`,
  `isDemoHost`, `buildMediaUrl`, `DEALER_LION_LOGO`.
- **Markup and Tailwind**: keep the Blade's markup and Tailwind classes. The Tailwind setup (`app/assets/css/main.css`)
  has the Laravel site's breakpoints (sm 576, md 768, lg 992, xl 1200, 2xl 1350), centred `container`, colour tokens
  (`bg-primary-base`, `bg-base-100`, ...), and the `company-*-base-background` / `-text`, `btn-pill*`,
  `btn-icon-circle`, `multi-cta-*` classes.
  - The `company-*-base-background` / `-text` classes beat a Tailwind `bg-*` / `text-*` on the same element (as on
    :8002), so markup with both can be ported as it is.
  - The dealer's colours are CSS variables on `<body>`: `var(--company-primary-base)`,
    `var(--company-secondary-base)`, `var(--company-dark-primary-base)`. Tailwind also has them as `bg-company-primary`,
    `text-company-primary`, and so on.
  - A Blade view's inline `<style>` block goes in the component's `<style scoped>`, unchanged where it can't be
    simply expressed with Tailwind classes (fidelity first). Use `:deep()` for rules that style child components.
  - Tailwind 3 → 4 renames to watch: `shadow-sm` → `shadow-xs`, `shadow` → `shadow-sm`, `rounded-sm` → `rounded-xs`,
    `rounded` → `rounded-sm`, `blur-sm` → `blur-xs`, `outline-none` → `outline-hidden`, `ring` (3px) → `ring-3`;
    `bg-opacity-*` / `text-opacity-*` → `bg-black/50` style. Borders default to `currentColor` in Tailwind 4 (Tailwind 3:
    gray-200), so a bare `border` needs `border-gray-200`.
  - **Classes the Laravel build never generated, which Tailwind 4 does:** drop them, or the page changes.
    - `zoom-75` becomes `zoom: 0.75`.
    - `lg:container` becomes a width-capped container.
    - `h-18` becomes 4.5rem.
    - Also `text-md` and `focus:shadow-outline`.
  - **Line heights:** `text-sm` / `text-xs` line heights are ratios in Tailwind 4 (fixed in Tailwind 3). Where a Blade
    style changes the font size of an element with a `text-*` class, set the line height it had (`text-sm`: 1.25rem,
    `text-xs`: 1rem).
  - **Icons:** an `<Icon>` takes a `text-*` class for its size, as `<ion-icon>` did.
- **Icons**: `<ion-icon name="call-outline">` becomes `<Icon name="ion:call-outline" />` (rendered on the server as
  SVG, 1em square, class `ion-icon`). Font Awesome `<i class="fa fa-...">`: use the closest Ionicon.
- **Links**: `route('frontend.search')` → `/pre-owned-cars`; `frontend.sell` → `/sell`; `frontend.finance` →
  `/finance`; `frontend.prequal` → `/prequal`; `frontend.services` → `/services`; `frontend.aboutus` → `/aboutus`;
  `frontend.contactus` → `/contactus`; `frontend.privacy_policy` → `/privacy_policy`; `frontend.termsof_service` →
  `/termsof_service`; `frontend.disclaimer_notice` → `/disclaimer_notice`; `frontend.reviews` → `/reviews`;
  `frontend.show` → `/view/{id}`; `frontend.index` → `/`. Use `<NuxtLink>` for site pages, keeping the query strings
  the Blade builds (e.g. `/pre-owned-cars?body_type[]=SUV`).
- **Behaviour**: Alpine `x-data` / `x-show` / `@click` and jQuery or vanilla scripts become Vue state (`ref`,
  `computed`), `v-show` / `v-if` and event handlers. Anything touching `window` or `document` goes in `onMounted`.
  Prefer CSS for open/close where the Blade does.
- **Static files**: copy what a component needs from the Laravel `public/` into this project's `public/` at the same
  path (for example `public/images/...`), then reference it as `/images/...`.
- **Forms are not ported yet**: render every form exactly, but don't send anything. The submit handler is
  `@submit.prevent` with a `// TODO(forms): POST <endpoint> (see data-map.md "Form endpoints")` comment, and a submit
  button does nothing.
- **Data the Blade reads but the API doesn't return** (see data-map.md "Caveats"): render the same fallback the Blade
  shows.
- No secrets or API keys in the site: everything it ships is public (`config.json` too). Anything needing a key belongs in the Dealer Lion API, called through a site route (`app/site-api/api/site/`).

## Checking your work

- The dev server runs at http://localhost:3002 (`npm run dev`, Vite; usually already running, so don't start a second).
  `?template=template-2` (to `-4`) on any URL previews another template, in development only.
- Compare with :8002 at 1280px and 390px wide: Playwright is in `C:/dev/dealer-lion-monolith-frontend/node_modules/playwright`,
  launched with `{ channel: 'msedge' }`. On :8002, switching template needs the dealer's data, so compare template 1 by
  screenshot and templates 2–4 against their Blade markup.
- `npm run typecheck` in this folder: no errors in your files.
