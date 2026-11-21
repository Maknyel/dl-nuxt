<script setup lang="ts">
/**
 * The frame of every page (the Laravel site's __layouts/index + shell): the dealer's colours and template on <body>,
 * the title / description / favicon from the dealer's SEO settings, and the dealer template's nav and footer.
 *
 * On inner pages the nav and footer show only when the dealer's template_config.sections lists them (the Laravel
 * shell); the home page always shows them (definePageMeta({ alwaysShell: true })).
 */
const route = useRoute()
const { site, company, template, hasSection, mediaUrl } = useSite()

const alwaysShell = computed(() => route.meta.alwaysShell === true)
const showNav = computed(() => alwaysShell.value || hasSection('nav'))
const showFooter = computed(() => alwaysShell.value || hasSection('footer'))

/** The dealer's SEO block for this page (company_seo_settings), keyed as the Laravel layout keys it by route. */
const SEO_KEY_BY_PATH: Record<string, string> = {
  '/': 'home_page',
  '/pre-owned-cars': 'inventory',
  '/sell': 'sell_us_your_car',
  '/finance': 'credit_app',
  '/services': 'book_service',
  '/aboutus': 'our_team',
  '/contactus': 'contact_us',
}
const seo = computed(() => {
  const all = site.value?.seo ?? {}
  const key = SEO_KEY_BY_PATH[route.path]
  const page = (key && all[key]) || {}
  const general = all.general_settings || {}
  const pick = (field: string) => page[field] || general[field] || ''
  return {
    title: pick('meta_title') || company.value.name || 'Dealer Lion',
    description: pick('meta_description'),
    keywords: pick('meta_keywords'),
  }
})

const favicon = computed(() => {
  const file = company.value.favicon_logo || company.value.logo
  return file ? mediaUrl(file) : '/imgfav/favicon.webp'
})

const or = (value: unknown, fallback: string) => (typeof value === 'string' && value.trim() ? value : fallback)

useHead(() => ({
  // A page can set its own title (useHead / useSeoMeta); this is the default.
  titleTemplate: (title?: string) => title || seo.value.title,
  link: [{ rel: 'icon', href: favicon.value }],
  meta: [
    ...(seo.value.description ? [{ name: 'description', content: seo.value.description }] : []),
    ...(seo.value.keywords ? [{ name: 'keywords', content: seo.value.keywords }] : []),
  ],
  bodyAttrs: {
    class: company.value.template ?? '',
    style: [
      `--company-primary-base: ${or(company.value.color_primary, '#4B5563')}`,
      `--company-secondary-base: ${or(company.value.color_secondary, '#4B5563')}`,
      `--company-dark-primary-base: ${or(company.value.color_dark_primary, '#991601')}`,
    ].join('; '),
  },
}))
</script>

<template>
  <div :data-template="template">
    <SiteNav v-if="showNav" />
    <slot />
    <SiteFooter v-if="showFooter" />
  </div>
</template>
