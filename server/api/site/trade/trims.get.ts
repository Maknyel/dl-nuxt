/**
 * GET /api/site/trade/trims?modelyear=&make=&model=: the trade-in form's trims (the Laravel `/fetch-trims-new`): the
 * JD Power bodies, then each body's trim and drive type. `{ status: 'success', result: [{ label, value, ucgvehicleid,
 * drivetype }] }`, one per trim name.
 */
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const period = String(q.period ?? 0)
  const region = String(q.region ?? 8)
  const bodies = await jdGet(event, '/bodies', {
    period,
    vehicletype: 'UsedCar',
    modelyear: String(q.modelyear ?? ''),
    make: String(q.make ?? ''),
    model: String(q.model ?? ''),
  })
  const ids: string[] = (bodies?.result ?? []).map((b: any) => b?.ucgvehicleid).filter(Boolean)

  const trims = await Promise.all(
    ids.map(async (id) => {
      try {
        const r = await jdGet(event, '/vehicleAndValueByVehicleId', { period, region, ucgvehicleid: String(id) })
        const row = r?.result?.[0]
        return row?.trim ? { label: row.trim, value: row.trim, ucgvehicleid: id, drivetype: row.drivetype ?? null } : null
      } catch {
        return null
      }
    }),
  )
  const seen = new Set<string>()
  const result = trims.filter((t): t is NonNullable<typeof t> => !!t && !seen.has(t.label) && !!seen.add(t.label))
  return { status: 'success', result }
})
