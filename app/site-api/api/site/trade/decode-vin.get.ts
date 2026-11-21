/**
 * GET /api/site/trade/decode-vin?vin=: a trade-in's VIN decoded by J.D. Power (the Laravel trade VIN decode).
 * `{ status: 'success', data: { …the vehicle, body: its trim, driveTrain } }`, or 404 `{ status: 'vinExists' }` for an
 * unknown VIN. From the API's public website/get/vehicle/trade-vin (its ADR-1135; the key stays on the API).
 */
export default defineEventHandler((event) => {
  const q = getQuery(event)
  const vin = String(q.vin ?? '').trim()
  if (!vin) throw createError({ statusCode: 422, statusMessage: 'The VIN is required.' })
  return apiGetPassthrough(event, 'website/get/vehicle/trade-vin', {
    vin,
    period: String(q.period ?? 0),
    region: String(q.region ?? 8),
  })
})
