/**
 * GET /api/site/google-maps-key: the Google Maps JavaScript API key for the credit application's address autocomplete
 * (the Laravel `POST /google-api-key`, which returns its key base64-encoded).
 *
 * A Maps JavaScript key is a browser key: the page has to put it in the script URL, so it is restricted by HTTP referrer
 * in Google Cloud rather than kept secret. It still lives in the server's environment, never in the code:
 * NUXT_GOOGLE_MAPS_KEY (runtimeConfig `googleMapsKey`). Not set = `{ key: '' }`, and the
 * page leaves autocomplete off (the address fields work as plain inputs).
 */
export default defineEventHandler((event) => {
  return { key: String(useRuntimeConfig(event).googleMapsKey || '') }
})
