/**
 * GET /api/site/sell/vin-decode?vin=: the Sell Us Your Car VIN decode (the Laravel page's browser call to
 * `GET {URL_API_CORE}/api/v2/website/get/vehicle/vin/decode`), through the server so the browser never sees the API.
 *
 * The API's answer and status code are passed on as they are: `{ status: 'success', data: { modelyear, make, model,
 * body, drivetype, ... } }`, or e.g. `{ status: 'vinExists', message }` with an error status for an unknown VIN. The form
 * reads them as the Blade's $.ajax did (success with data / a 2xx without / a failed call).
 */
export default defineEventHandler(async (event) => {
  const vin = String(getQuery(event).vin ?? '')
  try {
    const res = await ($fetch as any).raw(apiUrl('website/get/vehicle/vin/decode'), {
      method: 'GET',
      query: { vin },
      timeout: 15000,
      headers: { Accept: 'application/json' },
      ignoreResponseError: true,
    })
    setResponseStatus(event, res.status || 502)
    return res._data ?? { status: 'error', message: 'Empty answer from the VIN decoder.' }
  } catch {
    setResponseStatus(event, 502)
    return { status: 'error', message: 'The VIN decoder could not be reached.' }
  }
})
