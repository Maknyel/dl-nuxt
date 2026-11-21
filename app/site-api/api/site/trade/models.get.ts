/**
 * GET /api/site/trade/models?make=&modelyear=: the trade-in and vehicle forms' models (the Laravel `/fetch-models`,
 * J.D. Power). `{ status: 'success', result: [{ model }] }`, from the API's public website/get/vehicle/models (the
 * J.D. Power key stays on the API).
 */
export default defineEventHandler((event) => {
  const q = getQuery(event)
  return apiGetPassthrough(event, 'website/get/vehicle/models', {
    make: String(q.make ?? ''),
    modelyear: String(q.modelyear ?? ''),
    period: String(q.period ?? 0),
    vehicletype: String(q.vehicletype ?? 'UsedCar'),
  })
})
