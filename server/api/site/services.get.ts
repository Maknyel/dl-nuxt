/**
 * GET /api/site/services: the Book Service page's data (the Laravel HomeController@services):
 *  - `services`: the dealer's services from `new-get-company-service` (`body.service`), for the service dropdown;
 *  - `makes`: the make list from the same answer (`body.staticMake`, camelCase here), for the Make select.
 *
 * A live call, as the Laravel `ApiHelper::http`; when it fails the page still renders with empty lists (the Laravel
 * controller catches the error and passes `[]`). Only the fields the form renders go to the browser: the page doesn't
 * use `company.pre_define.services.bookServices` (the ~1.9 MB of inline images the layout data strips), nor the
 * services' descriptions and images.
 */

interface ServiceRow {
  id: number | string
  title: string
}

interface MakeRow {
  id: number | string
  title: string
}

export default defineEventHandler(async () => {
  let body: Record<string, any> = {}
  try {
    body = await apiPost<Record<string, any>>('websitetemplate/new-get-company-service', baseArgs({ is_sell: true }))
  } catch {
    // The Laravel controller logs it and renders the form with no services and no makes.
  }

  const services: ServiceRow[] = (Array.isArray(body?.service) ? body.service : [])
    .filter((s: any) => s && typeof s === 'object')
    .map((s: any) => ({ id: s.id, title: String(s.title ?? '') }))

  const makes: MakeRow[] = (Array.isArray(body?.staticMake) ? body.staticMake : [])
    .filter((m: any) => m && typeof m === 'object')
    .map((m: any) => ({ id: m.id, title: String(m.title ?? '') }))

  return { services, makes }
})
