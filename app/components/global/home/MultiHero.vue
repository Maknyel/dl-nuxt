<script setup lang="ts">
/**
 * global/home/layout-4-multi.blade.php: the hero a Multi dealer gets instead of its template's hero, on every
 * template. A dark hero with location / vehicle stats, a search bar with a location picker and the CTA cards, then
 * "Our Locations" (a 2-up card slider and a map card) and an "All Locations" modal with each location's website.
 *
 * Like the Blade, it renders nothing unless the dealer is Multi and has locations (mainCompany).
 */
import { resolveHeroImage } from './Hero.vue'

const props = defineProps<{ home: any }>()

const { site, company, mainCompany, templateNav } = useSite()

const mediaBase = computed(() => site.value?.mediaBase ?? '/')
// The Blade's default (MAIN_WEBSITE_URL's copy); the same file is in this site's public/.
const DEFAULT_IMG = '/global_images/home_new/template-1 - layout-1 - Desktop.webp'

const bg = computed(() => resolveHeroImage(company.value, mediaBase.value)?.bg ?? DEFAULT_IMG)

const isMultiLoc = computed(() => company.value.account_type === 'Multi' && mainCompany.value.length > 0)

const availableCompanies = computed<any[]>(() => props.home?.data?.getavailablecompanies ?? [])
const totalVehicleCount = computed(() =>
  availableCompanies.value.reduce((sum, c) => sum + (Number(c?.count) || 0), 0),
)
const locCount = computed(() => mainCompany.value.length)

const nav = (flag: string) => String(templateNav.value?.[flag] ?? '') === '1'

/** PHP urlencode(): spaces as "+". */
const urlencode = (s: string) => encodeURIComponent(s).replace(/%20/g, '+')

/** route('frontend.search', ['company_id' => [$id]]). */
const searchForLocation = (id: unknown) => `/pre-owned-cars?company_id%5B0%5D=${encodeURIComponent(String(id ?? ''))}`

const locations = computed(() =>
  mainCompany.value.map((loc: Record<string, any>, idx: number) => {
    const id = loc.id ?? 0
    const street = loc.street_address ?? ''
    const city = loc.city ?? ''
    const state = String(loc.state ?? '').toUpperCase()
    const zip = loc.zip_code ?? ''

    let img = resolveHeroImage(loc, mediaBase.value)?.bg ?? ''
    if (!img) img = loc.company_logo ? `${mediaBase.value}media/company/${loc.company_logo}` : DEFAULT_IMG

    const siteUrl = loc.dl_website ? String(loc.dl_website).replace(/\/+$/, '') : ''
    return {
      id,
      idx,
      name: loc.name ?? '',
      address: `${street}, ${city}, ${state} ${zip}`.trim(),
      optionAddress: `${street}, ${city} ${state} ${zip}`.trim(),
      mapsUrl: loc.google_map ?? `https://www.google.com/maps/search/${urlencode(`${street} ${city} ${state}`)}`,
      vehicleCount: availableCompanies.value.find((c) => String(c?.id) === String(id))?.count ?? 0,
      img,
      searchUrl: siteUrl ? `${siteUrl}/pre-owned-cars` : searchForLocation(id),
      website: siteUrl || searchForLocation(id),
    }
  }),
)

const mapEmbedUrl = computed(
  () => `https://maps.google.com/maps?q=${urlencode(company.value.name ?? '')}&output=embed&z=8`,
)

useHead(() => ({
  link: isMultiLoc.value
    ? [{ rel: 'preload', as: 'image', type: 'image/webp', href: bg.value, fetchpriority: 'high' }]
    : [],
}))

// ── Search bar: keyword + location picker (the Blade's Alpine x-data) ─────────────────────────────────────────────
const search = ref('')
const locOpen = ref(false)
const selectedId = ref('')
const selectedLabel = ref('All Locations')
const locWrap = ref<HTMLElement | null>(null)

function pickLocation(id: string, label: string) {
  selectedId.value = id
  selectedLabel.value = label
  locOpen.value = false
}

function onSearch() {
  // The Blade's GET form: /pre-owned-cars?search=...&company_id[]=...
  navigateTo({ path: '/pre-owned-cars', query: { search: search.value, 'company_id[]': selectedId.value } })
}

function onDocClick(e: MouseEvent) {
  if (locOpen.value && locWrap.value && !locWrap.value.contains(e.target as Node)) locOpen.value = false
}

// ── Location slider ───────────────────────────────────────────────────────────────────────────────────────────────
const viewport = ref<HTMLElement | null>(null)
const track = ref<HTMLElement | null>(null)

function cardStep(): number {
  const vp = viewport.value
  const card = track.value?.querySelector<HTMLElement>('.multi-loc-card-wrap')
  if (!vp) return 0
  if (!card || !track.value) return vp.clientWidth
  const style = getComputedStyle(track.value)
  const gap = parseFloat(style.columnGap || style.gap) || 0
  return card.getBoundingClientRect().width + gap
}

function slideNext() {
  const vp = viewport.value
  if (!vp) return
  if (vp.scrollLeft + vp.clientWidth >= vp.scrollWidth - 1) vp.scrollTo({ left: 0, behavior: 'smooth' })
  else vp.scrollBy({ left: cardStep(), behavior: 'smooth' })
}

function slidePrev() {
  const vp = viewport.value
  if (!vp) return
  if (vp.scrollLeft <= 1) vp.scrollTo({ left: vp.scrollWidth, behavior: 'smooth' })
  else vp.scrollBy({ left: -cardStep(), behavior: 'smooth' })
}

// ── All-locations modal ───────────────────────────────────────────────────────────────────────────────────────────
const modalOpen = ref(false)

function openModal() {
  modalOpen.value = true
  document.body.style.overflow = 'hidden'
}

function closeModal() {
  modalOpen.value = false
  document.body.style.overflow = ''
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && modalOpen.value) closeModal()
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKeydown)
  if (modalOpen.value) document.body.style.overflow = ''
})
</script>

<template>
  <div v-if="isMultiLoc">
    <!-- Hero section -->
    <section class="multi-hero-section">
      <!-- Background image -->
      <div class="multi-hero-bg">
        <img :src="bg" :alt="company.name" class="multi-hero-img" />
        <div class="multi-hero-fade" />
        <div class="multi-hero-fade-bottom" />
      </div>

      <div class="container multi-hero-content">
        <div class="multi-hero-top">
          <!-- Left column -->
          <div class="multi-hero-left">
            <!-- Stats bar -->
            <div
              class="lg:w-[40rem] w-full rounded-[0.875rem] border border-[color-mix(in_srgb,var(--company-primary-base)_25%,rgba(255,255,255,0.09))] bg-[color-mix(in_srgb,var(--company-primary-base)_12%,rgba(5,7,11,0.92))] backdrop-blur-[14px]"
            >
              <div class="flex items-center gap-4 px-4 py-3">
                <div
                  v-for="stat in [
                    { icon: 'ion:location-sharp', value: locCount, label: 'LOCATIONS' },
                    { icon: 'ion:car-sport', value: totalVehicleCount, label: 'VEHICLES' },
                    { icon: 'ion:people', value: 'ONE', label: 'COMBINED INVENTORY' },
                  ]"
                  :key="stat.label"
                  class="flex flex-1 flex-row gap-4 items-center px-1 py-[0.15rem] sm:px-2 sm:py-[0.2rem]"
                >
                  <div class="flex shrink-0 items-center justify-center text-[var(--company-primary-base)]">
                    <!-- fa-map-marker is a narrow glyph (0.57em): the square Ionicon takes the same room, so the bar
                         fits a phone as the Blade's does. -->
                    <Icon
                      :name="stat.icon"
                      class="leading-none text-[var(--company-primary-base)]"
                      :style="{ fontSize: '1.5rem', marginInline: stat.label === 'LOCATIONS' ? '-0.2143em' : undefined }"
                    />
                  </div>
                  <div class="flex flex-col gap-[0.05rem]">
                    <span class="text-base font-extrabold leading-[1.1] text-white sm:text-xl">{{ stat.value }}</span>
                    <span class="text-[0.5rem] font-semibold uppercase tracking-[0.09em] text-white sm:text-[0.575rem]">
                      {{ stat.label }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Headline -->
            <h1 class="multi-hero-h1">
              Shop Every Location.<br />
              <span class="hero-accent">Find Your Next Ride.</span>
            </h1>

            <!-- Subtext -->
            <p class="multi-hero-sub">
              {{ locCount }} trusted dealerships. One easy way to find the perfect vehicle. Browse our entire inventory
              across all locations in one place.
            </p>

            <!-- Search bar -->
            <form action="/pre-owned-cars" method="GET" class="multi-search-bar" @submit.prevent="onSearch">
              <svg class="multi-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                v-model="search"
                type="text"
                name="search"
                placeholder="Search all vehicles across every store"
                class="multi-search-input"
              />
              <div class="multi-search-loc-wrap">
                <div class="multi-search-loc-divider" />
                <Icon name="ion:location-sharp" class="multi-search-loc-icon" />
                <div ref="locWrap" class="multi-search-loc-select-wrap">
                  <input type="hidden" name="company_id[]" :value="selectedId" />
                  <button type="button" class="multi-search-loc-trigger" @click="locOpen = !locOpen">
                    <span>{{ selectedLabel }}</span>
                  </button>
                  <Icon
                    name="ion:chevron-down-outline"
                    class="multi-search-loc-chevron"
                    :class="locOpen ? 'multi-search-loc-chevron-open' : ''"
                  />

                  <Transition
                    enter-active-class="transition ease-out duration-150"
                    enter-from-class="opacity-0 -translate-y-2"
                    enter-to-class="opacity-100 translate-y-0"
                    leave-active-class="transition ease-in duration-100"
                    leave-from-class="opacity-100 translate-y-0"
                    leave-to-class="opacity-0 -translate-y-2"
                  >
                    <div v-show="locOpen" class="multi-search-loc-panel">
                      <button type="button" class="multi-search-loc-row" @click="pickLocation('', 'All Locations')">
                        <span class="multi-search-loc-row-name">All Locations</span>
                      </button>
                      <button
                        v-for="loc in locations"
                        :key="loc.id"
                        type="button"
                        class="multi-search-loc-row"
                        @click="pickLocation(String(loc.id ?? ''), loc.name)"
                      >
                        <span class="multi-search-loc-row-name">{{ loc.name }}</span>
                        <span v-if="loc.optionAddress !== ''" class="multi-search-loc-row-addr">{{ loc.optionAddress }}</span>
                      </button>
                    </div>
                  </Transition>
                </div>
              </div>
              <button type="submit" class="hero-search-btn multi-search-btn">
                <svg style="width: 1rem; height: 1rem; color: white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
          </div>

          <!-- Right glass card -->
          <div class="hidden flex-1 items-end justify-end self-stretch lg:flex">
            <div class="flex max-w-[22rem] flex-col gap-1 rounded-2xl border border-white/[0.09] bg-black/60 p-6 backdrop-blur-[20px]">
              <div class="text-xs font-bold uppercase tracking-wide text-white/60">All Locations Inventory</div>
              <div class="flex items-center gap-3">
                <div class="flex h-12 w-12 shrink-0 items-center justify-center">
                  <Icon name="ion:globe-outline" class="text-3xl text-white" />
                </div>
                <div class="text-[1.0625rem] font-bold text-white">One Search. Every Vehicle.</div>
              </div>
              <p class="m-0 pl-[calc(2.75rem+0.75rem)] text-sm leading-[1.6] text-white">
                Search vehicles from every {{ company.name }} location! {{ totalVehicleCount }} vehicles available now.
              </p>
            </div>
          </div>
        </div>

        <!-- CTA cards -->
        <div class="multi-cta-grid">
          <NuxtLink v-if="nav('show_view_inventory')" to="/pre-owned-cars" class="cta-card multi-cta-card">
            <div class="multi-cta-icon"><Icon name="ion:car-sport" class="cta-fa text-white" /></div>
            <div class="multi-cta-body">
              <div class="multi-cta-title">View All Inventory</div>
              <div class="multi-cta-sub">{{ totalVehicleCount }} Vehicles</div>
            </div>
            <div class="cta-arrow multi-cta-arrow">
              <svg style="width: 0.75rem; height: 0.75rem; color: white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </NuxtLink>

          <NuxtLink v-if="nav('show_sell')" to="/sell" class="cta-card-sell multi-cta-card">
            <div class="multi-cta-icon"><Icon name="ion:cash-outline" class="cta-fa text-white" /></div>
            <div class="multi-cta-body">
              <div class="multi-cta-title">Sell Us Your Car</div>
              <div class="multi-cta-sub">Get Top Dollar</div>
            </div>
            <div class="cta-arrow multi-cta-arrow">
              <svg style="width: 0.75rem; height: 0.75rem; color: white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </NuxtLink>

          <NuxtLink v-if="nav('show_credit')" to="/finance" class="cta-card cta-card-get-approve multi-cta-card">
            <div class="multi-cta-icon"><Icon name="ion:checkbox-outline" class="cta-fa text-white" /></div>
            <div class="multi-cta-body">
              <div class="multi-cta-title">Get Approved</div>
              <div class="multi-cta-sub">Fast &amp; Easy Financing</div>
            </div>
            <div class="cta-arrow multi-cta-arrow">
              <svg style="width: 0.75rem; height: 0.75rem; color: white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </NuxtLink>

          <NuxtLink v-if="nav('show_service')" to="/services" class="cta-card cta-card-accent multi-cta-card">
            <div class="multi-cta-icon"><Icon name="ion:calendar-outline" class="cta-fa text-white" /></div>
            <div class="multi-cta-body">
              <div class="multi-cta-title">Book Service</div>
              <div class="multi-cta-sub">Schedule Your Visit</div>
            </div>
            <div class="cta-arrow multi-cta-arrow" style="background: rgba(255, 255, 255, 0.2)">
              <svg style="width: 0.75rem; height: 0.75rem; color: white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Locations section -->
    <section id="multi-locations" class="multi-locs-section">
      <div class="container">
        <div class="multi-locs-grid">
          <!-- Left: heading + description + CTA -->
          <div class="flex flex-col gap-5 self-stretch col-span-1 sm:col-span-2 lg:col-span-1 p-3">
            <p class="multi-locs-eyebrow" style="color: var(--company-primary-base)">
              {{ locCount }} LOCATIONS. ONE STANDARD.
            </p>
            <h2 class="multi-locs-h2">Our Locations</h2>
            <p class="multi-locs-desc">
              Visit any of our {{ locCount }} convenient locations for exceptional service, great selection, and a team
              that puts you first.
            </p>
            <NuxtLink to="/pre-owned-cars" class="multi-map-cta mt-[auto]">
              View All Inventory
              <svg style="width: 1rem; height: 1rem" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </NuxtLink>
          </div>

          <!-- Location cards -->
          <div class="multi-loc-slider-wrap">
            <button
              v-if="locCount > 1"
              type="button"
              class="multi-loc-nav multi-loc-nav-prev"
              :class="{ 'multi-loc-nav-desktop-hide': locCount <= 2 }"
              aria-label="Previous locations"
              @click="slidePrev"
            >
              <Icon name="ion:chevron-back-outline" />
            </button>

            <div ref="viewport" class="multi-loc-slider-viewport">
              <div ref="track" class="multi-loc-slider-track">
                <div v-for="loc in locations" :key="loc.idx" class="multi-loc-card-wrap">
                  <div class="multi-loc-card">
                    <!-- Image -->
                    <div class="multi-loc-img-wrap">
                      <img v-if="loc.img" :src="loc.img" :alt="loc.name" class="multi-loc-img" />
                      <div v-else class="multi-loc-img-placeholder" />
                      <div class="multi-loc-img-fade" />
                      <div class="multi-loc-badge">{{ loc.idx + 1 }}</div>
                    </div>
                    <!-- Body -->
                    <div class="multi-loc-body">
                      <h3 class="multi-loc-name">{{ loc.name }}</h3>
                      <p class="multi-loc-addr">{{ loc.address }}</p>
                      <div class="multi-loc-count">
                        <Icon name="ion:car-sport" class="multi-loc-count-icon" />
                        {{ loc.vehicleCount }}+ Vehicles
                      </div>
                      <div class="multi-loc-actions">
                        <a :href="loc.searchUrl" target="_blank" rel="noopener" class="multi-loc-dir-link truncate">
                          View Inventory
                        </a>
                        <a :href="loc.mapsUrl" target="_blank" rel="noopener" class="multi-loc-dir-link">
                          Directions
                          <svg style="width: 0.7rem; height: 0.7rem" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              v-if="locCount > 1"
              type="button"
              class="multi-loc-nav multi-loc-nav-next"
              :class="{ 'multi-loc-nav-desktop-hide': locCount <= 2 }"
              aria-label="Next locations"
              @click="slideNext"
            >
              <Icon name="ion:chevron-forward-outline" />
            </button>
          </div>

          <!-- Map / All Locations card -->
          <div class="multi-loc-card-wrap self-stretch">
            <div class="multi-loc-card multi-map-card">
              <div class="multi-map-iframe-wrap">
                <iframe
                  :src="mapEmbedUrl"
                  width="100%"
                  height="100%"
                  style="border: 0; filter: grayscale(20%) brightness(0.85)"
                  allowfullscreen
                  loading="lazy"
                  referrerpolicy="no-referrer-when-downgrade"
                />
                <div class="multi-map-overlay-pins" />
              </div>
              <div class="multi-map-footer">
                <button type="button" class="multi-map-cta" @click="openModal">
                  View All Websites
                  <svg style="width: 1rem; height: 1rem" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- All-locations modal -->
    <div id="multi-loc-more-modal" class="multi-loc-modal" :hidden="!modalOpen">
      <div class="multi-loc-modal-backdrop" @click="closeModal" />
      <div class="multi-loc-modal-panel" role="dialog" aria-modal="true" aria-label="All locations">
        <div class="multi-loc-modal-header">
          <h3 class="multi-loc-modal-title">All Locations</h3>
          <button type="button" class="btn-icon-circle" aria-label="Close" @click="closeModal">
            <svg style="width: 1.1rem; height: 1.1rem" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="multi-loc-modal-body">
          <div v-for="loc in locations" :key="loc.idx" class="multi-loc-modal-row">
            <div class="multi-loc-modal-row-img">
              <img v-if="loc.img" :src="loc.img" :alt="loc.name" />
              <div v-else class="multi-loc-img-placeholder" />
              <span class="multi-loc-badge">{{ loc.idx + 1 }}</span>
            </div>
            <div class="multi-loc-modal-row-body">
              <h4 class="multi-loc-name">{{ loc.name }}</h4>
              <p class="multi-loc-addr">{{ loc.address }}</p>
              <div class="multi-loc-count">
                <Icon name="ion:car-sport" class="multi-loc-count-icon" />
                {{ loc.vehicleCount }}+ Vehicles
              </div>
              <div class="multi-loc-actions">
                <a :href="loc.website" target="_blank" rel="noopener" class="multi-loc-dir-link truncate"> View Website </a>
                <a :href="loc.mapsUrl" target="_blank" rel="noopener" class="multi-loc-dir-link">
                  Directions
                  <svg style="width: 0.7rem; height: 0.7rem" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* The Blade's <style> block, unchanged apart from the rules for markup it doesn't have (.multi-badge,
   .multi-cta-accent, .multi-locs-cta, .multi-map-overlay-pin*, .lf4-submit-btn, .cta-icon*). Its `.cta-card i`
   (2.3rem Font Awesome glyphs) is `.cta-fa` on the Ionicons that replace them. */

/* ── Shared ─────────────────────────────────────────────────── */
.hero-accent {
  color: color-mix(in srgb, var(--company-primary-base) 70%, #ffffff);
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.25), 0 2px 8px rgba(0, 0, 0, 0.6);
}

.hero-search-btn { background-color: var(--company-primary-base); }
.hero-search-btn:hover { opacity: 0.85; }

.cta-card {
  background: #1e1e1e;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: background 0.2s;
}

.cta-card-get-approve {
  background: linear-gradient(to bottom, color-mix(in srgb, var(--company-primary-base) 25%, #1e2536) 0%, color-mix(in srgb, var(--company-primary-base) 10%, #0d1117) 100%) !important;
  border-color: color-mix(in srgb, var(--company-primary-base) 20%, #111827) !important;
}

.cta-card-get-approve:hover, .cta-card:hover { opacity: 0.90; }

.cta-card-sell {
  background: linear-gradient(to bottom, var(--company-primary-base) 0%, color-mix(in srgb, var(--company-primary-base) 40%, black) 100%) !important;
  border-color: transparent !important;
}

.cta-card-sell:hover { opacity: 0.90; }

.cta-card-accent {
  background: linear-gradient(to bottom, var(--company-primary-base) 0%, color-mix(in srgb, var(--company-primary-base) 90%, black) 100%) !important;
  border-color: transparent !important;
}

.cta-card-accent:hover { opacity: 0.9; }

.cta-arrow { background: rgba(255, 255, 255, 0.1); }

.cta-fa { font-size: 2.3rem; }

/* ── Multi hero section ─────────────────────────────────────── */
.multi-hero-section {
  background: #0d1117;
  position: relative;
  min-height: 75vh;
  display: flex;
  align-items: center;
}

.multi-hero-bg { position: absolute; inset: 0; overflow: hidden; }

.multi-hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
}

.multi-hero-fade {
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, #0d1117 0%, rgba(13,17,23,0.75) 40%, rgba(13,17,23,0.3) 70%, transparent 100%);
}

.multi-hero-fade-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 8rem;
  background: linear-gradient(to bottom, transparent, #0d1117);
}

.multi-hero-content {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding-top: 1rem;
  padding-bottom: 4rem;
}

.multi-hero-top {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.multi-hero-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 36rem;
}

.multi-hero-h1 {
  font-size: clamp(1.875rem, 3.5vw, 3.25rem);
  font-weight: 800;
  color: white;
  line-height: 1.15;
  margin: 0;
}

.multi-hero-sub {
  color: rgba(255,255,255,0.68);
  font-size: 0.9375rem;
  line-height: 1.65;
  max-width: 26rem;
  margin: 0;
}

.multi-search-bar {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 9999px;
  padding: 0.45rem 0.45rem 0.45rem 1rem;
  box-shadow: 0 4px 24px rgba(0,0,0,0.4);
  max-width: 30rem;
  gap: 0.5rem;
}

.multi-search-bar:focus-within { outline: none; box-shadow: 0 4px 24px rgba(0,0,0,0.4); }

.multi-search-icon { width: 1rem; height: 1rem; color: #9ca3af; flex-shrink: 0; }

.multi-search-input:active,
.multi-search-input:focus {
  outline: none;
  border: none;
  box-shadow: none;
  --tw-ring-shadow: none;
  --tw-ring-color: transparent;
}

.multi-search-input {
  flex: 1;
  outline: none;
  border: none;
  font-size: 0.8125rem;
  color: #111827;
  background: transparent;
  min-width: 0;
}

.multi-search-input::placeholder { color: #6b7280; }

.multi-search-loc-wrap {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-shrink: 0;
  padding-right: 0.25rem;
}

.multi-search-loc-divider {
  width: 1px;
  height: 1.25rem;
  background: #e5e7eb;
  flex-shrink: 0;
}

.multi-search-loc-icon {
  font-size: 0.875rem;
  color: var(--company-primary-base);
  flex-shrink: 0;
}

.multi-search-loc-select-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.multi-search-loc-trigger {
  appearance: none;
  background: transparent;
  border: none;
  outline: none;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #111827;
  cursor: pointer;
  padding-right: 1.1rem;
  padding-left: 0.1rem;
  max-width: 9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.multi-search-loc-trigger:focus { outline: none; box-shadow: none; --tw-ring-shadow: none; }

.multi-search-btn:focus { outline: none; box-shadow: none; }

.multi-search-loc-chevron {
  position: absolute;
  right: 0;
  font-size: 0.75rem;
  color: #6b7280;
  pointer-events: none;
  transition: transform 0.15s;
}

.multi-search-loc-chevron-open { transform: rotate(180deg); }

.multi-search-loc-panel {
  position: absolute;
  left: 50%;
  top: calc(100% + 0.9rem);
  transform: translateX(-50%);
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 0.625rem;
  box-shadow: 0 12px 28px rgba(0,0,0,0.18);
  padding: 0.5rem;
  min-width: 22rem;
  z-index: 60;
}

.multi-search-loc-panel::before,
.multi-search-loc-panel::after {
  content: "";
  position: absolute;
  bottom: 100%;
  left: 50%;
  width: 0;
  height: 0;
  border-style: solid;
}

.multi-search-loc-panel::before {
  margin-left: -8px;
  border-width: 0 8px 8px 8px;
  border-color: transparent transparent #d1d5db transparent;
}

.multi-search-loc-panel::after {
  margin-left: -7px;
  bottom: calc(100% - 1px);
  border-width: 0 7px 7px 7px;
  border-color: transparent transparent #ffffff transparent;
}

.multi-search-loc-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  width: 100%;
  text-align: left;
  padding: 0.55rem 0.6rem;
  border-radius: 0.375rem;
  background: none;
  border: none;
  cursor: pointer;
  transition: background 0.12s;
  white-space: nowrap;
}

.multi-search-loc-row:hover { background: #f3f4f6; }

.multi-search-loc-row-name { font-weight: 700; font-size: 0.875rem; color: #111827; }
.multi-search-loc-row-addr { font-size: 0.8125rem; color: #4b5563; }

.multi-search-btn {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: none;
  cursor: pointer;
}

/* ── CTA row ────────────────────────────────────────────────── */
/* .multi-cta-card / icon / body / title / sub / arrow are global (assets/css/main.css). */
.multi-cta-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin-top: -0.5rem;
}

/* ── Locations section ──────────────────────────────────────── */
.multi-locs-section { background: #0d1117; padding: 0.5rem 0 1rem; }

.multi-locs-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
  align-items: stretch;
}

.multi-locs-eyebrow {
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin: 0;
}

.multi-locs-h2 { color: white; font-size: 1.875rem; font-weight: 800; line-height: 1.2; margin: 0; }
.multi-locs-desc { color: rgba(255,255,255,0.58); font-size: 0.875rem; line-height: 1.65; margin: 0; }

/* ── Location slider (2 visible on desktop, 1 on mobile) ─────── */
.multi-loc-slider-wrap {
  grid-column: span 2;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.multi-loc-slider-viewport {
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.multi-loc-slider-viewport::-webkit-scrollbar { display: none; }

.multi-loc-slider-track {
  display: flex;
  gap: 1.25rem;
}

.multi-loc-slider-track .multi-loc-card-wrap {
  flex: 0 0 calc(50% - 0.625rem);
  scroll-snap-align: start;
}

.multi-loc-nav {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.06);
  color: white;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
  transition: background 0.15s;
}

.multi-loc-nav:hover { background: rgba(255,255,255,0.14); }

/* ── Location card ──────────────────────────────────────────── */
.multi-loc-card-wrap { display: flex; flex-direction: column; }

.multi-loc-card {
  border-radius: 0.875rem;
  overflow: hidden;
  background: #111827;
  border: 1px solid rgba(255,255,255,0.09);
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: border-color 0.2s;
}

.multi-loc-card:hover { border-color: rgba(255,255,255,0.2); }

.multi-loc-img-wrap { position: relative; height: 9.5rem; overflow: hidden; flex-shrink: 0; }

.multi-loc-img { width: 100%; height: 100%; object-fit: cover; object-position: center top; transition: transform 0.3s; }
.multi-loc-card:hover .multi-loc-img { transform: scale(1.04); }

.multi-loc-img-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1e2536 0%, #0d1117 100%);
}

.multi-loc-img-fade {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3.5rem;
  background: linear-gradient(to bottom, transparent, #111827);
  pointer-events: none;
}

.multi-loc-badge {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  background: var(--company-primary-base);
  border: 2px solid white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 800;
  color: white;
  box-shadow: 0 2px 6px rgba(0,0,0,0.4);
}

.multi-loc-body { padding: 1rem; flex: 1; display: flex; flex-direction: column; gap: 0.375rem; }
.multi-loc-name { color: white; font-weight: 700; font-size: 0.9375rem; margin: 0; line-height: 1.3; }
.multi-loc-addr { color: rgba(255,255,255,0.5); font-size: 0.8rem; margin: 0; line-height: 1.4; }

.multi-loc-count {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: rgba(255,255,255,0.65);
  font-size: 0.8125rem;
  font-weight: 500;
  margin-top: 0.25rem;
}

.multi-loc-count-icon { font-size: 0.8rem; color: rgba(255,255,255,0.5); }

.multi-loc-actions {
  margin-top: auto;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255,255,255,0.07);
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.multi-loc-dir-link {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  color: #ffffff;
  font-size: 0.8125rem;
  font-weight: 600;
  text-decoration: none;
  padding: 0.5rem 0.9rem;
  border-radius: 0.25rem;
  border: 1px solid rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.06);
  transition: background 0.15s, border-color 0.15s;
}

.multi-loc-dir-link:hover {
  color: #ffffff;
  background: rgba(255,255,255,0.12);
  border-color: rgba(255,255,255,0.28);
}

/* ── Map card ───────────────────────────────────────────────── */
.multi-map-card { background: #0d1117 !important; }

.multi-map-iframe-wrap {
  flex: 1;
  position: relative;
  min-height: 14rem;
  overflow: hidden;
}

.multi-map-iframe-wrap iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}

.multi-map-overlay-pins {
  position: absolute;
  bottom: 0.75rem;
  left: 0.75rem;
  right: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  pointer-events: none;
}

.multi-map-footer { padding: 0.875rem 1rem; border-top: 1px solid rgba(255,255,255,0.07); flex-shrink: 0; }

.multi-map-cta {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  color: #ffffff;
  font-size: 0.8125rem;
  font-weight: 600;
  text-decoration: none;
  padding: 0.5rem 0.9rem;
  border-radius: 0.25rem;
  border: 1px solid rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.06);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.multi-map-cta:hover {
  color: #ffffff;
  background: rgba(255,255,255,0.12);
  border-color: rgba(255,255,255,0.28);
}

/* ── All-locations modal ────────────────────────────────────── */
.multi-loc-modal {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.multi-loc-modal[hidden] { display: none; }

.multi-loc-modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.65);
}

.multi-loc-modal-panel {
  position: relative;
  background: #111827;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 1rem;
  width: 100%;
  max-width: 40rem;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.multi-loc-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  flex-shrink: 0;
}

.multi-loc-modal-title { color: white; font-size: 1.125rem; font-weight: 800; margin: 0; }

.multi-loc-modal-body {
  overflow-y: auto;
  padding: 1rem 1.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.multi-loc-modal-row {
  display: flex;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255,255,255,0.07);
}

.multi-loc-modal-row:last-child { border-bottom: none; padding-bottom: 0; }

.multi-loc-modal-row-img {
  position: relative;
  width: 6rem;
  height: 4.5rem;
  border-radius: 0.625rem;
  overflow: hidden;
  flex-shrink: 0;
}

.multi-loc-modal-row-img img { width: 100%; height: 100%; object-fit: cover; object-position: center top; }

.multi-loc-modal-row-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.3rem; }
.multi-loc-modal-row-body .multi-loc-name { font-size: 0.9375rem; }

/* ── Responsive ─────────────────────────────────────────────── */
@media (max-width: 1023px) {
  .multi-cta-grid { grid-template-columns: repeat(2, 1fr); }
  .multi-locs-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 641px) {
  .multi-loc-nav-desktop-hide { display: none; }
}

@media (max-width: 640px) {
  .multi-search-loc-wrap { display: none; }
  .multi-cta-grid { grid-template-columns: 1fr 1fr; }
  .multi-locs-grid { grid-template-columns: 1fr; }
  .multi-loc-slider-wrap { grid-column: span 1; }
  .multi-loc-slider-track .multi-loc-card-wrap { flex-basis: 100%; }
  .multi-hero-section { min-height: 60vh; }
}

@media (max-width: 992px) {
  .multi-hero-fade {
    background: linear-gradient(to bottom, rgba(13,17,23,0.3) 0%, rgba(13,17,23,0.85) 70%, #0d1117 100%);
  }
}
</style>
