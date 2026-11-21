/**
 * GET /api/site/home: the home page's data (the Laravel HomeController@index):
 *  - reviews (first 3) and vehicles (first 6) from new-get-company-data-optimized (cached, shared with the layout);
 *  - the search / budget / category filters from new-search-company-vehicles;
 *  - for a Multi dealer, its locations with their vehicle counts (get-available-companies);
 *  - requestcurrentHeroImage (?currentHeroImage=, the hero editor's preview).
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const body = await getCompanyData()
  const company = body?.company ?? {}

  const [filters, companies] = await Promise.all([
    apiCached<Record<string, any>>('websitetemplate/new-search-company-vehicles', baseArgs({ get: [] })).catch(
      () => ({}) as Record<string, any>,
    ),
    company.account_type === 'Multi'
      ? apiCached<{ companies?: any[] }>('websitetemplate/get-available-companies', { company_id: String(companyId()) })
          .then((r) => r?.companies ?? [])
          .catch(() => [])
      : Promise.resolve([]),
  ])

  return {
    reviews: (body.reviews ?? []).slice(0, 3),
    vehicles: (body.vehicles ?? []).slice(0, 6),
    requestcurrentHeroImage: String(query.currentHeroImage ?? ''),
    // The Laravel controller's `$data` for the home sections.
    data: {
      getavailablemake: filters.getavailablemake ?? [],
      getavailablemodel: filters.getavailablemodel ?? [],
      getavailabletrim: filters.getavailabletrim ?? [],
      getavailabledrivetrain: filters.getavailabledrivetrain ?? [],
      vehiclebodytype: filters.vehiclebodytype ?? [],
      getavailableinternetprice: filters.getavailableinternetprice ?? [],
      getavailableyear: filters.getavailableyear ?? [],
      getavailablemileage: filters.getavailablemileage ?? [],
      under_20k_count: filters.unfiltered_under_20k_count ?? 0,
      unfiltered_body_type_counts: filters.unfiltered_body_type_counts ?? [],
      getavailablecompanies: companies,
    },
  }
})
