// A quick check that this site reaches the Dealer Lion API (the setup page, until the real pages are in).
export default defineEventHandler(async () => {
  const started = Date.now()
  const version = await siteVersion()
  return {
    api: apiUrl(''),
    companyId: companyId(),
    connected: version !== null,
    version,
    ms: Date.now() - started,
  }
})
