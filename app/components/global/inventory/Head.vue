<script setup lang="ts">
/**
 * Browse Inventory (index-live's head card): the title and the stock, the keyword search, the pagination (ADR-0186)
 * and the Filters & Sort button (ADR-0183 / ADR-0188), pinned under the nav while scrolling (ADR-0187). The Popular
 * chips (All, Under $20K, SUVs, Trucks, Sedans) are hidden (ADR-0181) but kept in the markup. The stock and counts are
 * the page load's (`data`: this card was outside the Laravel page's swapped regions); the pagination and the Filters
 * badge follow every search (`current`).
 */
import type { InventoryResponse } from '~/composables/useInventorySearch'
import InventoryPagination from './Pagination.vue'

const props = defineProps<{ data: InventoryResponse; current?: InventoryResponse | null }>()
const search = useInventorySearch()
const route = useRoute()

const bodyTypeChips = props.data.unfiltered_body_type_counts.length
  ? props.data.unfiltered_body_type_counts
  : props.data.filters.vehiclebodytype

const num = (v: unknown) => Math.trunc(Number(v ?? 0)) || 0
const fmt = (n: number) => n.toLocaleString('en-US')
const lower = (v: unknown) => String(v ?? '').toLowerCase()
const TRUCK_TYPES = ['truck', 'pickup truck', 'pickup']

// The stock: with no filter, the inventory's own total; with one, the body types' unfiltered counts.
const srpFiltered = Object.entries(route.query).some(([k, v]) => {
  const key = k.replace(/\[\]$/, '')
  if (['page', 'per_page', 'sort_by', 'list', 'grid'].includes(key)) return false
  const values = (Array.isArray(v) ? v : [v]).filter((x) => x !== null && x !== undefined && String(x) !== '')
  return values.length > 0
})
const srpStock = !srpFiltered
  ? num(props.data.inventory_data_count)
  : bodyTypeChips.reduce((sum, b) => sum + num(b.count), 0)

const suvCount = num(bodyTypeChips.find((b) => lower(b.body_type) === 'suv')?.count)
const truckCount = bodyTypeChips.filter((b) => TRUCK_TYPES.includes(lower(b.body_type))).reduce((s, b) => s + num(b.count), 0)
const sedanCount = bodyTypeChips.filter((b) => lower(b.body_type) === 'sedan').reduce((s, b) => s + num(b.count), 0)
const underCount = num(props.data.under_20k_count)

const bodyTypes = computed(() => search.qa('body_type').map(lower))
const suvActive = computed(() => bodyTypes.value.includes('suv'))
const truckActive = computed(() => bodyTypes.value.some((v) => TRUCK_TYPES.includes(v)))
const sedanActive = computed(() => bodyTypes.value.includes('sedan'))
const underActive = computed(() => search.q('max_price') === '20000')

const term = ref(search.q('search'))

// Phones (ADR-0188): a shorter placeholder, so it isn't cut off in the narrower field.
const placeholder = ref('Search by make, model, body style, or keyword')

// How many filters are on (sidebar-live's $sfActiveCount): the Filters & Sort button's badge.
const activeCount = computed(() => {
  const { q, qa } = search
  const any = (k: string) => qa(k).length > 0 || q(k) !== ''
  let n = 0
  for (const k of ['make', 'model', 'trim', 'body_type', 'drivetrain']) if (any(k)) n++
  if (q('year_from') || q('year_to')) n++
  if (q('mileage_from') || q('mileage_to')) n++
  if (q('internet_price_from') || q('internet_price_to')) n++
  for (const k of ['transmission', 'exterior_color', 'interior_color', 'company_id']) if (any(k)) n++
  return n
})

// ── Filters & Sort (index-live's srpFiltersToggle) ─────────────────────────────────────────────────────
const DESKTOP = 992
function toggleFilters() {
  // Phones and tablets (ADR-0188): the full-screen filter panel, as the toolbar's own Filters button did. The click
  // stops here (@click.stop), or the toolbar's outside-click handler would close the panel straight away.
  if (window.innerWidth < DESKTOP) {
    search.setMobileOpen(!search.mobileOpen.value)
    return
  }
  search.setFiltersOpen(!search.filtersOpen.value)
}
// A click outside the dropdown, or Esc, closes it.
function onDocClick(e: MouseEvent) {
  if (!search.filtersOpen.value) return
  const t = e.target as Element | null
  if (t?.closest?.('#main-sidebar, #srp-filters-btn')) return
  search.setFiltersOpen(false)
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') search.setFiltersOpen(false)
}
const onResize = () => {
  if (search.filtersOpen.value) search.placeFilters()
}
onMounted(() => {
  if (window.matchMedia('(max-width: 767px)').matches) placeholder.value = 'Search make, model, keyword'
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKey)
  window.addEventListener('resize', onResize, { passive: true })
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKey)
  window.removeEventListener('resize', onResize)
  search.setFiltersOpen(false)
})
</script>

<template>
  <div v-if="bodyTypeChips.length" class="container srp-head">
    <div class="srp-head-card">
      <div class="srp-head-top">
        <div>
          <h1 class="srp-head-title">Browse Inventory</h1>
          <p class="srp-head-sub"><b>{{ fmt(srpStock) }}</b> quality pre-owned vehicles in stock</p>
        </div>
        <form class="srp-head-search" action="/pre-owned-cars" method="get" @submit.prevent="search.submitSearch(term)">
          <input v-model="term" type="text" name="search" :placeholder="placeholder" />
          <button type="submit" class="srp-head-search-btn"><Icon name="ion:search-outline" /> Search</button>
        </form>
        <!-- The pagination, in the Browse card between the search and Filters & Sort (ADR-0186, QA): the page numbers and
             Show N per page. It was its own card under the cards. -->
        <div id="pagination-wrapper" class="srp-head-pagination">
          <InventoryPagination v-if="current" :data="current" />
        </div>
        <!-- Filters & Sort (ADR-0183 / ADR-0184): on a desktop it opens Refine Your Search (#main-sidebar) as a dropdown
             under the card; below 992px the full-screen panel (ADR-0188). The badge is how many filters are on. -->
        <button
          id="srp-filters-btn"
          type="button"
          class="srp-filters-btn"
          :class="{ 'is-open': search.filtersOpen.value }"
          aria-haspopup="true"
          :aria-expanded="search.filtersOpen.value ? 'true' : 'false'"
          aria-controls="main-sidebar"
          @click.stop="toggleFilters"
        >
          <Icon name="ion:options-outline" aria-hidden="true" />
          <span>Filters &amp; Sort</span>
          <span v-show="activeCount > 0" id="srp-filters-count" class="srp-filters-count">{{ activeCount }}</span>
          <Icon name="ion:chevron-down-outline" class="srp-filters-chevron" aria-hidden="true" />
        </button>
      </div>
      <div id="bt-quickbar-inner" class="srp-head-chips bt-quickbar-inner">
        <div id="bt-chips-container" class="flex flex-row items-center gap-2">
          <div class="inline-flex gap-2">
            <a href="/pre-owned-cars" class="bt-qchip bt-qchip-all" @click.prevent="search.clearAll()">
              <span class="bt-qchip-text">
                <span class="bt-qchip-name">All</span>
                <span class="bt-qchip-count">{{ srpStock > 0 ? fmt(srpStock) : '' }}</span>
              </span>
            </a>

            <a
              :href="underActive ? '/pre-owned-cars' : '/pre-owned-cars?max_price=20000'"
              class="bt-qchip"
              :class="{ active: underActive }"
              data-bt-key="under20k"
              @click.prevent="search.toggleMaxPrice('20000')"
            >
              <span class="bt-qchip-text">
                <span class="bt-qchip-name">Under $20K</span>
                <span class="bt-qchip-count">{{ underCount > 0 ? fmt(underCount) : '' }}</span>
              </span>
            </a>

            <a
              :href="suvActive ? '/pre-owned-cars' : '/pre-owned-cars?body_type%5B0%5D=SUV'"
              class="bt-qchip"
              :class="{ active: suvActive }"
              data-bt-key="suv"
              @click.prevent="search.toggleChip('body_type', 'SUV')"
            >
              <span class="bt-qchip-text">
                <span class="bt-qchip-name">SUVs</span>
                <span class="bt-qchip-count">{{ suvCount > 0 ? fmt(suvCount) : '' }}</span>
              </span>
            </a>

            <a
              :href="truckActive ? '/pre-owned-cars' : '/pre-owned-cars?body_type%5B0%5D=Truck'"
              class="bt-qchip"
              :class="{ active: truckActive }"
              data-bt-key="truck"
              @click.prevent="search.toggleChip('body_type', 'Truck')"
            >
              <span class="bt-qchip-text">
                <span class="bt-qchip-name">Trucks</span>
                <span class="bt-qchip-count">{{ truckCount > 0 ? fmt(truckCount) : '' }}</span>
              </span>
            </a>

            <a
              :href="sedanActive ? '/pre-owned-cars' : '/pre-owned-cars?body_type%5B0%5D=Sedan'"
              class="bt-qchip"
              :class="{ active: sedanActive }"
              data-bt-key="sedan"
              @click.prevent="search.toggleChip('body_type', 'Sedan')"
            >
              <span class="bt-qchip-text">
                <span class="bt-qchip-name">Sedans</span>
                <span class="bt-qchip-count">{{ sedanCount > 0 ? fmt(sedanCount) : '' }}</span>
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
