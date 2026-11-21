/**
 * The Dealer Lion API, called from the Nuxt server only (the browser never sees the API's address). A port of the
 * Laravel site's ApiHelper (its ADR-0170 / ADR-0172):
 *
 *  - `apiPost`: one live call, `POST {apiBase}/api/v2/{endpoint}`.
 *  - `apiCached`: the answers every page needs (the company's data, its main company, its group), kept up to
 *    CACHE_TTL_SECONDS. The key carries the dealer's data version (`siteVersion`, the API's ADR-1133), asked at most
 *    every VERSION_CHECK_SECONDS: a settings save or a vehicle change makes a new version, so new keys, so fresh
 *    answers on the next page view. No version (API down, or older than the endpoint) = every call live.
 *
 * The cache is this server process's memory: one dealer per site, a handful of keys.
 */

const CACHE_TTL_SECONDS = 600
const VERSION_CHECK_SECONDS = 15
const API_TIMEOUT_MS = 15000

interface Entry<T> {
  value: T
  expires: number
}

const cache = new Map<string, Entry<unknown>>()
const inflight = new Map<string, Promise<unknown>>()

function getEntry<T>(key: string): T | undefined {
  const hit = cache.get(key)
  if (!hit) return undefined
  if (hit.expires < Date.now()) {
    cache.delete(key)
    return undefined
  }
  return hit.value as T
}

function putEntry<T>(key: string, value: T, ttlSeconds: number): void {
  cache.set(key, { value, expires: Date.now() + ttlSeconds * 1000 })
  // Old versions' keys are never read again; drop the expired ones now and then.
  if (cache.size > 200) {
    const now = Date.now()
    for (const [k, e] of cache) if (e.expires < now) cache.delete(k)
  }
}

export function apiUrl(endpoint: string): string {
  const { apiBase } = useRuntimeConfig()
  return `${String(apiBase).replace(/\/+$/, '')}/api/v2/${endpoint.replace(/^\/+/, '')}`
}

export function companyId(): number {
  return Number(useRuntimeConfig().companyId)
}

/** One live call to the API. */
export function apiPost<T = any>(endpoint: string, args: Record<string, unknown> = {}): Promise<T> {
  // An external URL: ofetch's plain $fetch, not Nitro's typed internal one.
  return ($fetch as unknown as (url: string, opts: Record<string, unknown>) => Promise<T>)(apiUrl(endpoint), {
    method: 'POST',
    body: args,
    timeout: API_TIMEOUT_MS,
    headers: { Accept: 'application/json' },
  })
}

/** The dealer's data version, asked at most every VERSION_CHECK_SECONDS; null when the API can't say. */
export async function siteVersion(): Promise<string | null> {
  const known = getEntry<string>('site:api-version')
  if (known !== undefined) return known === '' ? null : known

  let version = ''
  try {
    const res = await $fetch<{ version?: unknown }>(apiUrl('websitetemplate/site-version'), {
      method: 'POST',
      body: { company_id: companyId() },
      timeout: 3000,
    })
    if (typeof res?.version === 'string') version = res.version
  } catch {
    // The API is unreachable or doesn't have the endpoint yet: answer live (version stays '').
  }
  putEntry('site:api-version', version, VERSION_CHECK_SECONDS)
  return version === '' ? null : version
}

/** The API's answer, cached by the dealer's version (see the top of this file). Only a successful answer is kept. */
export async function apiCached<T = any>(
  endpoint: string,
  args: Record<string, unknown> = {},
  ttlSeconds = CACHE_TTL_SECONDS,
): Promise<T> {
  const version = await siteVersion()
  if (version === null) return apiPost<T>(endpoint, args)

  const key = `site:api:${version}:${endpoint}:${JSON.stringify(args)}`
  const hit = getEntry<T>(key)
  if (hit !== undefined) return hit

  // Several requests at once for the same answer share one call.
  const pending = inflight.get(key) as Promise<T> | undefined
  if (pending) return pending

  const call = apiPost<T>(endpoint, args)
    .then((value) => {
      putEntry(key, value, ttlSeconds)
      return value
    })
    .finally(() => inflight.delete(key))
  inflight.set(key, call)
  return call
}
