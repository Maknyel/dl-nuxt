<script setup lang="ts">
/**
 * The results toolbar (global/cars/top-menu-live.blade.php): "Showing x–y of N", the N Filters badge and Clear All,
 * Sort By, and the phone's Filters button (opens the sidebar as an off-canvas panel). The N Filters badge opens the
 * Active Filters modal, whose chips each remove their filter at once. (Its keyword search is hidden by srp-theme; the
 * Browse card has the search. The grid / list buttons are hidden: the page always shows the grid.)
 */
import type { InventoryResponse } from '~/composables/useInventorySearch'

const props = defineProps<{ data: InventoryResponse }>()
const search = useInventorySearch()
const { q, qa } = search

type Chip =
  | { label: string; type: 'chip'; key: string; val: string }
  | { label: string; type: 'search' }
  | { label: string; type: 'range'; removeKeys: string[] }

const fmt = (v: unknown) => (Math.trunc(Number(v)) || 0).toLocaleString('en-US')

const allChips = computed<Chip[]>(() => {
  const chips: Chip[] = []
  for (const key of ['make', 'model', 'trim', 'body_type', 'exterior_color', 'interior_color', 'drivetrain', 'transmission']) {
    for (const val of qa(key)) chips.push({ label: val, key, val, type: 'chip' })
  }
  const locNames = new Map(props.data.filters.getavailablecompanies.map((c) => [String(c.id), c.name]))
  for (const id of qa('company_id')) {
    chips.push({ label: locNames.get(id) ?? `Location #${id}`, key: 'company_id', val: id, type: 'chip' })
  }
  if (q('search')) chips.push({ label: `"${q('search')}"`, type: 'search' })

  if (q('is_internet_price_active') === 'true' && (q('internet_price_from') || q('internet_price_to'))) {
    const from = q('internet_price_from') ? '$' + fmt(q('internet_price_from')) : 'Any'
    const to = q('internet_price_to') ? '$' + fmt(q('internet_price_to')) : 'Any'
    chips.push({
      label: `Price: ${from} – ${to}`,
      type: 'range',
      removeKeys: ['internet_price_from', 'internet_price_to', 'is_internet_price_active'],
    })
  }
  if (q('is_year_active') === 'true' && (q('year_from') || q('year_to'))) {
    chips.push({
      label: `Year: ${q('year_from') || 'Any'} – ${q('year_to') || 'Any'}`,
      type: 'range',
      removeKeys: ['year_from', 'year_to', 'is_year_active'],
    })
  }
  if (q('is_mileage_active') === 'true' && (q('mileage_from') || q('mileage_to'))) {
    const from = q('mileage_from') ? fmt(q('mileage_from')) + ' mi' : 'Any'
    const to = q('mileage_to') ? fmt(q('mileage_to')) + ' mi' : 'Any'
    chips.push({ label: `Mileage: ${from} – ${to}`, type: 'range', removeKeys: ['mileage_from', 'mileage_to', 'is_mileage_active'] })
  }
  return chips
})
const totalFilterCount = computed(() => allChips.value.length)

const activeFilterCount = computed(() => {
  let n = 0
  if (qa('make').length || q('make')) n++
  if (qa('model').length || q('model')) n++
  if (qa('body_type').length || q('body_type')) n++
  if (q('is_year_active') === 'true') n++
  if (q('is_internet_price_active') === 'true') n++
  if (q('is_mileage_active') === 'true') n++
  return n
})

// "Showing 1–12 of 30", from the page and its size.
const showing = computed(() => {
  const count = props.data.inventory_data_count
  const perPage = Math.trunc(Number(q('per_page'))) || 100
  const page = props.data.paging.current_page || Math.trunc(Number(q('page'))) || 1
  return { from: count > 0 ? (page - 1) * perPage + 1 : 0, to: Math.min(page * perPage, count), count }
})

const sortBy = computed(() => q('sort_by') || 'make_asc')
const SORTS = [
  ['price_desc', 'Price: High to Low'],
  ['price_asc', 'Price: Low to High'],
  ['year_desc', 'Year: New to Old'],
  ['year_asc', 'Year: Old to New'],
  ['make_asc', 'Make: A to Z'],
  ['make_desc', 'Make: Z to A'],
] as const

const term = ref(q('search'))

function removeNow(chip: Chip) {
  if (chip.type === 'chip') search.removeFilterValue(chip.key, chip.val)
  else if (chip.type === 'search') search.applyFilters({ search: '' })
  else search.applyFilters(Object.fromEntries(chip.removeKeys.map((k) => [k, ''])))
}

// ── The Filters button and the off-canvas panel ─────────────────────────────────────────────────────
const filterBtn = ref<HTMLElement | null>(null)
function toggleFilters() {
  search.setMobileOpen(!search.mobileOpen.value)
}
function onDocClick(e: MouseEvent) {
  if (!search.mobileOpen.value) return
  const sidebar = document.getElementById('main-sidebar')
  const target = e.target as Node
  if (sidebar && !sidebar.contains(target) && filterBtn.value && !filterBtn.value.contains(target)) {
    search.setMobileOpen(false)
  }
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') search.filterModalOpen.value = false
}
onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div class="flex lg:flex-row flex-col justify-between gap-2 p-3">
    <!-- Left: vehicle count + active filters -->
    <div class="flex-1 flex flex-wrap lg:justify-start justify-between items-center gap-2">
      <div class="inventory-count">
        Showing <span class="inventory-count-num">{{ showing.from }}–{{ showing.to }}</span> of {{ fmt(showing.count) }}
      </div>
      <template v-if="totalFilterCount > 0">
        <button type="button" class="inv-filter-badge" @click="search.filterModalOpen.value = true">
          {{ totalFilterCount }} {{ totalFilterCount === 1 ? 'Filter' : 'Filters' }}
        </button>
        <a href="/pre-owned-cars" class="inventory-clear-all" @click.prevent="search.clearAll()">Clear All</a>
      </template>
    </div>

    <!-- Center: keyword search (hidden by srp-theme) -->
    <form class="flex-1 flex items-center" action="/pre-owned-cars" method="get" @submit.prevent="search.submitSearch(term)">
      <div
        class="inventory-search-wrap w-full flex items-center bg-white rounded-full px-2 py-1 shadow-lg lg:max-w-sm max-w-full border border-zinc-200"
      >
        <input
          v-model="term"
          type="text"
          name="search"
          placeholder="Search by make, model, body style, or keyword"
          class="flex-1 outline-hidden focus:outline-hidden focus:ring-0 text-gray-700 text-[0.7rem] bg-transparent border-0 py-0.5"
        />
        <button type="submit" class="hero-search-btn rounded-full flex items-center justify-center shrink-0">
          <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>
    </form>

    <!-- Right: sort + Filters -->
    <div class="flex items-center gap-2 lg:flex-wrap lg:justify-end lg:flex-1">
      <div class="flex flex-col lg:flex-row lg:items-center gap-0 lg:gap-2">
        <span class="sort-label text-xs lg:text-sm leading-tight">Sort By</span>
        <form action="/pre-owned-cars" method="get" @submit.prevent>
          <select
            name="sort_by"
            class="sort-select"
            :value="sortBy"
            @change="search.changeSort(($event.target as HTMLSelectElement).value)"
          >
            <option v-for="[value, label] in SORTS" :key="value" :value="value">{{ label }}</option>
          </select>
        </form>
      </div>

      <div class="flex items-center justify-center gap-2 ml-auto lg:ml-0">
        <!-- Grid / List view: both hidden (the page always shows the grid). -->
        <div class="flex shadow-sm rounded-lg" style="display: none">
          <button id="tile-button" type="button" class="view-toggle-btn rounded-lg active" title="Grid view" hidden style="display: none">
            <Icon name="ion:grid" />
          </button>
          <button id="listing-button" type="button" class="view-toggle-btn rounded-lg" title="List view" hidden style="display: none">
            <Icon name="ion:list-outline" />
          </button>
        </div>

        <div
          id="filter-button"
          ref="filterBtn"
          class="mobile-filter-btn"
          style="
            border: 1px solid #d1d5db;
            border-radius: 0.375rem;
            padding: 0.35rem 0.75rem;
            background: white;
            cursor: pointer;
            font-size: 0.875rem;
            font-weight: 600;
            position: relative;
          "
          @click="toggleFilters"
        >
          <Icon name="ion:filter-outline" />
          Filters
          <span
            v-if="activeFilterCount > 0"
            id="active-filter-count"
            style="
              position: absolute;
              top: -6px;
              right: -6px;
              background: var(--company-primary-base, #1d4ed8);
              color: white;
              font-size: 10px;
              width: 18px;
              height: 18px;
              border-radius: 9999px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
            "
          >
            {{ activeFilterCount }}
          </span>
        </div>
      </div>
    </div>
  </div>

  <!-- Active Filters modal -->
  <div
    v-if="totalFilterCount > 0"
    v-show="search.filterModalOpen.value"
    id="inv-filter-modal"
    class="inv-fm-overlay"
    @click.self="search.filterModalOpen.value = false"
  >
    <div class="inv-fm-box">
      <div class="inv-fm-head">
        <h4>
          Active Filters <span style="font-size: 0.8rem; font-weight: 500; color: #6b7280">({{ totalFilterCount }})</span>
        </h4>
        <button
          type="button"
          class="text-black cursor-pointer text-2xl flex items-center justify-end inv-fm-close"
          @click="search.filterModalOpen.value = false"
        >
          <Icon name="ion:close-outline" />
        </button>
      </div>
      <div class="inv-fm-body">
        <button v-for="(chip, i) in allChips" :key="i" type="button" class="inv-fm-chip" @click="removeNow(chip)">
          {{ chip.label }} <span>&times;</span>
        </button>
      </div>
      <div class="inv-fm-foot">
        <a
          href="/pre-owned-cars"
          class="inv-fm-clear"
          @click.prevent="
            search.clearAll();
            search.filterModalOpen.value = false
          "
          >Clear Filters</a
        >
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Tailwind 3's lg:text-sm set a fixed 1.25rem line height, which outlived .sort-label's 10px font size (Tailwind 4's
   leading-tight would make it 1.25 × 10px). */
@media (min-width: 992px) {
  .sort-label {
    line-height: 1.25rem;
  }
}
</style>
