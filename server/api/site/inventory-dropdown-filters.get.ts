/**
 * GET /api/site/inventory-dropdown-filters?body_type=&make=&model=: the template-1 home search widget's cascading
 * dropdowns (makes, models, trims, bodyTypes for the current choice). The Laravel widget calls the API's
 * `websitetemplate/inventory-dropdown-filters` from the browser (on MAIN_WEBSITE_URL, which 404s locally); here the
 * Nuxt server calls it for the dealer this site serves. The API route is GET only, so this is a GET, not apiPost.
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const pick = (key: string) => (typeof query[key] === 'string' && query[key] ? (query[key] as string) : undefined)

  const params: Record<string, string> = { company_id: String(companyId()) }
  for (const key of ['body_type', 'make', 'model']) {
    const value = pick(key)
    if (value) params[key] = value
  }

  try {
    const res = await ($fetch as unknown as (url: string, opts: Record<string, unknown>) => Promise<Record<string, any>>)(
      apiUrl('websitetemplate/inventory-dropdown-filters'),
      { method: 'GET', query: params, timeout: 15000, headers: { Accept: 'application/json' } },
    )
    const list = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => String(x)) : [])
    return {
      makes: list(res?.makes),
      models: list(res?.models),
      trims: list(res?.trims),
      bodyTypes: list(res?.bodyTypes),
    }
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'Inventory filters unavailable' })
  }
})
