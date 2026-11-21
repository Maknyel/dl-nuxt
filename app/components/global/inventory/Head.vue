<script setup lang="ts">
/**
 * Browse Inventory (index-live's head card): the title and the stock, the keyword search, and the Popular chips
 * (All, Under $20K, SUVs, Trucks, Sedans) with their counts. The stock and counts are the page load's (this card was
 * outside the Laravel page's swapped regions); the chips' active state follows every search.
 */
import type { InventoryResponse } from '~/composables/useInventorySearch'

const props = defineProps<{ data: InventoryResponse }>()
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
          <input v-model="term" type="text" name="search" placeholder="Search by make, model, body style, or keyword" />
          <button type="submit" class="srp-head-search-btn"><Icon name="ion:search-outline" /> Search</button>
        </form>
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
