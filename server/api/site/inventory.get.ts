/**
 * GET /api/site/inventory?<the inventory page's query string>: the /pre-owned-cars data (the Laravel
 * HomeController@searchLive / searchLivePartial + mapConsolidatedSearchData). Takes the same query string as the page
 * (make[]=, body_type[]=, internet_price_from, page, sort_by, search, qbt[], ...), sends it to
 * `websitetemplate/search-vehicles-consolidated` as `get` (the controller's `$request->all()`), and returns the
 * vehicles, counts, facets and paging as JSON instead of the HTML partials.
 *
 * The vehicle rows are cut down to what the page shows (the API row also carries cost, margin and the description).
 */

/** `$request->all()`: `make[]=a&make[]=b` → make: ['a', 'b']; `x=` → null (Laravel's ConvertEmptyStringsToNull). */
function laravelQuery(query: Record<string, unknown>): Record<string, unknown> {
  const get: Record<string, unknown> = {}
  for (const [rawKey, raw] of Object.entries(query)) {
    const values = (Array.isArray(raw) ? raw : [raw]).map((v) => (v === undefined || v === null ? '' : String(v)))
    const arrayKey = /^(.+)\[(\d*)\]$/.exec(rawKey)
    if (arrayKey) {
      // `x[]=` and `x[0]=` (http_build_query's form) both make the array x.
      const prev = Array.isArray(get[arrayKey[1]!]) ? (get[arrayKey[1]!] as unknown[]) : []
      get[arrayKey[1]!] = [...prev, ...values.map((v) => (v === '' ? null : v))]
    } else {
      const v = values[values.length - 1] ?? ''
      get[rawKey] = v === '' ? null : v
    }
  }
  return get
}

const VEHICLE_FIELDS = [
  'id',
  'company_id',
  'year',
  'make',
  'model',
  'trim',
  'vin_number',
  'stock',
  'stock_number',
  'body_type',
  'drivetrain',
  'transmission',
  'engine',
  'exterior',
  'interior',
  'internet_price',
  'mileage',
  'vehicle_status',
  'vehicle_logo',
  'special_tag',
  'listing_label',
  'badge',
  'monthly_payment',
] as const

function slimVehicle(row: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {}
  for (const key of VEHICLE_FIELDS) if (key in row) out[key] = row[key]
  out.features = row.features ? { image_urls: row.features.image_urls ?? '' } : null
  if (row.company && typeof row.company === 'object') out.company = { name: row.company.name ?? null }
  return out
}

const list = (v: unknown): any[] => (Array.isArray(v) ? v : [])

export default defineEventHandler(async (event) => {
  const get = laravelQuery(getQuery(event) as Record<string, unknown>)
  const page = get.page ?? ''

  const body = await getCompanyData().catch(() => null)
  const company = body?.company
  if (!company) throw createError({ statusCode: 404, statusMessage: 'Company not found' })

  let search: Record<string, any> = {}
  try {
    search = await apiPost<Record<string, any>>('websitetemplate/search-vehicles-consolidated', {
      company_name: baseArgs().company_name,
      company_id: Number(company.id),
      get,
      page,
    })
  } catch {
    // searchLive renders the page with no vehicles; the partial answers 500. The page shows its Retry line.
    throw createError({ statusCode: 502, statusMessage: 'Failed to load vehicle data' })
  }

  const inv = search?.inventory_data ?? {}
  const rows = list(Array.isArray(inv) ? inv : inv.data)

  return {
    vehicles: rows.map(slimVehicle),
    paging: {
      current_page: Number(inv.current_page ?? get.page ?? 1) || 1,
      last_page: Number(inv.last_page ?? 1) || 1,
      per_page: Number(inv.per_page ?? 12) || 12,
      total: Number(inv.total ?? 0) || 0,
    },
    inventory_data_count: Number(search?.inventory_data_count ?? 0) || 0,
    inventory_all_data_count: Number(search?.inventory_all_data_count ?? 0) || 0,
    get: search?.get && !Array.isArray(search.get) ? search.get : get,
    filters: {
      getavailabletransmission: list(search?.getavailabletransmission),
      getavailableyear: list(search?.getavailableyear),
      getavailablemake: list(search?.getavailablemake),
      getavailablemodel: list(search?.getavailablemodel),
      getavailabletrim: list(search?.getavailabletrim),
      vehiclebodytype: list(search?.vehiclebodytype),
      getavailabledrivetrain: list(search?.getavailabledrivetrain),
      getavailableexterior: list(search?.getavailableexterior),
      getavailableinterior: list(search?.getavailableinterior),
      getavailableinternetprice: list(search?.getavailableinternetprice),
      getavailablemileage: list(search?.getavailablemileage),
      getavailablecompanies: list(search?.getavailablecompanies),
    },
    under_20k_count: Number(search?.under_20k_count ?? 0) || 0,
    unfiltered_body_type_counts: list(search?.unfiltered_body_type_counts),
  }
})
