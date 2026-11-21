<script setup lang="ts">
/**
 * global/home/finance.blade.php (via template-{2,3,4}/finance/layout-4): the finance image, the dealer's text and
 * a GET APPROVED link. The Blade lazy-loads the image from MAIN_WEBSITE_URL; loading="lazy" does the same here.
 */
const { site, company } = useSite()

// The Blade's onerror image (asset('media/images/company/finance.webp')).
const FALLBACK = '/media/images/company/finance.webp'

const home = computed(() => company.value.pre_define?.home ?? {})
const image = computed(() => `${site.value?.mediaBase ?? ''}${home.value.finance_your_vehicle_image ?? ''}`)

/**
 * The Blade echoes the dealer's text (usually "<p>...</p>") inside a <p>. A browser closes that outer <p> at the
 * first block tag, so the text renders as a plain sibling paragraph, followed by an empty <p> from the stray </p>.
 * The same DOM is built here (an HTML string with a <p> in a <p> would also break hydration).
 */
const textParts = computed(() => {
  const html = String(home.value.finance_your_vehicle_text ?? '')
  const m = /<(p|div|ul|ol|h[1-6]|table|blockquote|pre|section|article|header|footer|nav|aside|hr|dl|form|fieldset|address|menu|figure|details|main)[\s>/]/i.exec(html)
  if (!m) return { lead: html, rest: null as string | null }
  return { lead: html.slice(0, m.index), rest: html.slice(m.index) }
})

function onImgError(e: Event) {
  const img = e.target as HTMLImageElement
  if (!img.src.endsWith(FALLBACK)) img.src = FALLBACK
}

const img = ref<HTMLImageElement | null>(null)
onMounted(() => {
  // An image that failed before hydration never reaches @error.
  const el = img.value
  if (el && el.complete && el.naturalWidth === 0 && !el.src.endsWith(FALLBACK)) el.src = FALLBACK
})
</script>

<template>
  <div class="flex bg-base-200">
    <div class="container my-10 flex flex-col gap-8">
      <span class="lg:text-4xl text-3xl font-semibold text-center" v-html="home.finance_title ?? ''" />
      <div class="grid grid-cols-2 gap-8">
        <div class="col-span-full lg:col-span-1">
          <div class="relative h-80 w-full">
            <img
              ref="img"
              class="w-full h-full object-cover border border-gray-200"
              :src="image"
              loading="lazy"
              alt="keys"
              @error="onImgError"
            />
          </div>
        </div>
        <div class="flex flex-col justify-center col-span-full lg:col-span-1 gap-8">
          <template v-if="textParts.rest !== null">
            <p class="text-center text-lg lg:text-2xl" v-html="textParts.lead" />
            <div class="contents" v-html="textParts.rest" />
            <p />
          </template>
          <p v-else class="text-center text-lg lg:text-2xl" v-html="textParts.lead" />
          <NuxtLink
            to="/finance"
            class="place-self-end px-5 py-3 rounded-lg font-semibold company-primary-base-background text-base-content self-center capitalize text-center hover:opacity-80 hover:-translate-y-0.5 ease-in-out delay-75 duration-300"
          >
            GET APPROVED
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
