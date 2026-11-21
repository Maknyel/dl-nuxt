/**
 * GET /api/site/trade/decode-vin?vin=: the trade-in VIN decode (the Laravel `/decode-vin`, JD Power): the vehicle
 * for the VIN, then its trim and drive type. `{ status: 'success', data: { modelyear, make, model, trim, drivetype, ... } }`.
 */
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const vin = String(q.vin ?? '').trim()
  if (!vin) throw createError({ statusCode: 422, statusMessage: 'The VIN is required.' })
  const period = String(q.period ?? 0)
  const region = String(q.region ?? 8)

  const first = await jdGet(event, '/defaultVehicleAndUsedValuesByVin', { period, vin, region })
  const parsed = first?.result?.[0]
  if (!parsed) {
    setResponseStatus(event, 404)
    return { status: 'vinExists', message: 'VIN not found in JD API.' }
  }
  const body = String(parsed.body ?? '').toLowerCase()
  const driveTrain = ['awd', '4wd', 'fwd', 'rwd'].find((d) => body.includes(d))?.toUpperCase() ?? ''
  if (!parsed.ucgvehicleid) {
    setResponseStatus(event, 400)
    return { status: 'error', message: 'ucgvehicleid not found for this VIN.' }
  }
  const second = await jdGet(event, '/vehicleAndValueByVehicleId', { period, region, ucgvehicleid: String(parsed.ucgvehicleid) })
  const row = second?.result?.[0]
  if (!row) {
    setResponseStatus(event, 404)
    return { status: 'error', message: 'No data returned from vehicleAndValueByVehicleId.' }
  }
  return {
    status: 'success',
    data: { ...parsed, body: row.trim ?? parsed.body ?? '', driveTrain: driveTrain || (row.drivetype ?? '') },
  }
})
