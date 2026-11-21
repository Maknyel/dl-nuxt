<script setup lang="ts">
/**
 * Refine Your Search (global/cars/sidebar-live.blade.php): the filter form's accordion (Store Location, Price, Body
 * Type, Make, Model, Trim, Year, Mileage, Drivetrain; See More: Exterior, Interior, Transmission), the off-canvas panel
 * on phones and tablets (Apply Filters / View N Vehicles at its bottom). Re-rendered after every search (keyed by the
 * search's version), as the Laravel sidebar was swapped in.
 *
 * A section is open when its filter is set; a section opened or closed by hand stays so (localStorage
 * `sf-section-open-state`), except Body Type, Make and Model. Sections hidden in the builder's Edit Layout mode stay
 * hidden (`sf-hidden-sections`).
 */
import {
  histogram,
  rangeBounds,
  type FacetRow,
  type InventoryResponse,
  type MultiId,
} from '~/composables/useInventorySearch'
import MultiCheckbox from './MultiCheckbox.vue'
import PriceRange from './PriceRange.vue'
import NumberRange from './NumberRange.vue'

const props = defineProps<{ data: InventoryResponse }>()
const search = useInventorySearch()
const { form, q, qa } = search
const f = computed(() => props.data.filters)

const companies = computed(() => f.value.getavailablecompanies)

// ── The ranges: bounds and histograms (the Blade components' PHP) ────────────────────────────────────
const price = computed(() => {
  const b = rangeBounds(f.value.getavailableinternetprice, 'internet_price', '', '')
  return { ...b, ...histogram(f.value.getavailableinternetprice, 'internet_price', b.lo, b.hi) }
})
const year = computed(() => {
  const b = rangeBounds(f.value.getavailableyear, 'year', '', '')
  return { ...b, ...histogram(f.value.getavailableyear, 'year', b.lo, b.hi) }
})
const miles = computed(() => {
  const b = rangeBounds(f.value.getavailablemileage, 'mileage', '', '', { extraMax: 10000 })
  return { ...b, ...histogram(f.value.getavailablemileage, 'mileage', b.lo, b.hi) }
})

function onPrice(v: [number, number]) {
  form.priceValue = v
  form.internet_price_from = String(v[0])
  form.internet_price_to = String(v[1])
}
function onYear(v: [number, number]) {
  form.yearValue = v
  form.year_from = String(v[0])
  form.year_to = String(v[1])
}
function onMileage(v: [number, number]) {
  form.mileageValue = v
  form.mileage_from = String(v[0])
  form.mileage_to = String(v[1])
}

// ── The accordion ───────────────────────────────────────────────────────────────────────────────────
type Section = { key: string; sec: string; title: string; plusMinus?: boolean }
const filled = (k: string) => qa(k).length > 0 || q(k) !== ''
const serverOpen: Record<string, boolean> = {
  location: true,
  price: true,
  body: filled('body_type'),
  make: filled('make'),
  model: filled('model'),
  trim: filled('trim'),
  year: filled('year'),
  mileage: filled('mileage'),
  drive: filled('drivetrain'),
  ext: filled('exterior_color'),
  int: filled('interior_color'),
  trans: filled('transmission'),
}
const open = reactive<Record<string, boolean>>({ ...serverOpen })
const moreOpen = ref(filled('transmission') || filled('fuel_type') || filled('exterior_color') || filled('interior_color'))
const hiddenSections = ref<string[]>([])

const OPEN_KEY = 'sf-section-open-state'
const NO_PERSIST = ['body', 'make', 'model']
function overrides(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(OPEN_KEY) || '{}')
  } catch {
    return {}
  }
}

onMounted(() => {
  const saved = overrides()
  let dirty = false
  for (const key of Object.keys(saved)) {
    if (NO_PERSIST.includes(key)) {
      delete saved[key]
      dirty = true
      continue
    }
    if (key in open) open[key] = !!saved[key]
  }
  if (dirty) {
    try {
      localStorage.setItem(OPEN_KEY, JSON.stringify(saved))
    } catch {
      // no storage
    }
  }
  try {
    hiddenSections.value = JSON.parse(localStorage.getItem('sf-hidden-sections') || '[]')
  } catch {
    hiddenSections.value = []
  }
})

function toggle(key: string) {
  open[key] = !open[key]
  if (NO_PERSIST.includes(key)) return
  const saved = overrides()
  saved[key] = open[key]!
  try {
    localStorage.setItem(OPEN_KEY, JSON.stringify(saved))
  } catch {
    // no storage
  }
}

const multiSections: (Section & { id: MultiId; facet: keyof InventoryResponse['filters'] })[] = [
  { key: 'body', sec: 'sf-sec-body', title: 'Body Type', id: 'body_type', facet: 'vehiclebodytype' },
  { key: 'make', sec: 'sf-sec-make', title: 'Make', id: 'make', facet: 'getavailablemake' },
  { key: 'model', sec: 'sf-sec-model', title: 'Model', id: 'model', facet: 'getavailablemodel' },
  { key: 'trim', sec: 'sf-sec-trim', title: 'Trim', id: 'trim', facet: 'getavailabletrim' },
]
const moreSections: (Section & { id: MultiId; facet: keyof InventoryResponse['filters'] })[] = [
  { key: 'ext', sec: 'sf-sec-ext', title: 'Exterior Color', id: 'exterior', facet: 'getavailableexterior' },
  { key: 'int', sec: 'sf-sec-int', title: 'Interior Color', id: 'interior', facet: 'getavailableinterior' },
  { key: 'trans', sec: 'sf-sec-trans', title: 'Transmission', id: 'transmission', facet: 'getavailabletransmission' },
]

// ── Store Location ──────────────────────────────────────────────────────────────────────────────────
function onLocation(id: string, checked: boolean) {
  const list = form.company_id.filter((v) => v !== id)
  if (checked) list.push(id)
  form.company_id = list
  search.applyFilters()
}
function rowClick(e: MouseEvent) {
  const cb = (e.currentTarget as HTMLElement).querySelector('input[type=checkbox]') as HTMLInputElement | null
  if (cb && e.target !== cb) cb.click()
}
const locHidden = (loc: FacetRow) => {
  const n = parseInt(String(loc.count), 10)
  return !Number.isNaN(n) && n === 0 && !form.company_id.includes(String(loc.id))
}

// ── The phone's panel ───────────────────────────────────────────────────────────────────────────────
const root = ref<HTMLElement | null>(null)
function onSubmit() {
  if (window.innerWidth < 992) search.setMobileOpen(false)
  search.applyFilters()
}
defineExpose({ root })
</script>

<template>
  <div
    id="main-sidebar"
    ref="root"
    class="sidebar-side"
    :class="{ 'sidebar-mobile-open': search.mobileOpen.value }"
  >
    <div class="sidebar-refine">
      <div class="sf-hd">
        <div>
          <div style="display: flex; align-items: center; gap: 0.5rem">
            <h3 style="margin: 0 0 0.3rem">Refine Your Search</h3>
          </div>
          <p class="sf-hd-sub">Filter {{ data.inventory_data_count.toLocaleString('en-US') }} vehicles</p>
        </div>
        <button
          type="button"
          class="sf-mobile-close"
          title="Close filters"
          aria-label="Close filters"
          @click="search.setMobileOpen(false)"
        >
          <Icon name="ion:close-outline" />
        </button>
      </div>

      <form id="submitFilter" action="/pre-owned-cars" method="get" @submit.prevent="onSubmit">
        <!-- Store Location -->
        <div
          v-if="companies.length > 1"
          id="sf-sec-location"
          class="sf-acc"
          :class="{ 'sf-section-hidden': hiddenSections.includes('sf-sec-location') }"
        >
          <div class="sf-acc-hd" :class="{ 'is-closed': !open.location }" @click="toggle('location')">
            <span>Store Location <span class="sf-hidden-badge">hidden</span></span>
            <div style="display: flex; align-items: center; gap: 0.4rem">
              <span class="sf-vis-btn" title="Toggle visibility"><Icon name="ion:eye-outline" /></span>
              <Icon name="ion:chevron-up-outline" class="sf-acc-chevron" />
            </div>
          </div>
          <div id="sf-location" class="sf-acc-body" :class="{ 'sf-hidden': !open.location }" :style="{ display: open.location ? 'block' : 'none' }">
            <div class="dropdown-content flex flex-col">
              <div
                v-for="loc in companies"
                :key="loc.id"
                v-show="!locHidden(loc)"
                class="choices w-full text-black py-2 px-3 cursor-pointer flex gap-2 items-center justify-between"
                @click="rowClick"
              >
                <div class="flex gap-2 items-center">
                  <input
                    type="checkbox"
                    name="company_id[]"
                    :value="loc.id"
                    class="w-[20px] h-[20px]"
                    :checked="form.company_id.includes(String(loc.id))"
                    @change="onLocation(String(loc.id), ($event.target as HTMLInputElement).checked)"
                  />
                  <span>{{ loc.name }}</span>
                </div>
                <span class="text-black text-xs">{{ loc.count }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Price -->
        <div
          v-if="f.getavailableinternetprice.length"
          id="sf-sec-price"
          class="sf-acc"
          :class="{ 'sf-section-hidden': hiddenSections.includes('sf-sec-price') }"
        >
          <div class="sf-acc-hd" :class="{ 'is-closed': !open.price }" @click="toggle('price')">
            <span>Price <span class="sf-hidden-badge">hidden</span></span>
            <div style="display: flex; align-items: center; gap: 0.4rem">
              <span class="sf-vis-btn" title="Toggle visibility"><Icon name="ion:eye-outline" /></span>
              <Icon name="ion:chevron-up-outline" class="sf-acc-chevron" />
            </div>
          </div>
          <div id="sf-price" class="sf-acc-body" :class="{ 'sf-hidden': !open.price }" :style="{ display: open.price ? 'block' : 'none' }">
            <PriceRange
              :model-value="form.priceValue"
              :lo="price.lo"
              :hi="price.hi"
              :bars="price.bars"
              :bkt-size="price.bktSize"
              money
              @update:model-value="onPrice"
              @commit="search.submitRange('internet_price')"
            />
          </div>
        </div>

        <div class="sf-dd-grid">
          <template v-if="f.vehiclebodytype.length">
            <template v-for="s in multiSections" :key="s.key">
              <div
                v-if="f[s.facet].length"
                :id="s.sec"
                class="sf-acc"
                :class="{ 'sf-section-hidden': hiddenSections.includes(s.sec) }"
              >
                <div class="sf-acc-hd" :class="{ 'is-closed': !open[s.key] }" @click="toggle(s.key)">
                  <span>{{ s.title }} <span class="sf-hidden-badge">hidden</span></span>
                  <div style="display: flex; align-items: center; gap: 0.4rem">
                    <span class="sf-vis-btn" title="Toggle visibility"><Icon name="ion:eye-outline" /></span>
                    <Icon name="ion:chevron-up-outline" class="sf-acc-chevron" />
                  </div>
                </div>
                <div
                  :id="`sf-${s.key}`"
                  class="sf-acc-body"
                  :class="{ 'sf-hidden': !open[s.key] }"
                  :style="{ display: open[s.key] ? 'block' : 'none' }"
                >
                  <MultiCheckbox :id="s.id" :choices="f[s.facet]" />
                </div>
              </div>
            </template>

            <!-- Year -->
            <div
              v-if="f.getavailableyear.length"
              id="sf-sec-year"
              class="sf-acc"
              :class="{ 'sf-section-hidden': hiddenSections.includes('sf-sec-year') }"
            >
              <div class="sf-acc-hd" :class="{ 'is-closed': !open.year }" @click="toggle('year')">
                <span>Year <span class="sf-hidden-badge">hidden</span></span>
                <div style="display: flex; align-items: center; gap: 0.4rem">
                  <span class="sf-vis-btn" title="Toggle visibility"><Icon name="ion:eye-outline" /></span>
                  <Icon name="ion:chevron-up-outline" class="sf-acc-chevron" />
                </div>
              </div>
              <div id="sf-year" class="sf-acc-body" :class="{ 'sf-hidden': !open.year }" :style="{ display: open.year ? 'block' : 'none' }">
                <NumberRange
                  :model-value="form.yearValue"
                  :lo="year.lo"
                  :hi="year.hi"
                  :step="1"
                  :miles="false"
                  :bars="year.bars"
                  :bkt-size="year.bktSize"
                  @update:model-value="onYear"
                  @commit="search.submitRange('year')"
                />
              </div>
            </div>

            <!-- Mileage -->
            <div
              v-if="f.getavailablemileage.length"
              id="sf-sec-mileage"
              class="sf-acc"
              :class="{ 'sf-section-hidden': hiddenSections.includes('sf-sec-mileage') }"
            >
              <div class="sf-acc-hd" :class="{ 'is-closed': !open.mileage }" @click="toggle('mileage')">
                <span>Mileage <span class="sf-hidden-badge">hidden</span></span>
                <div style="display: flex; align-items: center; gap: 0.4rem">
                  <span class="sf-vis-btn" title="Toggle visibility"><Icon name="ion:eye-outline" /></span>
                  <Icon name="ion:chevron-up-outline" class="sf-acc-chevron" />
                </div>
              </div>
              <div
                id="sf-mileage"
                class="sf-acc-body"
                :class="{ 'sf-hidden': !open.mileage }"
                :style="{ display: open.mileage ? 'block' : 'none' }"
              >
                <NumberRange
                  :model-value="form.mileageValue"
                  :lo="miles.lo"
                  :hi="miles.hi"
                  :step="1000"
                  miles
                  :bars="miles.bars"
                  :bkt-size="miles.bktSize"
                  @update:model-value="onMileage"
                  @commit="search.submitRange('mileage')"
                />
              </div>
            </div>

            <!-- Drivetrain -->
            <div
              v-if="f.getavailabledrivetrain.length"
              id="sf-sec-drive"
              class="sf-acc"
              :class="{ 'sf-section-hidden': hiddenSections.includes('sf-sec-drive') }"
            >
              <div class="sf-acc-hd" :class="{ 'is-closed': !open.drive }" @click="toggle('drive')">
                <span>Drivetrain <span class="sf-hidden-badge">hidden</span></span>
                <div style="display: flex; align-items: center; gap: 0.4rem">
                  <span class="sf-vis-btn" title="Toggle visibility"><Icon name="ion:eye-outline" /></span>
                  <Icon name="ion:chevron-up-outline" class="sf-acc-chevron" />
                </div>
              </div>
              <div id="sf-drive" class="sf-acc-body" :class="{ 'sf-hidden': !open.drive }" :style="{ display: open.drive ? 'block' : 'none' }">
                <MultiCheckbox id="drivetrain" :choices="f.getavailabledrivetrain" />
              </div>
            </div>
          </template>

          <!-- See More -->
          <div style="border-top: 1px solid #f3f4f6; padding: 0.6rem 1rem">
            <button
              id="sf-see-more-btn"
              type="button"
              style="
                display: flex;
                align-items: center;
                gap: 0.35rem;
                font-size: 0.875rem;
                font-weight: 600;
                color: var(--company-primary-base, #1d4ed8);
                background: none;
                border: none;
                cursor: pointer;
                padding: 0;
              "
              @click="moreOpen = !moreOpen"
            >
              <span id="sf-see-more-label">{{ moreOpen ? 'See Less' : 'See More' }}</span>
              <Icon :name="moreOpen ? 'ion:chevron-up-outline' : 'ion:chevron-down-outline'" style="font-size: 1rem" />
            </button>
          </div>

          <!-- Exterior Color, Interior Color, Transmission -->
          <div id="sf-more-filters" :style="moreOpen ? '' : 'display:none;'">
            <template v-for="s in moreSections" :key="s.key">
              <div
                v-if="f[s.facet].length"
                :id="s.sec"
                class="sf-acc"
                :class="{ 'sf-section-hidden': hiddenSections.includes(s.sec) }"
              >
                <div class="sf-acc-hd" :class="{ 'is-closed': !open[s.key] }" @click="toggle(s.key)">
                  <span>{{ s.title }} <span class="sf-hidden-badge">hidden</span></span>
                  <div style="display: flex; align-items: center; gap: 0.4rem">
                    <span class="sf-vis-btn" title="Toggle visibility"><Icon name="ion:eye-outline" /></span>
                    <Icon name="ion:remove" class="sf-acc-icon-close" />
                    <Icon name="ion:add" class="sf-acc-icon-open" />
                  </div>
                </div>
                <div
                  :id="`sf-${s.key}`"
                  class="sf-acc-body"
                  :class="{ 'sf-hidden': !open[s.key] }"
                  :style="{ display: open[s.key] ? 'block' : 'none' }"
                >
                  <MultiCheckbox :id="s.id" :choices="f[s.facet]" />
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- Bottom action buttons -->
        <div class="sf-mobile-btn-row">
          <button type="submit" class="sf-btn sf-submit-btn-mobile">Apply Filters</button>
          <NuxtLink
            to="/pre-owned-cars"
            class="sf-btn"
            style="text-align: center; text-decoration: none"
            @click="search.setMobileOpen(false)"
          >
            View {{ data.inventory_all_data_count }} Vehicles
          </NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>
