/**
 * What every page needs: the dealer's company data, its locations and its template. A port of the Laravel site's
 * per-page start (HomeController: `new-get-company-data-optimized`, then the "main company" step, then
 * `myCurrentTemplate()`), done once on the server and cached (dealerApi.ts).
 */

export type TemplateKey = 'template-1' | 'template-2' | 'template-3' | 'template-4'

export interface CompanyDataResponse {
  company?: Record<string, any>
  reviews?: any[]
  vehicles?: any[]
  getAvailableYearLimit?: any[]
  get_available_year_limit?: any[]
  [key: string]: any
}

export function baseArgs(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return { company_name: companyName(), company_id: String(companyId()), ...extra }
}

/** `new-get-company-data-optimized` (every page). */
export function getCompanyData(extra: Record<string, unknown> = {}): Promise<CompanyDataResponse> {
  return apiCached<CompanyDataResponse>('websitetemplate/new-get-company-data-optimized', baseArgs({ is_sell: true, ...extra }))
}

/** The Laravel site's "main company" step: the dealer's locations (a group's sites), else none. */
export async function getMainCompany(company: Record<string, any> | undefined): Promise<any[]> {
  if (!company) return []
  try {
    if (Number(company.is_main) === 1) {
      const res = await apiCached<{ company?: any[] }>('websitetemplate/new-get-company-info-main', baseArgs())
      return Array.isArray(res?.company) ? res.company : []
    }
    // The sales site (dealerlion_sales_template) has no sequence-group step: only a main company lists locations.
    if (siteType() !== 'sales' && String(company.sequence_id ?? '').includes('-')) {
      const res = await apiCached<{ company?: any[] }>('websitetemplate/get-company-sequence-group', baseArgs())
      return Array.isArray(res?.company) ? res.company : []
    }
  } catch {
    // No location list: the pages fall back to the company itself, as the Laravel site does with [].
  }
  return []
}

/** `myCurrentTemplate()`: the dealer's `template` (template_1 → template-1), or the local override. */
export function templateOf(company: Record<string, any> | undefined): TemplateKey {
  const override = String(useRuntimeConfig().templateOverride || '')
  if (/^template-[1-4]$/.test(override)) return override as TemplateKey
  const m = /^template_([1-4])$/.exec(String(company?.template ?? ''))
  return (m ? `template-${m[1]}` : 'template-1') as TemplateKey
}

/** The `template_nav` row for the dealer's template: which menu links and home sections show. */
export function templateNavOf(company: Record<string, any> | undefined): Record<string, any> {
  const rows: any[] = Array.isArray(company?.template_nav) ? company!.template_nav : []
  return rows.find((r) => String(r?.template_id) === String(company?.template)) ?? rows[0] ?? {}
}

/**
 * The company without what no page renders from it: `pre_define.services` is ~1.9 MB (inline images); the services
 * page reads its own endpoint. Everything else is ~20 KB.
 */
export function slimCompany(company: Record<string, any> | undefined): Record<string, any> {
  if (!company) return {}
  const { pre_define, ...rest } = company
  if (!pre_define || typeof pre_define !== 'object') return rest
  const { services: _services, ...preDefine } = pre_define as Record<string, any>
  return { ...rest, pre_define: preDefine }
}

/** JSON-string fields the API returns as text (SEO settings, Google scripts). */
export function parseJson<T = Record<string, any>>(value: unknown): T | null {
  if (value && typeof value === 'object') return value as T
  if (typeof value !== 'string' || value.trim() === '') return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}
