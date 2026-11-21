import tailwindcss from '@tailwindcss/vite'

// The dealer website (the Laravel dealer-lion-client-templates site, :8002) in Nuxt + Tailwind. See docs/adr.
export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',
  devtools: { enabled: false },

  modules: ['@nuxt/icon'],

  css: ['~/assets/css/main.css'],

  // Ionicons (the Laravel site's <ion-icon>) as inline SVG rendered on the server: `<Icon name="ion:call-outline" />`.
  // Bundled locally, so no icon is fetched from an icon API at runtime and none pops in after load.
  icon: {
    // Inline <svg>, as Ionicons draws them (the default CSS-mask spans rendered ~1px off from :8002).
    mode: 'svg',
    serverBundle: { collections: ['ion'] },
    clientBundle: { scan: true },
    // Sized by the .ion-icon class (1em, main.css), so a text-* class on an icon still sizes it.
    class: 'ion-icon',
  },

  vite: {
    plugins: [tailwindcss()],
  },

  // Server-only settings. Override with environment variables (NUXT_API_BASE, NUXT_COMPANY_ID, ...) on each server;
  // the defaults are the local API and the demo dealer, the same as the Laravel site's local .env.
  runtimeConfig: {
    // The Dealer Lion API (the Laravel site's URL_API_CORE).
    apiBase: 'http://localhost:8001',
    // The dealer this site serves (the Laravel site's COMPANY_ID_ENV).
    companyId: '5022',
    // The dealer's name as the Laravel site sends it to the API (its COMPANY_INFO).
    companyName: 'Dealer Lion Demo - Single',
    // Where the dealer's media (logo, photos) is served from (the Laravel site's MAIN_WEBSITE_URL).
    mediaBase: 'http://localhost:8000/',
    // Template override for local work (the Laravel site's CURRENT_TEMPLATE); empty = the dealer's own template.
    templateOverride: '',
    // JD Power's valuation API for the trade-in form (models, trims, VIN decode). The key is a secret: set
    // NUXT_JD_API_KEY on the server, never here. Without it those lookups answer "not configured".
    jdApiKey: '',
    jdApiUrl: 'https://cloud.jdpower.ai/data-api/valuationservices/valuation',
    // Google Maps JavaScript key for the credit app's address autocomplete (NUXT_GOOGLE_MAPS_KEY). A browser key:
    // restrict it to the site's domains in Google Cloud. Empty = autocomplete off.
    googleMapsKey: '',
    public: {
      siteName: 'Dealer Lion',
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800&display=block',
        },
      ],
    },
  },

  typescript: {
    strict: true,
  },
})
