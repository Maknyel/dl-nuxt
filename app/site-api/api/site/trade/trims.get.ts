/**
 * GET /api/site/trade/trims?modelyear=&make=&model=: a make / model / year's trims (J.D. Power).
 * `{ status: 'success', result: [{ label, value, ucgvehicleid, drivetype }] }`, from the API's public
 * website/get/vehicle/trims (its ADR-1135; the J.D. Power key stays on the API).
 */
export default defineEventHandler((event) => {
  const q = getQuery(event)
  return apiGetPassthrough(event, 'website/get/vehicle/trims', {
    modelyear: String(q.modelyear ?? ''),
    make: String(q.make ?? ''),
    model: String(q.model ?? ''),
    period: String(q.period ?? 0),
    region: String(q.region ?? 8),
  })
})
