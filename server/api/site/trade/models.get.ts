/**
 * GET /api/site/trade/models?make=&modelyear=: the trade-in form's models (the Laravel `/fetch-models`, JD Power).
 * `{ status: 'success', result: [{ model }] }`. Needs the JD Power settings (server/utils/jdPower.ts).
 */
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const data = await jdGet(event, '/models', {
    make: String(q.make ?? ''),
    modelyear: String(q.modelyear ?? ''),
    period: String(q.period ?? 0),
    vehicletype: String(q.vehicletype ?? 'UsedCar'),
  })
  return { status: 'success', result: data?.result ?? [] }
})
