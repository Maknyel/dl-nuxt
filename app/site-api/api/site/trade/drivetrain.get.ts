/**
 * GET /api/site/trade/drivetrain?vehicleID=: a J.D. Power vehicle's drive types (the Laravel `/drivetrain-dropdown`),
 * for Sell Us Your Car, Book Service and the credit application's trade-in step. From the API's public
 * website/get/vehicle/drivetrain (its ADR-1135), which answers as the Laravel route did:
 *  - `{ status: 'success', data: [{ drivetype }] }`;
 *  - 422 without a numeric vehicleID; 404 when J.D. Power has none; 500 when the call fails.
 */
export default defineEventHandler((event) => {
  const q = getQuery(event)
  return apiGetPassthrough(event, 'website/get/vehicle/drivetrain', {
    vehicleID: String(q.vehicleID ?? ''),
    period: String(q.period ?? 0),
    region: String(q.region ?? 8),
  })
})
