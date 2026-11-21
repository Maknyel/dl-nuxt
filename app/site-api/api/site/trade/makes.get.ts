/**
 * GET /api/site/trade/makes: the trade-in form's makes (the Laravel page's browser call to
 * `{URL_API_CORE}/api/v2/website/get/vehicle/saleable-makes`), through the server so the browser never sees the API.
 * `{ saleableMakes: [{ id, code, title }] }`.
 */
export default defineEventHandler(async () => {
  const res = await ($fetch as unknown as (url: string, opts: Record<string, unknown>) => Promise<any>)(
    apiUrl('website/get/vehicle/saleable-makes'),
    { method: 'GET', timeout: 15000, headers: { Accept: 'application/json' } },
  )
  return { saleableMakes: Array.isArray(res?.saleableMakes) ? res.saleableMakes : [] }
})
