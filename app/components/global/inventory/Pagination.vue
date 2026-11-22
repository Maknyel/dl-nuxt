<script setup lang="ts">
/**
 * The pagination bar (global/cars/pagination-live.blade.php): ‹ 1 … 4 5 6 … 9 › and "Show N per page". The links keep
 * the Laravel URLs (for a new tab); a click searches in place.
 */
import { INVENTORY_PER_PAGE, type InventoryResponse } from '~/composables/useInventorySearch'

const props = defineProps<{ data: InventoryResponse }>()
const search = useInventorySearch()
const { q, qa } = search

const perPage = computed(() => Math.trunc(Number(q('per_page'))) || INVENTORY_PER_PAGE)
const total = computed(() => props.data.inventory_data_count)
const totalPages = computed(() => (total.value > 0 ? Math.ceil(total.value / perPage.value) : 1))
const current = computed(() => props.data.paging.current_page || Math.trunc(Number(q('page'))) || 1)

const addedParams = computed(() => {
  let s =
    `&list=${q('list')}&grid=${q('grid')}&sort_by=${q('sort_by')}` +
    `&internet_price_from=${q('internet_price_from')}&internet_price_to=${q('internet_price_to')}` +
    `&mileage_from=${q('mileage_from')}&mileage_to=${q('mileage_to')}` +
    `&year_from=${q('year_from')}&year_to=${q('year_to')}` +
    `&search=${encodeURIComponent(q('search'))}&per_page=${perPage.value}&max_price=${q('max_price')}`
  for (const multi of ['make', 'model', 'body_type', 'exterior_color', 'interior_color', 'interior_material']) {
    const suffix = multi === 'interior_material' ? 'interior_materials' : multi
    for (const v of qa(multi)) s += `&${suffix}[]=${encodeURIComponent(v)}`
  }
  return s
})
const pageUrl = (p: number) => `/pre-owned-cars?page=${p}${addedParams.value}`

/** 1 … (cur-1) cur (cur+1) … last */
const pages = computed<(number | '…')[]>(() => {
  const n = totalPages.value
  const cur = current.value
  if (n <= 7) return Array.from({ length: n }, (_, i) => i + 1)
  const out: (number | '…')[] = [1]
  if (cur > 3) out.push('…')
  for (let i = Math.max(2, cur - 1); i <= Math.min(n - 1, cur + 1); i++) out.push(i)
  if (cur < n - 2) out.push('…')
  out.push(n)
  return out
})
</script>

<template>
  <div v-if="total > 0" class="pg-row">
    <div />
    <ul class="pg-list">
      <li class="pg-arrow" :class="{ 'pg-disabled': current <= 1 }">
        <a :href="current > 1 ? pageUrl(current - 1) : '#'" aria-label="Previous" @click.prevent="search.goToPage(current - 1)">
          <Icon name="ion:chevron-back-outline" style="font-size: 1rem" />
        </a>
      </li>

      <template v-for="(pg, i) in pages" :key="i">
        <li v-if="pg === '…'" class="pg-dots"><span>…</span></li>
        <li v-else :class="{ 'pg-active': pg === current }">
          <a :href="pageUrl(pg)" @click.prevent="search.goToPage(pg)">{{ pg }}</a>
        </li>
      </template>

      <li class="pg-arrow" :class="{ 'pg-disabled': current >= totalPages }">
        <a
          :href="current < totalPages ? pageUrl(current + 1) : '#'"
          aria-label="Next"
          @click.prevent="search.goToPage(current + 1)"
        >
          <Icon name="ion:chevron-forward-outline" style="font-size: 1rem" />
        </a>
      </li>
    </ul>

    <form class="pg-perpage" action="/pre-owned-cars" method="get" @submit.prevent>
      <span>Show</span>
      <select name="per_page" :value="perPage" @change="search.changePerPage(($event.target as HTMLSelectElement).value)">
        <!-- 100 in place of 96: the inventory's default page size (ADR-0187). -->
        <option v-for="opt in [12, 24, 48, 100]" :key="opt" :value="opt">{{ opt }}</option>
      </select>
      <span>per page</span>
    </form>
  </div>
</template>
