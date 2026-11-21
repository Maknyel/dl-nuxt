/**
 * GET /api/site/vehicle/dealership-list: the dealerships the sales site's "Dealer Info" typeahead searches (the sales
 * Laravel route `/frontend/dealership-list`, a pass-through of `GET {API}/api/v2/sales-template/dealership-list`).
 *
 * Sales site only (the client site has no Dealer Info): 404 there. Only the fields the typeahead reads go out.
 */
export default defineEventHandler(async () => {
  if (siteType() !== 'sales') throw createError({ statusCode: 404 })

  let rows: any = []
  try {
    rows = await ($fetch as unknown as (url: string, opts: Record<string, unknown>) => Promise<any>)(
      apiUrl('sales-template/dealership-list'),
      { method: 'GET', timeout: 15000, headers: { Accept: 'application/json' } },
    )
  } catch {
    // The Blade's fetch catches it and searches an empty list.
    return []
  }
  const list: any[] = Array.isArray(rows) ? rows : Array.isArray(rows?.data) ? rows.data : []
  return list
    .filter((d) => d && typeof d === 'object')
    .map((d) => ({
      dealership_id: d.dealership_id ?? '',
      dealership_name: d.dealership_name ?? '',
      dealership_address: d.dealership_address ?? '',
      dealership_city: d.dealership_city ?? '',
      dealership_state: d.dealership_state ?? '',
      dealership_zip: d.dealership_zip ?? '',
    }))
})
