/**
 * GET /api/site/finance[?vehicle_id=]: the credit application's data (the Laravel HomeController@finance, which renders
 * `new_finance`):
 *  - `staticmake`: the trade-in step's makes, from `websitetemplate/get-sell-us-your-car-data` (a live call, as the
 *    Laravel `ApiHelper::http`), only `id` and `title` (all the page reads);
 *  - `vehicleLocationId`: for a Multi dealer opened with ?vehicle_id (the vehicle page's link), the vehicle's store,
 *    which the page pre-selects and locks; null otherwise or when the lookup fails (the store stays selectable).
 *
 * The company and its locations come from the layout's data (useSite()), as on every page.
 */
export default defineEventHandler(async (event) => {
  const vehicleId = String(getQuery(event).vehicle_id ?? '').trim()

  let staticmake: { id: number | string; title: string }[] = []
  try {
    const sell = await apiPost<{ static_make?: any[] }>('websitetemplate/get-sell-us-your-car-data', baseArgs({ is_sell: true }))
    staticmake = (Array.isArray(sell?.static_make) ? sell.static_make : [])
      .filter((m) => m && m.title != null)
      .map((m) => ({ id: m.id, title: String(m.title) }))
  } catch {
    // No makes: the Make select shows only its placeholder (the Laravel `?? []`).
  }

  let vehicleLocationId: number | null = null
  // The sales site's controller has no vehicleLocationId (its finance page never pre-selects the store).
  if (vehicleId && siteType() !== 'sales') {
    try {
      const company = (await getCompanyData())?.company
      if (company && company.account_type === 'Multi') {
        const res = await apiPost<{ frontend?: Record<string, any> }>('websitetemplate/new-get-company-vehicle-info', {
          vehicle_id: vehicleId,
          company_id: company.id,
          company_name: company.name,
        })
        const id = Number.parseInt(String(res?.frontend?.company_id ?? ''), 10)
        if (id) vehicleLocationId = id
      }
    } catch {
      // Silently skipped, as the Laravel controller does: the store location remains selectable.
    }
  }

  return { staticmake, vehicleLocationId }
})
