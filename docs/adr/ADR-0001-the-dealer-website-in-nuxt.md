# ADR-0001: The Dealer Website in Nuxt + Tailwind, Page for Page With the Laravel Site

- **Date:** 2026-11-21
- **Status:** Accepted
- **Source:** dealer-lion-client-templates (Laravel/Blade, :8002), read-only

## Context

The dealer website is a Laravel app that renders Blade views. It uses jQuery and Alpine for behaviour and a compiled
Tailwind 3 build plus large inline style blocks for its looks. We want the same site in Nuxt with Tailwind:

- the 10 pages: home, inventory, vehicle, sell, finance, services, about, contact, privacy, terms;
- all 4 templates;
- the same Dealer Lion API.

## Decision

- **Nuxt 4 with server rendering, Tailwind 4.** It's a separate project (`dealer-lion-client-templates-nuxt`). The
  addresses are the Laravel site's (`/pre-owned-cars`, `/view/{id}`, ...), so links and search results carry over.
- **The same API and settings.** The defaults in `nuxt.config.ts` copy the Laravel site's local `.env`
  (`URL_API_CORE`, `COMPANY_ID_ENV`, `COMPANY_INFO`, `MAIN_WEBSITE_URL`); `NUXT_*` environment variables override them.
- **API calls only on the Nuxt server** (`server/api/site/*`, `server/utils/dealerApi.ts`), never from the browser:
  - The shared answers are cached with the Laravel site's version check (API ADR-1133). A settings save shows within
    about 15 seconds.
  - Pages get only the fields they render. For example, the layout data is 26 KB instead of the API's 2 MB of inline
    images, and vehicles never carry cost or margin.
- **Templates.**
  - The 9 inner pages are the same markup on every template.
  - Template 1 has its own nav, footer and home. Templates 2–4 share a footer and home, and each has its own nav.
  - Picked from the dealer's `template` as `myCurrentTemplate()` does. In development, `?template=template-N`
    previews another one.
- **Fidelity first.** Each component keeps the Blade's markup and Tailwind classes; inline style blocks became
  component styles. `main.css` reproduces what the Laravel build actually compiles: its breakpoints, its `container`,
  its colour tokens, its page font stack, Tailwind 3's `blue-600`, and the company-colour classes outranking utilities.
  Every page was compared with :8002 by pixel diff at 1280px and 390px (and other states); the conventions are in
  `docs/PORTING.md`.
- **Icons:** the same Ionicons, drawn as inline SVG on the server (no pop-in).
- **Forms render and validate, but don't send yet**: contact, sell, credit app, service, inquiry, trade-in and review.
  Each stops at a `// TODO(forms)` with the payload built.
- **Secrets stay out of the code.** The Laravel `Helper.php` hard-codes the JD Power key; here it's `NUXT_JD_API_KEY`
  in the server's environment. The Google Maps browser key is `NUXT_GOOGLE_MAPS_KEY`.

## Consequences

- **Fixed rather than copied** from the Laravel site:
  - the template 2–4 footer brand list (the controller read the wrong key);
  - the home search dropdowns (called the API on the wrong host);
  - inventory filters update the address (back/forward and bookmarks work);
  - the price label after removing a filter.
- **Left out because the Laravel site never shows them:**
  - the vehicle page's hidden legacy block and Similar Vehicles;
  - the footer social icons;
  - the date/time picker on Book Service;
  - a hidden spam link in the privacy/terms map embed.
- **Without the keys:**
  - JD Power lookups answer "not configured": trade-in models, trims and drivetrains, and the sell/service cascades.
  - The credit app's address autocomplete is off.
- **Kept as on :8002, open for a product decision:** template 1's home accent (#6d28d9) and the dealer hours on the
  vehicle page (hidden on :8002).
- **Next:** the form submissions.

## Verification

- `npx nuxt typecheck`: no errors.
- `npx nuxt build`: builds (5.1 MB, 1.4 MB gzip).
- Every page answers 200 (`/view/1`: 404), on all 4 templates.
- The pixel comparisons with :8002 are recorded in each port's report: within a few anti-aliased icon pixels on
  template 1.
