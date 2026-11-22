<script setup lang="ts">
/**
 * The inventory page (global/cars/index-live.blade.php): the Browse Inventory card, then the Refine Your Search
 * sidebar beside the results (toolbar, vehicle cards, pagination). Owns the search state (useInventorySearch) and the
 * page-level scripts: the measured sticky top for the sidebar (srp-theme's `--srp-pin-top`), the grid view, and the
 * loading / error state of the vehicleSearch component.
 */
import '~/components/global/inventory/inventory.css'
import {
  createInventorySearch,
  INVENTORY_SEARCH,
  type InventoryResponse,
} from '~/composables/useInventorySearch'
import InventoryHead from './Head.vue'
import InventorySidebar from './Sidebar.vue'
import InventoryTopMenu from './TopMenu.vue'
import InventoryVehicleList from './VehicleList.vue'

const props = defineProps<{
  data: InventoryResponse | null
  pending: boolean
  error: boolean
  refresh: () => Promise<void>
}>()

/** The last answer: a failed search keeps the results on screen under the error line, as the Laravel swap did. */
const shown = ref<InventoryResponse | null>(props.data)
watch(
  () => props.data,
  (d) => {
    if (d) shown.value = d
  },
)

const search = createInventorySearch(shown, props.refresh)
provide(INVENTORY_SEARCH, search)

const loading = computed(() => props.pending || search.loading.value)
const errorText = computed(() =>
  props.error && !loading.value ? 'Something went wrong loading vehicles. Please try again.' : '',
)

// The Browse Inventory card is outside the Laravel page's swapped regions: its stock and chip counts are the first
// load's (the chips' active state follows every search).
const head = shallowRef(shown.value)

const root = ref<HTMLElement | null>(null)
let cleanup = () => {}

onMounted(() => {
  // srp-theme: the sidebar sticks 8px under whatever is pinned at the window's top (the four navs differ).
  let queued = false
  const pinnedBottom = () => {
    let el = document.elementFromPoint(window.innerWidth / 2, 1) as HTMLElement | null
    while (el && el !== document.body && el !== document.documentElement) {
      if (el.id === 'car-search-page') return 0
      const pos = getComputedStyle(el).position
      if (pos === 'sticky' || pos === 'fixed') return Math.max(0, el.getBoundingClientRect().bottom)
      el = el.parentElement
    }
    return 0
  }
  const update = () => {
    queued = false
    const bottom = pinnedBottom()
    root.value?.style.setProperty('--srp-pin-top', `${bottom + 8}px`)
    // The nav's own bottom (ADR-0187): where the pinned Browse card sits.
    root.value?.style.setProperty('--srp-nav-bottom', `${bottom}px`)
    // The open Filters dropdown stays just under the Browse card.
    if (search.filtersOpen.value) search.placeFilters()
  }
  const queue = () => {
    if (queued) return
    queued = true
    requestAnimationFrame(update)
  }
  window.addEventListener('scroll', queue, { passive: true })
  window.addEventListener('resize', queue)
  queue()

  // Back / forward: no field was just touched (vehicleSearch's popstate handler).
  const onPop = () => (search.lastTouched.value = '')
  window.addEventListener('popstate', onPop)

  // viewAsTile(): the page always shows the grid (the list view is hidden) and saves that choice.
  try {
    localStorage.setItem('asTileGrid', 'true')
  } catch {
    // no storage
  }

  cleanup = () => {
    window.removeEventListener('scroll', queue)
    window.removeEventListener('resize', queue)
    window.removeEventListener('popstate', onPop)
    document.body.style.overflow = ''
  }
})
onBeforeUnmount(() => cleanup())
</script>

<template>
  <div id="car-search-page" ref="root">
    <InventoryHead v-if="head" :data="head" :current="shown" />

    <div class="view-vehicles-page pb-2">
      <div class="container">
        <div class="vehicles-layout">
          <InventorySidebar v-if="shown" :key="search.version.value" :data="shown" />

          <!-- Vehicle list (the pagination is in the Browse card, ADR-0186). -->
          <div class="vehicles-main">
            <div id="top-menu-wrapper" class="upper-menu srp-results-head">
              <InventoryTopMenu v-if="shown" :data="shown" />
            </div>
            <div
              v-if="errorText"
              style="
                background: #fee2e2;
                border: 1px solid #fca5a5;
                color: #991b1b;
                border-radius: 0.5rem;
                padding: 0.75rem 1rem;
                margin-bottom: 0.75rem;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 1rem;
              "
            >
              <span>{{ errorText }}</span>
              <button type="button" style="font-weight: 700; white-space: nowrap" @click="refresh()">Retry</button>
            </div>
            <div
              id="car-grid-wrapper"
              class="mb-4"
              :class="{ 'opacity-50 pointer-events-none': loading }"
              style="transition: opacity 0.15s"
            >
              <InventoryVehicleList :data="shown" />
            </div>
            <!-- No pagination card under the cards (ADR-0186, QA): the pagination is in the Browse card. -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
