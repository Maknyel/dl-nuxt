/**
 * Starts the dealer website (ADR-0002):
 *  1. reads this dealer's settings (config.json next to index.html);
 *  2. loads the dealer's site data (company, locations, template, menu) through the site's layout route, before the
 *     first page shows (Nuxt's plugins/01.site.ts);
 *  3. mounts the app with the router, the head manager and NuxtLink (= RouterLink) for the components.
 */
import { createApp, defineComponent, h } from 'vue'
import { RouterLink } from 'vue-router'
import { createHead } from '@unhead/vue/client'
import App from './App.vue'
import DefaultLayout from './layouts/default.vue'
import { router } from './router'
import { loadRuntimeConfig } from './site-api/runtime/config'
import { $fetch, useState } from './shims/nuxt'
import type { SiteLayout } from './types/site'
import './assets/css/main.css'

async function start() {
  await loadRuntimeConfig()

  // Development only: ?template=template-2 previews another template (ignored on a built site).
  const preview = import.meta.env.DEV ? new URLSearchParams(window.location.search).get('template') : null
  const site = useState<SiteLayout | null>('site', () => null)
  try {
    site.value = await $fetch<SiteLayout>('/api/site/layout', { query: preview ? { template: preview } : {} })
  } catch (error) {
    console.error('The dealer website could not load its data from the Dealer Lion API.', error)
    document.getElementById('app')!.innerHTML =
      '<p style="font-family:system-ui;padding:4rem 1rem;text-align:center;color:#374151">' +
      'This website could not load. Please try again in a moment.</p>'
    return
  }

  const app = createApp(App)
  app.use(createHead())
  app.use(router)
  // The components were written with Nuxt's <NuxtLink>: the router's link, under the same name.
  app.component('NuxtLink', RouterLink)
  // …and <NuxtLayout> (the vehicle page puts itself in the site's frame): the default layout around its content.
  app.component(
    'NuxtLayout',
    defineComponent({ name: 'NuxtLayout', setup: (_props, { slots }) => () => h(DefaultLayout, null, slots) }),
  )
  await router.isReady()
  app.mount('#app')
}

void start()
