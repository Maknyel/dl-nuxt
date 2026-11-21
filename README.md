# dealer-lion-client-templates-nuxt

The dealer website (the Laravel `dealer-lion-client-templates` site, :8002) rebuilt in Nuxt 4 + Tailwind CSS 4.

## Requirements

- Node.js 20 or newer (built with Node 24) and npm.
- The Dealer Lion API running (locally: `http://localhost:8001`).

## First time

```bash
cd C:\dev\dealer-lion-client-templates-nuxt
npm install
```

## Run it

```bash
npm run dev
```

Then open http://localhost:3002.

## Settings

Locally nothing needs setting: `nuxt.config.ts` defaults to the local API (`http://localhost:8001`) and the demo dealer
(5022). To change them, copy `.env.example` to `.env` and edit:

| Setting | What it is | Laravel site's equivalent |
|---|---|---|
| `NUXT_API_BASE` | The Dealer Lion API | `URL_API_CORE` |
| `NUXT_COMPANY_ID` | The dealer this site serves | `COMPANY_ID_ENV` |
| `NUXT_MEDIA_BASE` | Where the dealer's logo and photos come from | `MAIN_WEBSITE_URL` |
| `NUXT_TEMPLATE_OVERRIDE` | Force a template (`template-1`..`template-4`) | `CURRENT_TEMPLATE` |

## Other commands

| Command | Does |
|---|---|
| `npm run build` | Production build into `.output/` |
| `npm run preview` | Runs the production build locally |
| `npm run typecheck` | TypeScript check |

## Deploying

`npm run build`, then on the server run `node .output/server/index.mjs` (Node 20+), with the settings above set as
environment variables. It listens on port 3000 by default (`PORT` changes it).

## Where things are

- `app/pages/`: the pages (home, inventory, vehicle, sell, finance, services, about, contact, privacy, terms).
- `app/components/`: the sections, one folder per template, plus shared ones.
- `server/api/site/`: the page data, fetched from the Dealer Lion API on the server.
- `server/utils/dealerApi.ts`: the API calls and their cache (refreshed within ~15s of a settings save).
- `docs/adr/`: the decisions.
