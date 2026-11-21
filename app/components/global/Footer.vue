<script setup lang="ts">
// The footer of templates 2, 3 and 4 (global/footer/index.blade.php), in the colours each template's
// footer/layout-4 include passes (site/Footer.vue). Its columns follow the dealer's pre_define.footer toggles, in their
// order: logo, brand index (site.yearLimit makes), location and phone, social links, dealer info. Then the
// "Powered by Dealer Lion" bar. It carries the "Write a Review" modal (Alpine `add_review`).
import ReviewModal from './footer/ReviewModal.vue'

defineProps<{ background: string; subFooter: string; text: string }>()

const { site, company, template, logoUrl } = useSite()

/** PHP's `$value == true`. */
const truthy = (v: unknown) => !(v === false || v === null || v === undefined || v === 0 || v === '' || v === '0')

interface FooterToggle { label?: string; value?: unknown; variable?: string }
const columns = computed<string[]>(() => {
  const list = company.value.pre_define?.footer
  return Array.isArray(list)
    ? (list as FooterToggle[]).filter((t) => truthy(t?.value)).map((t) => String(t?.variable ?? ''))
    : []
})

/** The brand index: the API's getAvailableYearLimit makes. */
const makes = computed<string[]>(() =>
  (Array.isArray(site.value?.yearLimit) ? site.value.yearLimit : []).map((row: any) => String(row?.make ?? '')),
)
const makeUrl = (make: string) => `/pre-owned-cars?list=&page=1&grid=&per_page=&sort_by=&make[]=${make}`

/** footer_setting.social_links (a JSON string or an array); the platform's empty default links don't count. */
const DEFAULT_LINKS = ['https://www.facebook.com/', 'https://www.instagram.com/', 'https://www.youtube.com/', 'https://www.linkedin.com/']
interface SocialLink { label?: string; link?: string | null }
const allSocialLinks = computed<SocialLink[]>(() => {
  let links = company.value.footer_setting?.social_links ?? []
  if (typeof links === 'string') {
    try {
      links = JSON.parse(links) ?? []
    } catch {
      links = []
    }
  }
  return Array.isArray(links) ? links : Object.values(links ?? {})
})
const isLive = (s: SocialLink) => !!s?.link && !DEFAULT_LINKS.includes(s.link)
const socialAvailability = computed(() => allSocialLinks.value.some(isLive))
const socialLinks = computed(() => allSocialLinks.value.filter((s) => isLive(s) && !!s.label))

const state = computed(() => capsOnly(company.value.state))
const mapUrl = computed(
  () =>
    `https://www.google.com/maps/dir/?api=1&destination=${company.value.street_address ?? ''}, ${company.value.city ?? ''}, ${state.value} ${company.value.zip_code ?? ''}`,
)

// The logo falls back to Dealer Lion's when it fails to load (the Blade's onerror), also before hydration.
const logo = ref<HTMLImageElement | null>(null)
// (A function ref: the logo sits inside the columns' v-for.)
const setLogo = (el: unknown) => {
  logo.value = (el as HTMLImageElement | null) ?? null
}
function logoFallback() {
  if (logo.value && !logo.value.src.endsWith(DEALER_LION_LOGO)) logo.value.src = DEALER_LION_LOGO
}
onMounted(() => {
  if (logo.value?.complete && logo.value.naturalWidth === 0) logoFallback()
})

// Alpine add_review's openadd_review. Nothing opens it today: the Blade's "Write a Review" button (Dealer Info) is
// commented out, so the modal stays closed, as on the Laravel site.
const openReview = ref(false)
</script>

<template>
  <div class="">
    <!-- Footer -->
    <footer
      class="bg-gray-50 border-t border-gray-200 z-10 relative"
      :class="{ 'no-socials': !socialAvailability }"
      :data-template="template"
      :style="{ background, color: text }"
    >
      <!-- Main Footer -->
      <div class="max-w-6xl flex flex-col items-center m-auto py-5 px-2 lg:py-10 gap-4">
        <div class="footer-container">
          <template v-for="(variable, i) in columns" :key="`${variable}-${i}`">
            <!-- Logo -->
            <div v-if="variable === 'footer_logo'" class="footer-logo lg:col-span-1 col-span-2 hidden lg:block">
              <img :ref="setLogo" :src="logoUrl()" class="w-auto" :alt="company.name" @error="logoFallback">
            </div>

            <!-- Brand Index -->
            <div v-else-if="variable === 'logo_brand_index'" class="footer-brandindex flex flex-col gap-4">
              <span class="font-semibold text-lg">Brand Index</span>
              <ul class="flex flex-col gap-3">
                <li v-for="(make, j) in makes" :key="j">
                  <NuxtLink class="menu" :to="makeUrl(make)">{{ make }}</NuxtLink>
                </li>
              </ul>
            </div>

            <!-- Location -->
            <div v-else-if="variable === 'logo_location'" class="footer-location flex flex-col gap-4">
              <div class="flex-1 flex flex-col gap-4">
                <span class="font-semibold text-lg">Location</span>
                <a class="menu" target="_blank" :href="mapUrl">
                  <span class="">{{ company.street_address }} {{ company.city }} {{ state }} {{ company.zip_code }}</span>
                </a>
              </div>
              <div class="flex-1 flex flex-col gap-4">
                <span class="font-semibold text-lg">Phone Number</span>
                <a class="menu" :href="`tel:${company.phone_number ?? ''}`">
                  <span>{{ formatPhone(company.phone_number) }}</span>
                </a>
              </div>
            </div>

            <!-- Social Links -->
            <div
              v-else-if="variable === 'logo_get_social_with_us' && allSocialLinks.length"
              class="footer-socials flex flex-col gap-4"
            >
              <span class="font-semibold text-lg">Get Social with Us</span>
              <div class="flex flex-col gap-3">
                <a v-for="(social, j) in socialLinks" :key="j" class="menu" target="_blank" :href="social.link ?? ''">
                  <span class="flex gap-2 items-center">
                    <template v-if="social.label === 'facebook'">
                      <Icon name="ion:logo-facebook" />
                      <span>Facebook</span>
                    </template>
                    <template v-else-if="social.label === 'instagram'">
                      <Icon name="ion:logo-instagram" />
                      <span>Instagram</span>
                    </template>
                    <template v-else-if="social.label === 'youtube'">
                      <Icon name="ion:logo-youtube" />
                      <span>Youtube</span>
                    </template>
                    <template v-else-if="social.label === 'linkedin'">
                      <Icon name="ion:logo-linkedin" />
                      <span>LinkedIn</span>
                    </template>
                  </span>
                </a>
              </div>
            </div>

            <!-- Dealer Info -->
            <div v-else-if="variable === 'logo_dealer_info'" class="footer-dealerinfo flex flex-col gap-4">
              <span class="font-semibold text-lg">Dealer Info</span>

              <ul class="flex flex-col gap-2">
                <li class="menu">
                  <NuxtLink to="/privacy_policy">Privacy Policy</NuxtLink>
                </li>
                <li class="menu">
                  <NuxtLink to="/termsof_service">Terms Of Service</NuxtLink>
                </li>
                <li class="menu">
                  <NuxtLink to="/disclaimer_notice">Disclaimer Notice</NuxtLink>
                </li>
                <!-- The Blade's "Write a Review" button (@click="openadd_review = true") is commented out here. -->
              </ul>
            </div>
          </template>
        </div>
      </div>
      <!-- End Of Main Footer -->
      <div class="flex justify-center w-full" :style="{ background: subFooter, color: text }">
        <span class="font-semibold py-2">Powered by <a href="https://dealerlion.com" target="_blank">Dealer Lion</a></span>
      </div>
    </footer>
    <!-- End Of Footer -->

    <!-- Review Modal -->
    <ReviewModal v-model="openReview" />
  </div>
</template>

<style scoped>
/* frontend-tw.min.css's footer grid (the Laravel Tailwind build's own CSS). */
footer .footer-container {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (min-width: 992px) {
  footer .footer-container {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

footer.no-socials .footer-container {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (min-width: 992px) {
  footer.no-socials .footer-container {
    gap: 5rem;
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

footer.no-socials .footer-container .footer-socials {
  display: none;
}

/* The Blade's inline style. */
.menu {
  color: v-bind(text);
}

.menu:hover {
  color: var(--company-primary-base);
}

/* template4.min.css's footer rules (the inline background above wins over the first; no element has the class). */
footer[data-template='template-4'] {
  background-color: #26313c;
}

footer[data-template='template-4'] span.footer-title-col {
  font-family: 'Montserrat', sans-serif;
  font-size: 14px;
  text-transform: uppercase;
  color: #ffffff;
  font-weight: 700;
  margin-bottom: 45px;
  margin-top: 15px;
}
</style>
