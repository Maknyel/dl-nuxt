/**
 * GET /api/site/trade/drivetrain?vehicleID=: the drive types of a JD Power vehicle (the Laravel `/drivetrain-dropdown`),
 * for every form that picks one once a trim is chosen: Sell Us Your Car, Book Service and the credit application's
 * trade-in step. Answers as the Laravel route does:
 *  - `{ status: 'success', data: [{ drivetype }] }` (only the drive type: JD Power's valuations stay on the server);
 *  - 422 without a numeric vehicleID; 404 `{ status: 'error' }` when JD Power has none; 500 when the call fails;
 *  - 503 when the JD Power key isn't set on this server (server/utils/jdPower.ts).
 */
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const vehicleID = String(q.vehicleID ?? '').trim()
  if (!/^\d+$/.test(vehicleID)) {
    setResponseStatus(event, 422)
    return { message: 'The vehicle i d field is required.', errors: { vehicleID: ['The vehicle i d field is required.'] } }
  }

  let res: any
  try {
    res = await jdGet(event, '/usedValuesAndVehicleByVehicleId', {
      period: String(q.period ?? 0),
      ucgvehicleid: vehicleID,
      region: String(q.region ?? 8),
    })
  } catch (error: any) {
    if (error?.statusCode === 503) throw error
    setResponseStatus(event, 500)
    return { status: 'error', message: 'Unable to fetch drivetrain data' }
  }

  const rows = Array.isArray(res?.result) ? res.result : []
  if (!rows.length) {
    setResponseStatus(event, 404)
    return { status: 'error', message: 'No drivetrain data found' }
  }
  return { status: 'success', data: rows.map((r: any) => ({ drivetype: r?.drivetype ?? null })) }
})
