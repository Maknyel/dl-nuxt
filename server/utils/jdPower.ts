import type { H3Event } from 'h3'

/**
 * JD Power's valuation API (the Laravel site's `storedJDApiUrl()` / `storedJDApiKey()`), for the trade-in form's
 * models, trims and VIN decode (server/api/site/trade/*). The key is a secret: it comes from the server's environment
 * (runtimeConfig jdApiKey = NUXT_JD_API_KEY, and jdApiUrl = NUXT_JD_API_URL for the UAT / production base), never from
 * the code. Without it the calls answer 503 and the form shows its "Failed to load ..." state, as the Laravel form does
 * when the call fails.
 */
export async function jdGet(event: H3Event, path: string, query: Record<string, string>): Promise<any> {
  const { jdApiKey, jdApiUrl } = useRuntimeConfig(event)
  const key = String(jdApiKey || '')
  const base = String(jdApiUrl || 'https://cloud.jdpower.ai/data-api/valuationservices/valuation')
  if (!key) throw createError({ statusCode: 503, statusMessage: 'The JD Power API is not configured (NUXT_JD_API_KEY).' })
  return ($fetch as unknown as (url: string, opts: Record<string, unknown>) => Promise<any>)(
    `${base.replace(/\/+$/, '')}${path}`,
    { method: 'GET', query, timeout: 15000, headers: { 'api-key': key, Accept: 'application/json' } },
  )
}
