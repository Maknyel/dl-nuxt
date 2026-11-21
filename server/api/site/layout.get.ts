/**
 * GET /api/site/layout: what the frame of every page needs (head, nav, footer): the dealer's company (slimmed),
 * its locations, its template and that template's menu row, plus the year/make list the template 2–4 footers show.
 */
import type { TemplateKey } from '../../utils/site'

export default defineEventHandler(async (event) => {
  // Development only: preview another template with ?template=template-2 (never on a production build).
  const preview = import.meta.dev ? String(getQuery(event).template ?? '') : ''

  const body = await getCompanyData()
  const company = body?.company
  if (!company) {
    throw createError({ statusCode: 502, statusMessage: 'The dealer data could not be loaded from the API.' })
  }

  const { mediaBase } = useRuntimeConfig()

  return {
    template: /^template-[1-4]$/.test(preview) ? (preview as TemplateKey) : templateOf(company),
    templateNav: templateNavOf(company),
    company: slimCompany(company),
    mainCompany: await getMainCompany(company),
    // The Laravel controllers read `get_available_year_limit`, but the API returns `getAvailableYearLimit` (so the
    // template 2–4 footers' brand list was always empty there); both are read here.
    yearLimit: body.getAvailableYearLimit ?? body.get_available_year_limit ?? [],
    seo: parseJson(company.company_seo_settings),
    googleScript: parseJson(company.google_script),
    mediaBase: String(mediaBase),
  }
})
