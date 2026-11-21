import type { SiteLayout } from '~/types/site'

/**
 * Loads the dealer's site data once per page load (on the server for the first view; it travels to the browser in the
 * page). Every component reads it through useSite(). A settings save shows on the next full page load (the server's
 * API cache refreshes within ~15s, server/utils/dealerApi.ts).
 */
export default defineNuxtPlugin(async () => {
  const site = useState<SiteLayout | null>('site', () => null)
  if (site.value) return

  // Development only: ?template=template-2 previews another template (the server ignores it in production).
  const preview = import.meta.dev ? useRoute().query.template : undefined

  try {
    site.value = await $fetch<SiteLayout>('/api/site/layout', {
      query: typeof preview === 'string' ? { template: preview } : undefined,
    })
  } catch (error: any) {
    throw createError({
      statusCode: error?.statusCode ?? 502,
      statusMessage: 'The dealer website could not load its data from the Dealer Lion API.',
      fatal: true,
    })
  }
})
