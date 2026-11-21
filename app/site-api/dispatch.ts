/**
 * Runs the site's own routes in the browser (ADR-0002). Each file in ./api/site/ is a route, named as Nuxt named its
 * server routes: `api/site/home.get.ts` answers `/api/site/home`, `api/site/vehicle/[id].get.ts` answers
 * `/api/site/vehicle/:id`. The routes call the Dealer Lion API directly (its CORS allows the dealer sites).
 *
 * A route that sets an error status (setResponseStatus) or throws one is answered with a SiteError, as $fetch throws a
 * FetchError for an error response, so the callers keep their error handling.
 */
import { SiteError, type SiteEvent } from './runtime/h3'

type Handler = (event: SiteEvent) => unknown

interface Route {
  pattern: RegExp
  params: string[]
  handler: Handler
  dynamic: boolean
}

const modules = import.meta.glob<{ default: Handler }>('./api/site/**/*.get.ts', { eager: true })

const routes: Route[] = Object.entries(modules)
  .map(([file, mod]) => {
    // './api/site/vehicle/[id].get.ts' → '/api/site/vehicle/[id]'
    const path = file.replace(/^\./, '').replace(/\.get\.ts$/, '')
    const params: string[] = []
    const source = path
      .split('/')
      .map((part) => {
        const m = /^\[(\w+)\]$/.exec(part)
        if (!m) return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        params.push(m[1]!)
        return '([^/]+)'
      })
      .join('/')
    return { pattern: new RegExp(`^${source}$`), params, handler: mod.default, dynamic: params.length > 0 }
  })
  // Fixed paths first: /api/site/vehicle/dealership-list before /api/site/vehicle/[id].
  .sort((a, b) => Number(a.dynamic) - Number(b.dynamic))

/** True for a URL one of the site's routes answers. */
export function isSiteRoute(url: string): boolean {
  return url.startsWith('/api/site/')
}

/** Runs the route for `url` with `query` (merged over the URL's own query string) and answers its result. */
export async function dispatchSiteRoute<T = any>(url: string, query: Record<string, any> = {}): Promise<T> {
  const parsed = new URL(url, 'http://site.local')
  const path = parsed.pathname.replace(/\/+$/, '')

  const fromUrl: Record<string, any> = {}
  for (const [key, value] of parsed.searchParams) {
    if (key in fromUrl) fromUrl[key] = ([] as unknown[]).concat(fromUrl[key], value)
    else fromUrl[key] = value
  }

  for (const route of routes) {
    const m = route.pattern.exec(path)
    if (!m) continue
    const params: Record<string, string> = {}
    route.params.forEach((name, i) => (params[name] = decodeURIComponent(m[i + 1] ?? '')))

    const event: SiteEvent = { path, query: { ...fromUrl, ...query }, params, statusCode: 200 }
    const result = await route.handler(event)
    if (event.statusCode >= 400) {
      throw new SiteError(event.statusCode, event.statusMessage ?? `Request failed (${event.statusCode})`, result)
    }
    return result as T
  }

  throw new SiteError(404, `No site route for ${path}`)
}
