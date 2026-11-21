/**
 * This dealer site's settings, from `config.json` next to index.html, read once when the page loads (main.ts), so one
 * build serves every dealer (ADR-0002). The same shape the Nuxt project's runtimeConfig had.
 */
export interface SiteRuntimeConfig {
  /** 'client' (Dealer Config's website, the Laravel :8002) or 'sales' (Dealer CRM's, :8003). */
  siteType: string
  clientCompanyId: string
  clientCompanyName: string
  salesCompanyId: string
  salesCompanyName: string
  /** Serve another dealer whatever the type; empty = the type's own. */
  companyId: string
  companyName: string
  /** The Dealer Lion API (the Laravel sites' URL_API_CORE). */
  apiBase: string
  /** Where the dealer's logos and photos are served from, ending in / (MAIN_WEBSITE_URL). */
  mediaBase: string
  /** Force template-1 .. template-4; empty = the dealer's own. */
  templateOverride: string
  /** Google Maps JavaScript key (a browser key: restrict it to the site's domains). Empty = no address autocomplete. */
  googleMapsKey: string
}

const DEFAULTS: SiteRuntimeConfig = {
  siteType: 'client',
  clientCompanyId: '5022',
  clientCompanyName: 'Dealer Lion Demo - Single',
  salesCompanyId: '5026',
  salesCompanyName: 'Sales Template Live Demo1',
  companyId: '',
  companyName: '',
  apiBase: 'http://localhost:8001',
  mediaBase: 'http://localhost:8000/',
  templateOverride: '',
  googleMapsKey: '',
}

let current: SiteRuntimeConfig = { ...DEFAULTS }

/** Reads `config.json` (main.ts, before the app mounts). A missing or unreadable file keeps the local defaults. */
export async function loadRuntimeConfig(): Promise<SiteRuntimeConfig> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}config.json`, { cache: 'no-store' })
    if (res.ok) {
      const json = (await res.json()) as Partial<Record<keyof SiteRuntimeConfig, unknown>>
      const next = { ...DEFAULTS }
      for (const key of Object.keys(DEFAULTS) as (keyof SiteRuntimeConfig)[]) {
        if (json[key] !== undefined && json[key] !== null) next[key] = String(json[key])
      }
      current = next
    }
  } catch {
    // Keep the defaults.
  }
  return current
}

/** The settings (Nuxt's useRuntimeConfig, as the site's routes call it). */
export function useRuntimeConfig(_event?: unknown): SiteRuntimeConfig {
  return current
}
