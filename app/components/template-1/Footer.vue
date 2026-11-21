<script setup lang="ts">
/**
 * Template-1's footer: the port of template-1/footer/layout-4.blade.php (Shop, Services and Dealer Info links, the
 * contact block of each location with "See more", and the "Powered by" bar).
 *
 * The Blade also builds the dealer's social links (footer_setting.social_links) but never renders them, so neither
 * does this.
 */
import type { Company } from '~/types/site'

const { company, mainCompany } = useSite()

// Multi accounts list every location's contact info; otherwise just the company.
const footerLocations = computed<Company[]>(() =>
  company.value.account_type === 'Multi' && mainCompany.value.length ? mainCompany.value : [company.value],
)
const footerMulti = computed(() => footerLocations.value.length > 1)
const collapsible = computed(() => footerMulti.value && footerLocations.value.length > 2)
const iconSize = computed(() => (footerMulti.value ? '0.85rem' : '1rem'))
const showAll = ref(false)

const mapUrl = (loc: Company) =>
  `https://www.google.com/maps/dir/?api=1&destination=${loc.street_address ?? ''}, ${loc.city ?? ''}, ${capsOnly(loc.state)} ${loc.zip_code ?? ''}`

/** The inventory filtered by one body type, with the same query string the Blade builds. */
const bodyTypeLink = (type: string) =>
  `/pre-owned-cars?list=&page=1&grid=&search=&per_page=&sort_by=&last_updated_value=body_type&is_make_active=&is_model_active=&is_year_active=&is_internet_price_active=&is_mileage_active=&internet_price_from=&internet_price_to=&body_type%5B%5D=${type}&year_from=&year_to=&mileage_from=&mileage_to=`

const poweredBySrc = ref('/media/Dealer%20Lion%20Logo%20-%20Black.png')
const poweredByImg = ref<HTMLImageElement | null>(null)
function onPoweredByError() {
  if (poweredBySrc.value !== DEALER_LION_LOGO) poweredBySrc.value = DEALER_LION_LOGO
}
onMounted(() => {
  const img = poweredByImg.value
  if (img && img.complete && img.naturalWidth === 0) onPoweredByError()
})
</script>

<template>
  <footer class="footer4-wrap mt-8">
    <!-- Main grid -->
    <div class="footer4-main mx-auto px-6 lg:px-10 py-8">
      <div class="container grid lg:grid-cols-4 sm:grid-cols-2 grid-cols-1 gap-10">
        <div class="flex flex-col gap-4">
          <h4 class="footer4-heading text-xs font-bold tracking-widest uppercase">Shop</h4>
          <ul class="flex flex-col gap-3">
            <li><NuxtLink :to="bodyTypeLink('SUV')" class="footer4-link text-sm">SUVs</NuxtLink></li>
            <li><NuxtLink :to="bodyTypeLink('Truck')" class="footer4-link text-sm">Trucks</NuxtLink></li>
            <li><NuxtLink :to="bodyTypeLink('Sedan')" class="footer4-link text-sm">Sedans</NuxtLink></li>
          </ul>
        </div>

        <div class="flex flex-col gap-4">
          <h4 class="footer4-heading text-xs font-bold tracking-widest uppercase">Services</h4>
          <ul class="flex flex-col gap-3">
            <li><NuxtLink to="/sell" class="footer4-link text-sm">Sell Us You Car</NuxtLink></li>
            <li><NuxtLink to="/finance" class="footer4-link text-sm">Credit App</NuxtLink></li>
            <li><NuxtLink to="/services" class="footer4-link text-sm">Book Service</NuxtLink></li>
            <!-- The Blade's "About Us" / "Contact" items check routes (frontend.about, frontend.contact) the Laravel
                 site doesn't have, so they never show. -->
          </ul>
        </div>

        <div class="flex flex-col gap-4 order-none lg:order-none sm:order-last">
          <h4 class="footer4-heading text-xs font-bold tracking-widest uppercase">Dealer Info</h4>
          <ul class="flex flex-col gap-3">
            <li><NuxtLink to="/privacy_policy" class="footer4-link text-sm">Privacy Policy</NuxtLink></li>
            <li><NuxtLink to="/termsof_service" class="footer4-link text-sm">Terms of Service</NuxtLink></li>
            <li><NuxtLink to="/disclaimer_notice" class="footer4-link text-sm">Disclaimer</NuxtLink></li>
          </ul>
        </div>

        <div class="flex flex-col gap-4">
          <h4 class="footer4-heading text-xs font-bold tracking-widest uppercase text-left">Get in Touch</h4>
          <div :class="footerMulti ? 'grid lg:grid-cols-2 grid-cols-1 gap-x-8 gap-y-3' : 'flex flex-col gap-4'">
            <template v-for="(loc, i) in footerLocations" :key="loc.id ?? i">
              <Transition
                enter-active-class="transition ease-[cubic-bezier(0.4,0,0.2,1)] duration-150"
                enter-from-class="opacity-0"
                leave-active-class="transition ease-[cubic-bezier(0.4,0,0.2,1)] duration-75"
                leave-to-class="opacity-0"
              >
                <div
                  v-show="!(collapsible && i >= 2) || showAll"
                  class="flex flex-col"
                  :class="footerMulti ? 'gap-1' : 'gap-4'"
                >
                  <p v-if="footerMulti && loc.name" class="footer4-heading text-xs font-semibold mb-2">{{ loc.name }}</p>
                  <a
                    v-if="loc.phone_number"
                    :href="`tel:${loc.phone_number}`"
                    class="footer4-link flex items-center"
                    :class="footerMulti ? 'gap-2 text-sm' : 'gap-3 text-sm'"
                  >
                    <span class="footer4-contact-icon"><Icon name="ion:call-outline" :style="{ fontSize: iconSize }" aria-hidden="true" /></span>
                    <span>{{ formatPhone(loc.phone_number) }}</span>
                  </a>
                  <a
                    v-if="loc.email"
                    :href="`mailto:${loc.email}`"
                    class="footer4-link flex items-center"
                    :class="footerMulti ? 'gap-2 text-sm' : 'gap-3 text-sm'"
                  >
                    <span class="footer4-contact-icon"><Icon name="ion:mail-outline" :style="{ fontSize: iconSize }" aria-hidden="true" /></span>
                    <span class="break-all">{{ loc.email }}</span>
                  </a>
                  <a
                    v-if="loc.street_address"
                    :href="mapUrl(loc)"
                    target="_blank"
                    class="footer4-link flex items-start"
                    :class="footerMulti ? 'gap-2 text-sm' : 'gap-3 text-sm'"
                  >
                    <span class="footer4-contact-icon"><Icon name="ion:location-outline" :style="{ fontSize: iconSize }" aria-hidden="true" /></span>
                    <span>{{ loc.street_address }},<br>{{ loc.city }}, {{ capsOnly(loc.state) }} {{ loc.zip_code }}</span>
                  </a>
                </div>
              </Transition>
            </template>
          </div>
          <button
            v-if="collapsible"
            type="button"
            class="footer4-link flex items-center gap-1 text-xs font-semibold"
            style="color: var(--company-primary-base);"
            @click="showAll = !showAll"
          >
            <span>{{ showAll ? 'See less' : `See more (${footerLocations.length - 2})` }}</span>
            <Icon
              name="ion:chevron-down"
              class="text-[0.7rem]"
              :class="showAll ? 'rotate-180' : ''"
              style="transition: transform .15s, rotate .15s;"
            />
          </button>
        </div>
      </div>
    </div>

    <!-- Bottom bar -->
    <div class="container mx-auto px-6 lg:px-10 py-1 flex flex-col sm:flex-row items-center justify-center gap-3">
      <span class="text-white font-bold">
        <NuxtLink to="/" class="flex items-center ">
          Powered by <img
            ref="poweredByImg"
            :src="poweredBySrc"
            :alt="company.name"
            class="h-8 w-auto object-contain brightness-0 invert pt-1"
            @error="onPoweredByError"
          >
        </NuxtLink>
      </span>
    </div>
  </footer>
</template>

<style scoped>
.footer4-wrap {
  background: linear-gradient(to bottom,
      color-mix(in srgb, var(--company-primary-base) 15%, #111827) 0%,
      color-mix(in srgb, var(--company-primary-base) 5%, #060a10) 100%);
}

/* The home mock-up: the link columns on white, Inter. */
.footer4-main {
  background: #ffffff;
  font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
}

.footer4-heading {
  color: #16131f;
  letter-spacing: 0.1em;
}

.footer4-link {
  color: #3f3b4d;
  transition: color 0.2s;
}

.footer4-link:hover {
  color: var(--company-primary-base);
}

/* Contact icons in lavender tiles. */
.footer4-contact-icon {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--company-primary-base) 10%, #ffffff);
  color: var(--company-primary-base);
  flex-shrink: 0;
}
</style>
