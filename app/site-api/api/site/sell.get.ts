/**
 * GET /api/site/sell: the Sell Us Your Car page's own data (the Laravel HomeController@sell's second call,
 * `websitetemplate/get-sell-us-your-car-data`, a live call as its `ApiHelper::http`): `{ staticMake: [{ id, code, title }] }`.
 *
 * The Laravel controller passes it to the view as `data.staticmake`; the current form (global/sell/form.blade.php)
 * doesn't render it (its makes come from the browser's saleable-makes call, /api/site/trade/makes here). A failed call
 * gives an empty list, as the controller's catch does; the page renders either way.
 */
export default defineEventHandler(async () => {
  try {
    const body = await apiPost<{ static_make?: any[] }>('websitetemplate/get-sell-us-your-car-data', baseArgs({ is_sell: true }))
    const rows = Array.isArray(body?.static_make) ? body.static_make : []
    return { staticMake: rows.map((m: any) => ({ id: m?.id, code: m?.code, title: m?.title })) }
  } catch {
    return { staticMake: [] as { id: number; code: string; title: string }[] }
  }
})
