<script setup lang="ts">
/**
 * Template-1's nav: the port of template-1/nav/layout-4.blade.php (sticky header, logo, the menu as joined tabs, the
 * store / phone / address dropdowns, Get Pre-Approved, and the mobile menu with its phone and address panels).
 */
import type { NavLocation } from '~/types/site'

const route = useRoute()
const { company, mainCompany, menus, locations, logoUrl, isSales } = useSite()

const isDemo = computed(() => isDemoHost(useRequestURL().host))

/**
 * The sales site (dealerlion_sales_template) lists the group's locations only for a Multi account, and links a
 * location's address to its own website; otherwise just the company, with a Google Maps link.
 */
const salesLocations = computed<NavLocation[]>(() => {
  if (company.value.account_type === 'Multi' && mainCompany.value.length) {
    return locations.value.map((loc) => ({ ...loc, mapUrl: loc.website }))
  }
  const address = formatAddress(company.value)
  return [{
    name: company.value.name ?? '',
    phone: company.value.phone_number ?? '',
    email: company.value.email ?? '',
    address,
    // PHP's urlencode(): spaces as '+'.
    mapUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address).replace(/%20/g, '+')}`,
    website: company.value.dl_website ?? '',
    accountType: company.value.account_type ?? '',
    raw: company.value,
  }]
})

const navLocations = computed<NavLocation[]>(() => (isSales.value ? salesLocations.value : locations.value))
const hasNavPhone = computed(() => navLocations.value.some((l) => l.phone !== ''))
const hasNavAddress = computed(() => navLocations.value.some((l) => l.address !== ''))
const showLocationName = computed(() => navLocations.value.length > 1)
const singleLoc = computed(() => navLocations.value.find((l) => l.phone !== ''))
const singleAddr = computed(() => navLocations.value.find((l) => l.address !== ''))
const hasFinance = computed(() => menus.value.some((m) => m.to === '/finance'))

/** "Rochester - Headquarters" for the group's main (Multi) site. */
const locName = (loc: NavLocation) => loc.name + (loc.accountType === 'Multi' ? ' - Headquarters' : '')

// The logo, with Dealer Lion's when the dealer's fails to load (the Blade's onerror).
const logoSrc = ref(logoUrl())
const logoImg = ref<HTMLImageElement | null>(null)
watch(() => logoUrl(), (url) => { logoSrc.value = url })
function onLogoError() {
  if (logoSrc.value !== DEALER_LION_LOGO) logoSrc.value = DEALER_LION_LOGO
}

// The Blade's preloads: Dealer Lion's logo and the dealer's.
const preload = (href: string) =>
  ({ rel: 'preload', as: 'image', type: 'image/png', href, fetchpriority: 'high' }) as const
useHead(() => ({
  link: [preload(DEALER_LION_LOGO), ...(company.value.logo ? [preload(logoUrl())] : [])],
}))

// Desktop dropdowns (Alpine x-data): each closes on a click anywhere but its own button (@click.outside).
const storeOpen = ref(false)
const phoneOpen = ref(false)
const addrOpen = ref(false)
const storeBtn = ref<HTMLElement | null>(null)
const phoneBtn = ref<HTMLElement | null>(null)
const addrBtn = ref<HTMLElement | null>(null)

// Mobile: one panel at a time (menu, phones or address), toggled by its button only (as the Blade's script).
type MobilePanel = 'menu' | 'phone' | 'address' | null
const mobilePanel = ref<MobilePanel>(null)
const mobileStoreOpen = ref(false)
function toggleMobile(panel: Exclude<MobilePanel, null>) {
  mobilePanel.value = mobilePanel.value === panel ? null : panel
}

function onDocumentClick(e: MouseEvent) {
  const target = e.target as Node | null
  const outside = (btn: HTMLElement | null) => !btn || !target || !btn.contains(target)
  if (storeOpen.value && outside(storeBtn.value)) storeOpen.value = false
  if (phoneOpen.value && outside(phoneBtn.value)) phoneOpen.value = false
  if (addrOpen.value && outside(addrBtn.value)) addrOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  // A logo that failed before hydration fired its error event before Vue listened.
  const img = logoImg.value
  if (img && img.complete && img.naturalWidth === 0) onLogoError()
})
onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick))

// The Laravel site loads a new page on every link; here the header stays, so a navigation closes everything.
watch(() => route.fullPath, () => {
  storeOpen.value = phoneOpen.value = addrOpen.value = mobileStoreOpen.value = false
  mobilePanel.value = null
})

const isActive = (to: string) => route.path === to
</script>

<template>
  <!-- for demo site -->
  <div v-if="isDemo" class="sticky top-0 bg-gray-200 w-full z-50 text-center py-2">
    <span class="lg:block hidden col-12 text-xs font-bold text-red-500 text-center flex items-center justify-center text-center">
      Note: This is a Dealer Lion Template Demo Site, For Viewing Purpose Only
    </span>
    <span class="lg:hidden col-12 text-[8px] font-bold text-red-500 text-left flex items-center justify-center text-justify">
      Note: This is a Dealer Lion Template Demo Site, For Viewing Purpose Only
    </span>
  </div>

  <header id="sticky-header" class="top-0 left-0 w-full z-50 sticky relative">
    <div class="nav-header-bg border-b nav-header-border">
      <!-- Top row: logo + menu + phone & address + hamburger -->
      <div class="h-14 max-w-7xl mx-auto flex items-center justify-between gap-6 nav-topbar-border">
        <NuxtLink to="/" class="flex items-center shrink-0 w-44" style="flex-shrink: 1; min-width: 0;">
          <img
            ref="logoImg"
            class="w-auto max-h-[44px]"
            style="max-width: 100%;"
            :src="logoSrc"
            :alt="company.name"
            @error="onLogoError"
          >
        </NuxtLink>

        <!-- Nav links (desktop only) -->
        <div class="nav-pill hidden lg:flex items-center justify-center xl:gap-1 gap-0.5">
          <NuxtLink
            v-for="menu in menus"
            :key="menu.to"
            :to="menu.to"
            class="xl:text-sm text-xs font-bold nav-link whitespace-nowrap"
            :class="isActive(menu.to) ? 'nav-link-active' : ''"
          >
            {{ menu.label }}
          </NuxtLink>

          <!-- More than one location (Multi account, or a single-location site grouped with siblings) -->
          <div v-if="!isSales && navLocations.length > 1" class="relative">
            <button
              ref="storeBtn"
              type="button"
              class="xl:text-sm text-xs font-bold nav-link whitespace-nowrap flex items-center gap-1"
              @click="storeOpen = !storeOpen"
            >
              Store Locations
              <Icon
                name="ion:chevron-down"
                class="text-[0.7rem]"
                :class="storeOpen ? 'rotate-180' : ''"
                style="transition: transform .15s, rotate .15s;"
              />
            </button>
            <div class="absolute left-1/2 -translate-x-1/2 top-full mt-3 z-50">
              <Transition
                enter-active-class="transition ease-out duration-150"
                enter-from-class="opacity-0 -translate-y-2"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition ease-in duration-100"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 -translate-y-2"
              >
                <div
                  v-show="storeOpen"
                  class="nav-tooltip nav-tooltip-center bg-white border border-gray-300 rounded-lg shadow-lg px-4 py-3 whitespace-nowrap flex flex-col gap-2"
                >
                  <template v-for="(loc, i) in navLocations" :key="i">
                    <a
                      v-if="loc.address !== ''"
                      :href="loc.website"
                      target="_blank"
                      class="nav-loc-row flex items-center justify-between gap-4 px-2 py-1.5 -mx-2 rounded-md"
                    >
                      <span v-if="showLocationName && loc.name !== ''" class="text-sm font-semibold text-gray-900">{{ locName(loc) }}</span>
                      <span class="text-sm text-gray-800">{{ loc.address }}</span>
                    </a>
                  </template>
                </div>
              </Transition>
            </div>
          </div>
        </div>

        <!-- Phone & address (desktop) -->
        <div class="hidden lg:flex justify-end items-center gap-2 shrink-0">
          <!-- Sales site: one location's phone is a call link with a hover tooltip, its address a map link; several
               locations open a list. -->
          <template v-if="isSales">
            <template v-if="hasNavPhone">
              <div v-if="navLocations.length === 1 && singleLoc" class="relative group">
                <a :href="`tel:${singleLoc.phone}`" class="nav-icon-btn nav-phone">
                  <Icon name="ion:call-outline" aria-hidden="true" style="width:1.05rem;height:1.05rem;display:block;" />
                </a>
                <!-- pt-1 bridges the gap so hover isn't lost when moving to the tooltip -->
                <div class="absolute right-0 top-full pt-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-50 transition-opacity duration-150">
                  <div class="bg-white border border-gray-300 rounded-lg shadow-lg px-4 py-2 whitespace-nowrap">
                    <span class="text-sm font-semibold text-gray-800">{{ formatPhone(singleLoc.phone) }}</span>
                  </div>
                </div>
              </div>
              <div v-else-if="navLocations.length !== 1" class="relative">
                <button ref="phoneBtn" type="button" class="nav-icon-btn nav-phone" @click="phoneOpen = !phoneOpen">
                  <Icon name="ion:call-outline" aria-hidden="true" style="width:1.05rem;height:1.05rem;display:block;" />
                </button>
                <Transition
                  enter-active-class="transition ease-[cubic-bezier(0.4,0,0.2,1)] duration-150"
                  enter-from-class="opacity-0 scale-95"
                  leave-active-class="transition ease-[cubic-bezier(0.4,0,0.2,1)] duration-150"
                  leave-to-class="opacity-0 scale-95"
                >
                  <div
                    v-show="phoneOpen"
                    class="absolute right-0 top-full mt-3 bg-white border border-gray-300 rounded-lg shadow-lg px-4 py-3 whitespace-nowrap z-50 flex flex-col gap-2"
                  >
                    <template v-for="(loc, i) in navLocations" :key="i">
                      <div v-if="loc.phone !== ''" class="flex items-center justify-between gap-4">
                        <span v-if="showLocationName && loc.name !== ''" class="text-sm font-semibold text-gray-900">{{ loc.name }}</span>
                        <a :href="`tel:${loc.phone}`" class="text-sm font-semibold text-gray-800 hover:underline">{{ formatPhone(loc.phone) }}</a>
                      </div>
                    </template>
                  </div>
                </Transition>
              </div>
            </template>
            <template v-if="hasNavAddress">
              <template v-if="navLocations.length === 1">
                <a v-if="singleAddr" :href="singleAddr.mapUrl" target="_blank" class="nav-icon-btn nav-phone">
                  <Icon name="ion:location-outline" aria-hidden="true" style="width:1.05rem;height:1.05rem;display:block;" />
                </a>
              </template>
              <div v-else class="relative">
                <button ref="addrBtn" type="button" class="nav-icon-btn nav-phone" @click="addrOpen = !addrOpen">
                  <Icon name="ion:location-outline" aria-hidden="true" style="width:1.05rem;height:1.05rem;display:block;" />
                </button>
                <Transition
                  enter-active-class="transition ease-[cubic-bezier(0.4,0,0.2,1)] duration-150"
                  enter-from-class="opacity-0 scale-95"
                  leave-active-class="transition ease-[cubic-bezier(0.4,0,0.2,1)] duration-150"
                  leave-to-class="opacity-0 scale-95"
                >
                  <div
                    v-show="addrOpen"
                    class="absolute right-0 top-full mt-3 bg-white border border-gray-300 rounded-lg shadow-lg px-4 py-3 whitespace-nowrap z-50 flex flex-col gap-2"
                  >
                    <template v-for="(loc, i) in navLocations" :key="i">
                      <div v-if="loc.address !== ''" class="flex items-center justify-between gap-4">
                        <span v-if="showLocationName && loc.name !== ''" class="text-sm font-semibold text-gray-900">{{ loc.name }}</span>
                        <a :href="loc.mapUrl" target="_blank" class="text-sm text-gray-800 hover:underline">{{ loc.address }}</a>
                      </div>
                    </template>
                  </div>
                </Transition>
              </div>
            </template>
          </template>

          <template v-if="!isSales && hasNavPhone">
            <template v-if="navLocations.length === 1">
              <div v-if="singleLoc" class="relative">
                <button ref="phoneBtn" type="button" class="nav-icon-btn nav-phone" @click="phoneOpen = !phoneOpen">
                  <Icon name="ion:call-outline" aria-hidden="true" style="width:1.05rem;height:1.05rem;display:block;" />
                </button>
                <Transition
                  enter-active-class="transition ease-[cubic-bezier(0.4,0,0.2,1)] duration-150"
                  enter-from-class="opacity-0 scale-95"
                  leave-active-class="transition ease-[cubic-bezier(0.4,0,0.2,1)] duration-75"
                  leave-to-class="opacity-0 scale-95"
                >
                  <div
                    v-show="phoneOpen"
                    class="nav-tooltip absolute right-0 top-full mt-3 bg-white border border-gray-300 rounded-lg shadow-lg px-4 py-3 whitespace-nowrap z-50"
                  >
                    <a :href="`tel:${singleLoc.phone}`" class="text-sm font-semibold text-gray-800 hover:underline">{{ formatPhone(singleLoc.phone) }}</a>
                  </div>
                </Transition>
              </div>
            </template>
            <div v-else class="relative">
              <button ref="phoneBtn" type="button" class="nav-icon-btn nav-phone" @click="phoneOpen = !phoneOpen">
                <Icon name="ion:call-outline" aria-hidden="true" style="width:1.05rem;height:1.05rem;display:block;" />
              </button>
              <Transition
                enter-active-class="transition ease-[cubic-bezier(0.4,0,0.2,1)] duration-150"
                enter-from-class="opacity-0 scale-95"
                leave-active-class="transition ease-[cubic-bezier(0.4,0,0.2,1)] duration-75"
                leave-to-class="opacity-0 scale-95"
              >
                <div
                  v-show="phoneOpen"
                  class="nav-tooltip absolute right-0 top-full mt-3 bg-white border border-gray-300 rounded-lg shadow-lg px-4 py-3 whitespace-nowrap z-50 flex flex-col gap-2"
                >
                  <div class="flex items-center justify-between gap-4 pb-1">
                    <span class="text-base font-semibold text-gray-black flex items-center gap-2">
                      <Icon name="ion:call" aria-hidden="true" style="width:1rem;height:1rem;color:var(--company-primary-base);" />
                      Contact Us
                    </span>
                    <button type="button" aria-label="Close" class="text-gray-400 hover:text-gray-700" @click="phoneOpen = false">
                      <Icon name="ion:close" style="width:1.1rem;height:1.1rem;display:block;" />
                    </button>
                  </div>
                  <template v-for="(loc, i) in navLocations" :key="i">
                    <div v-if="loc.phone !== ''" class="flex flex-col gap-1 border-t border-zinc-400 pt-2">
                      <a :href="`tel:${loc.phone}`" class="text-base font-semibold text-black flex gap-2 items-center">
                        <Icon name="ion:call" aria-hidden="true" style="width:1rem;height:1rem;color:var(--company-primary-base);" />
                        {{ formatPhone(loc.phone) }}
                      </a>
                      <span v-if="showLocationName && loc.name !== ''" class="text-xs text-black flex gap-2 items-center">
                        <span class="block" style="width:1rem;height:1rem;" />
                        <a :href="loc.website" target="_blank" class="hover:underline">{{ locName(loc) }}</a>
                      </span>
                      <a v-if="loc.address !== ''" :href="loc.website" target="_blank" class="flex gap-2 text-xs text-black hover:underline">
                        <span class="block" style="width:1rem;height:1rem;" />{{ loc.address }}</a>
                    </div>
                  </template>
                </div>
              </Transition>
            </div>
          </template>

          <!-- Standalone address icon: only for a true single, ungrouped location (grouped ones show their
               addresses in the phone dropdown above). -->
          <div v-if="!isSales && hasNavAddress && navLocations.length <= 1 && singleAddr" class="relative">
            <button ref="addrBtn" type="button" class="nav-icon-btn nav-phone" @click="addrOpen = !addrOpen">
              <Icon name="ion:location-outline" aria-hidden="true" style="width:1.05rem;height:1.05rem;display:block;" />
            </button>
            <Transition
              enter-active-class="transition ease-[cubic-bezier(0.4,0,0.2,1)] duration-150"
              enter-from-class="opacity-0 scale-95"
              leave-active-class="transition ease-[cubic-bezier(0.4,0,0.2,1)] duration-75"
              leave-to-class="opacity-0 scale-95"
            >
              <div
                v-show="addrOpen"
                class="nav-tooltip absolute right-0 top-full mt-3 bg-white border border-gray-300 rounded-lg shadow-lg px-4 py-3 whitespace-nowrap z-50"
              >
                <a :href="singleAddr.mapUrl" target="_blank" class="text-sm text-gray-800 hover:underline">{{ singleAddr.address }}</a>
              </div>
            </Transition>
          </div>

          <!-- Get Pre-Approved: the credit app, when the dealer shows it. -->
          <NuxtLink v-if="hasFinance" to="/finance" class="nav-cta ml-2">
            Get Pre-Approved
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.25"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              style="width:0.9rem;height:0.9rem;"
            >
              <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
            </svg>
          </NuxtLink>
        </div>

        <!-- Mobile actions: phone, address, hamburger -->
        <div class="lg:hidden flex items-center gap-1 mr-3">
          <button
            v-if="hasNavPhone"
            type="button"
            class="p-2 rounded-sm nav-phone"
            :aria-expanded="mobilePanel === 'phone' ? 'true' : 'false'"
            aria-label="Phone numbers"
            @click="toggleMobile('phone')"
          >
            <Icon name="ion:call" aria-hidden="true" style="width:1.5rem;height:1.5rem;display:block;" />
          </button>
          <button
            v-if="hasNavAddress && (isSales || navLocations.length <= 1)"
            type="button"
            class="p-2 rounded-sm nav-phone"
            :aria-expanded="mobilePanel === 'address' ? 'true' : 'false'"
            aria-label="Locations"
            @click="toggleMobile('address')"
          >
            <Icon name="ion:location" aria-hidden="true" style="width:1.5rem;height:1.5rem;display:block;" />
          </button>
          <button
            type="button"
            class="p-2 rounded-sm nav-hamburger"
            :aria-expanded="mobilePanel === 'menu' ? 'true' : 'false'"
            aria-label="Menu"
            @click="toggleMobile('menu')"
          >
            <svg class="w-6 h-6" :class="mobilePanel === 'menu' ? 'hidden' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg class="w-6 h-6" :class="mobilePanel === 'menu' ? '' : 'hidden'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile menu dropdown -->
      <div
        class="lg:hidden nav-mobile-bg absolute top-full left-0 w-full px-6 shadow-lg z-[200] border-t nav-header-border"
        :class="mobilePanel === 'menu' ? '' : 'hidden'"
      >
        <NuxtLink
          v-for="menu in menus"
          :key="menu.to"
          :to="menu.to"
          class="flex items-center py-3 text-sm font-medium nav-link border-b nav-mobile-border last:border-0"
        >
          {{ menu.label }}
        </NuxtLink>

        <!-- Store locations (Multi account, or a single-location site grouped with siblings) -->
        <div v-if="!isSales && navLocations.length > 1" class="border-b nav-mobile-border last:border-0">
          <button
            type="button"
            class="w-full flex items-center justify-between py-3 text-sm font-medium nav-link"
            @click="mobileStoreOpen = !mobileStoreOpen"
          >
            <span>Store Locations</span>
            <Icon
              name="ion:chevron-down"
              class="text-base"
              :class="mobileStoreOpen ? 'rotate-180' : ''"
              style="transition: transform .15s, rotate .15s;"
            />
          </button>
          <Transition
            enter-active-class="transition ease-out duration-150"
            enter-from-class="opacity-0 -translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
          >
            <div v-show="mobileStoreOpen" class="flex flex-col gap-3 pb-3">
              <template v-for="(loc, i) in navLocations" :key="i">
                <a
                  v-if="loc.address !== ''"
                  :href="loc.website"
                  target="_blank"
                  class="nav-loc-row flex items-start gap-2 nav-link px-2 py-2 -mx-2 rounded-md"
                >
                  <Icon name="ion:location" class="text-base mt-0.5 shrink-0" style="color: var(--company-primary-base);" />
                  <span class="flex flex-col">
                    <span v-if="loc.name !== ''" class="text-sm font-semibold">{{ locName(loc) }}</span>
                    <span class="text-xs text-gray-600">{{ loc.address }}</span>
                  </span>
                </a>
              </template>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Mobile phone dropdown -->
      <div
        v-if="hasNavPhone"
        class="lg:hidden nav-mobile-bg absolute top-full left-0 w-full px-6 shadow-lg z-[200] border-t nav-header-border"
        :class="mobilePanel === 'phone' ? '' : 'hidden'"
      >
        <!-- Sales site: each phone is one call link (the location's name above it when there are several). -->
        <template v-if="isSales">
          <template v-for="(loc, i) in navLocations" :key="i">
            <a
              v-if="loc.phone !== ''"
              :href="`tel:${loc.phone}`"
              class="flex flex-col items-center gap-2 py-3 text-sm nav-phone font-semibold border-b nav-mobile-border last:border-0"
            >
              <span v-if="showLocationName && loc.name !== ''" class="text-gray-900">{{ loc.name }}</span>
              {{ formatPhone(loc.phone) }}
            </a>
          </template>
        </template>
        <template v-for="(loc, i) in (isSales ? [] : navLocations)" :key="i">
          <div
            v-if="loc.phone !== ''"
            class="flex flex-col items-center gap-1 py-3 text-sm nav-phone font-semibold border-b nav-mobile-border last:border-0"
          >
            <a :href="`tel:${loc.phone}`" class="hover:underline">{{ formatPhone(loc.phone) }}</a>
            <a v-if="showLocationName && loc.name !== ''" :href="loc.website" target="_blank" class="text-gray-900 hover:underline">{{ locName(loc) }}</a>
            <a
              v-if="navLocations.length > 1 && loc.address !== ''"
              :href="loc.website"
              target="_blank"
              class="text-xs font-normal text-gray-600 hover:underline text-center"
            >{{ loc.address }}</a>
          </div>
        </template>
      </div>

      <!-- Mobile address dropdown (true single, ungrouped location only) -->
      <div
        v-if="hasNavAddress && (isSales || navLocations.length <= 1)"
        class="lg:hidden nav-mobile-bg absolute top-full left-0 w-full px-6 shadow-lg z-[200] border-t nav-header-border"
        :class="mobilePanel === 'address' ? '' : 'hidden'"
      >
        <template v-for="(loc, i) in navLocations" :key="i">
          <a
            v-if="loc.address !== ''"
            :href="loc.mapUrl"
            target="_blank"
            class="flex flex-col items-center gap-2 py-3 text-sm nav-phone font-semibold border-b nav-mobile-border last:border-0"
          >
            <span v-if="showLocationName && loc.name !== ''" class="text-gray-900">{{ loc.name }}</span>
            {{ loc.address }}
          </a>
        </template>
      </div>
    </div>
  </header>
</template>

<style scoped>
.nav-header-bg {
  background: #ffffff;
  font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
}

/* Desktop phone / address: round, lavender. */
.nav-icon-btn {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--company-primary-base) 9%, #ffffff);
  border: 1px solid color-mix(in srgb, var(--company-primary-base) 16%, #ffffff);
  transition: background 0.15s;
}

.nav-icon-btn:hover {
  background: color-mix(in srgb, var(--company-primary-base) 16%, #ffffff);
  opacity: 1 !important;
}

/* The links as a row of joined tabs: each its own border, square inside corners and rounded outer ends; the
   current page filled with a tint of the dealer's primary colour. */
#sticky-header .nav-pill {
  gap: 0;
}

/* Desktop (lg, 992px and up): the menu in the exact middle of the header. Logo | menu | buttons as a grid whose two
   outer columns share the leftover space equally, so the wider button group can't push it left. */
@media (min-width: 992px) {
  #sticky-header .nav-topbar-border {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
  }

  #sticky-header .nav-topbar-border > :first-child {
    justify-self: start;
  }

  #sticky-header .nav-topbar-border > .justify-end {
    justify-self: end;
  }

  /* Every tab the same width: the longest label's. */
  #sticky-header .nav-pill {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 1fr;
    width: max-content;
  }

  .nav-pill > div > .nav-link {
    width: 100%;
  }
}

/* 13px labels from 1200px (Tailwind's xl:text-sm is 14px). */
@media (min-width: 1200px) {
  #sticky-header .nav-pill .nav-link {
    font-size: 13px;
    /* Tailwind 3's text-sm line height (20px); Tailwind 4's is relative (1.43), so 13px text would give 18.6px. */
    line-height: 1.25rem;
  }
}

/* Medium screens (992–1199px): the tabs sit at the right, just before the buttons, at their natural widths with
   tighter padding; the logo's box shrinks to the image; the gaps narrow. */
@media (min-width: 992px) and (max-width: 1199px) {
  #sticky-header .nav-topbar-border {
    display: flex;
    gap: 12px;
  }

  #sticky-header .nav-topbar-border > :first-child {
    width: auto;
  }

  #sticky-header .nav-pill {
    display: flex;
    margin-left: auto;
  }

  #sticky-header .nav-pill .nav-link {
    padding-left: 0.375rem;
    padding-right: 0.375rem;
  }
}

.nav-pill .nav-link {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.45rem 0.45rem;
  background: #ffffff;
  border: 1px solid color-mix(in srgb, var(--company-primary-base) 28%, #ffffff);
  transition: background-color 0.15s, color 0.15s, border-color 0.15s;
}

/* Neighbours share one border line; the outer ends are fully rounded. */
.nav-pill > * + * {
  margin-left: -1px;
}

.nav-pill > :first-child,
.nav-pill > :first-child > .nav-link {
  border-top-left-radius: 9999px;
  border-bottom-left-radius: 9999px;
}

.nav-pill > :last-child,
.nav-pill > :last-child > .nav-link {
  border-top-right-radius: 9999px;
  border-bottom-right-radius: 9999px;
}

.nav-pill .nav-link:hover {
  z-index: 1;
  background: color-mix(in srgb, var(--company-primary-base) 5%, #ffffff);
  border-color: color-mix(in srgb, var(--company-primary-base) 50%, #ffffff);
}

/* The current page: filled, its full border drawn above its neighbours'. */
.nav-pill .nav-link.nav-link-active {
  z-index: 2;
  background: color-mix(in srgb, var(--company-primary-base) 12%, #ffffff);
  border-color: color-mix(in srgb, var(--company-primary-base) 65%, #ffffff);
}

/* Get Pre-Approved: the dealer's primary exactly as set in Website Settings. */
.nav-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1rem;
  border-radius: var(--t1-btn-radius, 0.5rem);
  font-size: 0.8125rem;
  font-weight: 600;
  white-space: nowrap;
  color: #ffffff;
  background: var(--company-primary-base);
  box-shadow: 0 8px 20px -10px color-mix(in srgb, var(--company-primary-base) 60%, transparent);
  transition: filter 0.15s, transform 0.15s;
}

.nav-cta:hover {
  color: #ffffff;
  filter: brightness(1.06);
  transform: translateY(-1px);
}

.nav-header-border {
  border-color: #e5e7eb;
}

.nav-loc-row {
  display: flex;
  text-decoration: none;
  transition: background-color 0.15s;
  cursor: pointer;
}

.nav-loc-row:hover {
  background-color: #f3f4f6;
}

.nav-link {
  color: #1f1b2d;
  font-weight: 600;
}

.nav-link:hover {
  color: var(--company-primary-base);
}

.nav-link-active {
  color: var(--company-primary-base);
}

.nav-phone {
  color: var(--company-primary-base);
}

.nav-phone:hover {
  opacity: 0.85;
}

.nav-topbar-border {
  border-color: #e5e7eb;
}

.nav-hamburger {
  color: #4b5563;
}

.nav-hamburger:hover {
  background: #f3f4f6;
}

.nav-mobile-bg {
  background: #f9fafb;
}

.nav-mobile-border {
  border-color: #e5e7eb;
}

/* Tooltip arrow pointing up at the icon (near the right edge, under the icon). */
.nav-tooltip::before,
.nav-tooltip::after {
  content: "";
  position: absolute;
  bottom: 100%;
  width: 0;
  height: 0;
  border-style: solid;
}

/* Border-coloured arrow. */
.nav-tooltip::before {
  right: 8px;
  border-width: 0 8px 8px 8px;
  border-color: transparent transparent #d1d5db transparent;
}

/* White fill arrow, nudged 1px down to cover the panel's top border. */
.nav-tooltip::after {
  right: 9px;
  bottom: calc(100% - 1px);
  border-width: 0 7px 7px 7px;
  border-color: transparent transparent #ffffff transparent;
}

/* Centred arrow variant. */
.nav-tooltip-center::before {
  right: auto;
  left: 50%;
  margin-left: -8px;
}

.nav-tooltip-center::after {
  right: auto;
  left: 50%;
  margin-left: -7px;
}

/* An 8px side padding once the row runs the full screen width; the cap grows by the same 16px. */
#sticky-header .nav-topbar-border {
  max-width: calc(80rem + 16px);
  padding-left: 8px;
  padding-right: 8px;
}

/* 1200–1299px: the gaps between the logo, the tabs and the buttons narrow to 12px. */
@media (min-width: 1200px) and (max-width: 1299px) {
  #sticky-header .nav-topbar-border {
    column-gap: 12px;
  }
}
</style>
