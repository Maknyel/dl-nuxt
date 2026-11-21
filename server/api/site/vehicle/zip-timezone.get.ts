/**
 * GET /api/site/vehicle/zip-timezone?zip=: a zip's timezone, city, state and region for the sales site's Dealer Info
 * address (the sales Laravel route `/frontend/zip-timezone`, a pass-through of
 * `GET {API}/api/v2/websitetemplate/zip-timezone?zip=`). Sales site only: 404 on the client site.
 */
export default defineEventHandler(async (event) => {
  if (siteType() !== 'sales') throw createError({ statusCode: 404 })

  const zip = String(getQuery(event).zip ?? '').trim()
  try {
    const res = await ($fetch as unknown as (url: string, opts: Record<string, unknown>) => Promise<any>)(
      apiUrl('websitetemplate/zip-timezone'),
      { method: 'GET', query: { zip }, timeout: 15000, headers: { Accept: 'application/json' } },
    )
    return {
      timezone: res?.timezone ?? null,
      city: res?.city ?? null,
      state: res?.state ?? null,
      region: res?.region ?? null,
    }
  } catch {
    return { timezone: null, city: null, state: null, region: null }
  }
})
