# dealer-lion-client-templates-nuxt

The dealer website (the Laravel `dealer-lion-client-templates` site, :8002, and `dealerlion_sales_template`, :8003) as a
**Vue 3 + Vite + Tailwind CSS 4** single-page app. It builds to static files and deploys like the monolith frontend:
no Node.js on the server. (It started as a Nuxt project, hence the folder name; see docs/adr/ADR-0002.)

## Requirements

- Node.js 20 or newer (built with Node 24) and npm, to build.
- The Dealer Lion API running (locally: `http://localhost:8001`).

## First time

```bash
cd C:\dev\dealer-lion-client-templates-nuxt
npm install
copy public\config.example.json public\config.json
```

## Run it

```bash
npm run dev
```

Then open http://localhost:3002. In development, `?template=template-2` (to `-4`) on any address previews another
template.

## Settings: `config.json`

Each dealer's settings are in **`config.json` next to `index.html`** (locally `public/config.json`, on a server
`dist/config.json` after upload). It's read when the page loads, so **one build serves every dealer**: change the file,
refresh, done. No rebuild.

| Setting | What it is | Laravel site's equivalent |
|---|---|---|
| `siteType` | `client` (Dealer Config's website, like :8002) or `sales` (Dealer CRM's, like :8003) | which project |
| `clientCompanyId`, `clientCompanyName` | The client site's dealer | `COMPANY_ID_ENV`, `COMPANY_INFO` |
| `salesCompanyId`, `salesCompanyName` | The sales site's dealer | `COMPANY_ID_ENV`, `COMPANY_INFO` |
| `companyId`, `companyName` | Optional: another dealer whatever the type; empty = the type's own | |
| `apiBase` | The Dealer Lion API | `URL_API_CORE` |
| `mediaBase` | Where the dealer's logo and photos come from, ending in `/` | `MAIN_WEBSITE_URL` |
| `templateOverride` | Force a template (`template-1`..`template-4`); empty = the dealer's own | `CURRENT_TEMPLATE` |
| `googleMapsKey` | Address autocomplete on the credit app. A browser key: restrict it to the site's domains in Google Cloud | `googleApiKey()` |

Everything in `config.json` is visible to visitors (it's a public file), so it holds no secrets. The J.D. Power key
stays on the Dealer Lion API.

## Other commands

| Command | Does |
|---|---|
| `npm run build` | Type check, then the production build into `dist/` |
| `npm run preview` | Serves `dist/` locally on :3002 |
| `npm run typecheck` | TypeScript check only |

## Deploying

1. `npm run build` (or, on the server: `git pull`, `npm ci`, `npm run build`).
2. Point the dealer's domain at the `dist/` folder, like the monolith frontend's `dist/`.
3. Edit `dist/config.json` with that dealer's values (or keep a copy outside and copy it in after each build).
4. Every page address must serve `index.html`:
   - **Apache:** `dist/.htaccess` already does it (needs `mod_rewrite`).
   - **Nginx:** `location / { try_files $uri $uri/ /index.html; }`

The API must allow the site's domain in its CORS settings (`config/cors.php`): `*.dealerlion.com` and localhost are
already allowed.

## Where things are

- `app/main.ts`: reads `config.json`, loads the dealer's data, mounts the app. `app/router.ts`: the pages' addresses.
- `app/pages/`: the pages (home, inventory, vehicle, sell, finance, services, about, contact, privacy, terms).
- `app/components/`: the sections, one folder per template, plus shared ones.
- `app/site-api/`: the site's data routes (`/api/site/...`), run in the browser; they call the Dealer Lion API directly
  (`utils/dealerApi.ts`: the calls and their cache, refreshed within ~15s of a settings save).
- `app/shims/nuxt.ts`: the Nuxt helpers the components were written with (`$fetch`, `useFetch`, `useState`, …).
- `docs/adr/`: the decisions. `docs/PORTING.md`: how a Blade view becomes a component here.
