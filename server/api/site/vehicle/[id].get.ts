/**
 * GET /api/site/vehicle/:id: the vehicle page's data (the Laravel HomeController@show):
 *  - the vehicle from `new-get-company-vehicle-info` (a live call, as the Laravel `ApiHelper::http`), with `has_time`;
 *    `{ vehicle: null }` when the API has no such vehicle (the page then shows Vehicle Not Found with a 404);
 *  - the dealer's hours: the API returns them as `companyhoursDataUpdated`; the Laravel controller read
 *    `companyhours_data_company_id_only_updated` (data-map caveat B), so both are read here.
 *
 * Only what the page renders goes to the browser: the API's row also carries the dealer's cost, margin and invoice
 * price. Not fetched: similar vehicles (the Blade's section is `@if (false)`) and reviews (never supplied: caveat C).
 */

const VEHICLE_FIELDS = [
  'id', 'company_id', 'year', 'make', 'model', 'trim', 'style', 'body_type', 'stock', 'vin_number', 'engine',
  'transmission', 'drivetrain', 'exterior', 'interior', 'mileage', 'internet_price', 'market_average',
  'vehicle_status', 'vehicle_logo', 'fuel', 'doors',
  // View-only flags the Blade reads with a fallback (not in the API today).
  'clean_title', 'non_smoker', 'well_maintained', 'special_tag', 'special_price_label', 'listing_label',
  'monthly_payment',
] as const

const FEATURE_FIELDS = ['image_urls', 'features', 'description', 'meta_title', 'meta_description', 'meta_keywords'] as const
const COMPANY_FIELDS = ['id', 'name', 'street_address', 'city', 'state', 'zip_code', 'dl_website', 'phone_number'] as const

function pick<T extends Record<string, any>>(row: T | null | undefined, keys: readonly string[]): Record<string, any> | null {
  if (!row || typeof row !== 'object') return null
  const out: Record<string, any> = {}
  for (const k of keys) if (k in row) out[k] = row[k]
  return out
}

export default defineEventHandler(async (event) => {
  const id = String(getRouterParam(event, 'id') ?? '').trim()
  if (!id) return { vehicle: null, hours: [] }

  let body: Record<string, any>
  try {
    body = await apiPost<Record<string, any>>(
      'websitetemplate/new-get-company-vehicle-info',
      baseArgs({ vehicle_id: id, has_time: true }),
    )
  } catch (error: any) {
    // The API answered with an error (or not at all): the Laravel controller shows its error page (500).
    throw createError({ statusCode: 502, statusMessage: 'The vehicle could not be loaded from the Dealer Lion API.' })
  }

  const frontend = body?.frontend
  if (!frontend || (typeof frontend === 'object' && Object.keys(frontend).length === 0)) {
    return { vehicle: null, hours: [] }
  }

  const vehicle = pick(frontend, VEHICLE_FIELDS)!
  vehicle.features = pick(frontend.features, FEATURE_FIELDS)
  vehicle.company = pick(frontend.company, COMPANY_FIELDS)

  const hours = body.companyhoursDataUpdated ?? body.companyhours_data_company_id_only_updated ?? []

  return { vehicle, hours: Array.isArray(hours) ? hours : [] }
})
