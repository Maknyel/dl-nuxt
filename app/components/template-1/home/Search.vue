<script setup lang="ts">
/**
 * template-1/search/layout-4.blade.php: the search card. Its one tab, Search Inventory: body style, make, model and
 * trim dropdowns (cascading: each choice reloads the ones after it from /api/site/inventory-dropdown-filters), a
 * price dropdown (a two-handle slider over a 20-bucket histogram, in a floating panel), and Search Vehicles, which
 * opens the inventory with the same query string the Blade form sends.
 *
 * The Body Style, Make and Price panels stay in the markup, hidden, as in the Blade (their tabs are commented out).
 */
import type { T1HomeData } from './types'
import T1Icon from './Icon.vue'
import PriceRange from './PriceRange.vue'

const props = defineProps<{ data: T1HomeData }>()
const route = useRoute()
const { isSales } = useSite()

const FALLBACK_BODIES = ['Compact Car', 'Convertible', 'Crossover SUV', 'Hatchback', 'Minivan', 'SUV', 'Sedan', 'Truck']

const prices = computed(() => props.data.getavailableinternetprice ?? [])
const priceValues = computed(() =>
  prices.value.map((p) => Number(p.internet_price)).filter((p) => Number.isFinite(p) && p > 0),
)
const MIN = computed(() => (priceValues.value.length ? Math.trunc(Math.min(...priceValues.value)) : 0))
const MAX = computed(() => (priceValues.value.length ? Math.trunc(Math.max(...priceValues.value)) : 0))
const SPAN = computed(() => MAX.value - MIN.value || 1)
const BKT_COUNT = 20
// The Blade passes the bucket size through a data attribute with 4 decimals.
const BKT = computed(() => Number((SPAN.value / BKT_COUNT).toFixed(4)) || 1)
const bars = computed(() => {
  const buckets = new Array(BKT_COUNT).fill(0) as number[]
  const size = SPAN.value / BKT_COUNT
  for (const item of prices.value) {
    const p = Math.trunc(Number(item.internet_price ?? 0)) || 0
    if (p <= 0) continue
    const idx = Math.max(0, Math.min(Math.floor((p - MIN.value) / size), BKT_COUNT - 1))
    buckets[idx]! += Math.trunc(Number(item.count ?? 0)) || 0
  }
  const peak = Math.max(...buckets) || 1
  return buckets.map((c) => (c > 0 ? Math.max(Math.round((c / peak) * 100), 8) : 2))
})

// ── The dropdowns ──────────────────────────────────────────────────────────
const bodyOptions = computed(() => {
  const rows = props.data.vehiclebodytype ?? []
  return rows.length ? rows.map((b) => b.body_type ?? '') : FALLBACK_BODIES
})
const makeOptions = ref<string[]>((props.data.getavailablemake ?? []).map((m) => m.make ?? '').filter(Boolean))
const modelOptions = ref<string[]>((props.data.getavailablemodel ?? []).map((m) => m.model ?? '').filter(Boolean))
const queryTrim = typeof route.query.trim === 'string' ? route.query.trim : ''
const trimOptions = ref<string[]>(queryTrim ? [queryTrim] : [])
const makeTabOptions = ref<string[]>([...makeOptions.value])

const bodyType = ref('')
const make = ref('')
const model = ref('')
const trim = ref(queryTrim)
const makeTab = ref('')
const loading = reactive({ make: false, model: false, trim: false })
let lastChanged = ''
let requestId = 0

type Changed = '' | 'body_type' | 'make' | 'model'

/** lf4LoadFilters(changed): reload the dropdowns after the one that changed. */
async function loadFilters(changed: Changed) {
  const id = ++requestId
  const query: Record<string, string> = {}
  if (bodyType.value) query.body_type = bodyType.value
  if (make.value) query.make = make.value
  if (model.value) query.model = model.value

  if (changed === '' || changed === 'body_type') loading.make = true
  if (changed === '' || changed === 'body_type' || changed === 'make') loading.model = true
  loading.trim = true

  try {
    const res = await $fetch<{ makes?: string[]; models?: string[]; trims?: string[] }>(
      '/api/site/inventory-dropdown-filters',
      { query },
    )
    if (id !== requestId) return
    // A reloaded dropdown shows "Loading…" meanwhile, so it comes back on its placeholder (the Blade's setOptions).
    if (changed === '' || changed === 'body_type') {
      makeOptions.value = res.makes ?? []
      makeTabOptions.value = res.makes ?? []
      make.value = ''
      modelOptions.value = res.models ?? []
      model.value = ''
      trimOptions.value = res.trims ?? []
    } else if (changed === 'make') {
      modelOptions.value = res.models ?? []
      model.value = ''
      trimOptions.value = res.trims ?? []
    } else {
      trimOptions.value = res.trims ?? []
    }
    trim.value = ''
  } catch {
    if (id !== requestId) return
    trimOptions.value = []
    trim.value = ''
  } finally {
    if (id === requestId) {
      loading.make = false
      loading.model = false
      loading.trim = false
    }
  }
}

function onBodyType() {
  lastChanged = 'body_type'
  make.value = ''
  model.value = ''
  trim.value = ''
  loadFilters('body_type')
}
function onMake() {
  lastChanged = 'make'
  model.value = ''
  trim.value = ''
  loadFilters('make')
}
function onModel() {
  lastChanged = 'model'
  trim.value = ''
  loadFilters('model')
}
function onTrim() {
  lastChanged = 'trim'
}

// ── The price dropdown ─────────────────────────────────────────────────────
const STEP = 100
const hasRange = computed(() => MAX.value > MIN.value)
/** What the range input does with a value: snapped to the step from `min`, kept within [min, max]. */
function snap(v: number): number {
  if (MAX.value < MIN.value) return MIN.value
  let s = MIN.value + Math.round((v - MIN.value) / STEP) * STEP
  while (s > MAX.value) s -= STEP
  return Math.max(MIN.value, s)
}
const queryInt = (key: string) => Math.trunc(Number(route.query[key] ?? 0)) || 0
const lo = ref(snap(queryInt('internet_price_from') || MIN.value))
const hi = ref(snap(queryInt('internet_price_to') || MAX.value))
// "Any Price" until the first drag, when no price filter is in the URL.
let pristine = !route.query.internet_price_from && !route.query.internet_price_to
const priceLabel = ref('Any Price')

// The inventory form's price fields (lf4PrApply, run on load and after each drag).
const priceFrom = ref<number | ''>(lo.value)
const priceTo = ref<number | ''>(hi.value)
const priceActive = ref('')

const prOpen = ref(false)
const prPos = ref({ top: '0px', left: '0px' })
const prBtn = ref<HTMLButtonElement | null>(null)
const prPanel = ref<HTMLDivElement | null>(null)
const prMinEl = ref<HTMLInputElement | null>(null)
const prMaxEl = ref<HTMLInputElement | null>(null)

/** lf4PrUpdate(moved). */
function prUpdate(moved: 'min' | 'max' | null) {
  if (prMinEl.value) lo.value = parseInt(prMinEl.value.value, 10)
  if (prMaxEl.value) hi.value = parseInt(prMaxEl.value.value, 10)
  const GAP = hasRange.value ? STEP : 0
  if (hasRange.value && lo.value >= hi.value - GAP) {
    if (moved === 'min') {
      lo.value = hi.value - GAP
      if (prMinEl.value) prMinEl.value.value = String(lo.value)
    } else {
      hi.value = lo.value + GAP
      if (prMaxEl.value) prMaxEl.value.value = String(hi.value)
    }
  }
  if (moved) pristine = false
}

/** lf4PrApply(). */
function prApply() {
  priceFrom.value = lo.value
  priceTo.value = hi.value
  priceActive.value = lo.value > MIN.value || hi.value < MAX.value ? 'true' : ''
  if (pristine) return
  const fmt = (v: number) => '$' + v.toLocaleString('en-US')
  if (lo.value <= MIN.value && hi.value >= MAX.value) {
    priceLabel.value = 'Any Price'
  } else {
    let txt = lo.value > MIN.value ? fmt(lo.value) : ''
    txt += lo.value > MIN.value && hi.value < MAX.value ? ' – ' : ''
    txt += hi.value < MAX.value ? fmt(hi.value) : lo.value > MIN.value ? '+' : 'Up to ' + fmt(hi.value)
    priceLabel.value = txt
  }
}
prApply()

const prLPct = computed(() =>
  hasRange.value ? Math.max(0, Math.min(100, ((lo.value - MIN.value) / SPAN.value) * 100)) : 0,
)
const prRPct = computed(() =>
  hasRange.value ? Math.max(0, Math.min(100, ((hi.value - MIN.value) / SPAN.value) * 100)) : 100,
)
const prBarIn = (i: number) => {
  const bLo = MIN.value + i * BKT.value
  return bLo + BKT.value > lo.value && bLo < hi.value
}
const prMinOnTop = computed(() => (hasRange.value ? (lo.value - MIN.value) / SPAN.value : 0) > 0.9)

function prToggle() {
  if (!prOpen.value && prBtn.value) {
    const r = prBtn.value.getBoundingClientRect()
    prPos.value = { top: `${r.bottom + 4}px`, left: `${r.left + r.width / 2}px` }
    prOpen.value = true
    prUpdate(null)
  } else {
    prOpen.value = false
  }
}
const prClose = () => {
  prOpen.value = false
}
function onDocClick(e: MouseEvent) {
  const t = e.target as Node
  if (prPanel.value && prBtn.value && !prPanel.value.contains(t) && !prBtn.value.contains(t)) prClose()
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  window.addEventListener('scroll', prClose, { passive: true })
  // No makes from the server: load the dropdowns once (the Blade's first-render load).
  if (makeOptions.value.length === 0) loadFilters('')
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  window.removeEventListener('scroll', prClose)
})

// ── Submitting ─────────────────────────────────────────────────────────────
type Entry = [string, string | number]
function go(entries: Entry[]) {
  const qs = new URLSearchParams(entries.map(([k, v]) => [k, String(v)]))
  return navigateTo(`/pre-owned-cars?${qs}`)
}

/** The Search Inventory form, as lf4PrepareInventory() leaves it (empty dropdowns are disabled, so not sent). */
function submitInventory() {
  const last = lastChanged || (trim.value ? 'trim' : model.value ? 'model' : make.value ? 'make' : '')
  const entries: Entry[] = [
    ['list', ''],
    ['page', '1'],
    ['grid', ''],
    ['search', ''],
    ['per_page', ''],
    ['sort_by', ''],
    ['max_price', ''],
    ['last_updated_value', last],
    ['is_make_active', make.value ? 'true' : ''],
    ['is_model_active', model.value ? 'true' : ''],
    ['is_trim_active', trim.value ? 'true' : ''],
    ['is_year_active', ''],
    ['is_internet_price_active', priceActive.value],
    ['is_mileage_active', ''],
    ['internet_price_from', priceFrom.value],
    ['internet_price_to', priceTo.value],
    ['year_from', ''],
    ['year_to', ''],
    ['mileage_from', ''],
    ['mileage_to', ''],
  ]
  if (bodyType.value) entries.push(['body_type[]', bodyType.value])
  if (make.value) entries.push(['make[]', make.value])
  if (model.value) entries.push(['model[]', model.value])
  if (trim.value) entries.push(['trim[]', trim.value])
  go(entries)
}

// The hidden panels' forms.
const panelBody = ref('')
const pricePanelFrom = ref<number>()
const pricePanelTo = ref<number>()
const tail: Entry[] = [
  ['year_from', ''],
  ['year_to', ''],
  ['mileage_from', ''],
  ['mileage_to', ''],
]
const panelHead = (last: string, makeActive: string): Entry[] => [
  ['page', '1'],
  ['last_updated_value', last],
  ['is_make_active', makeActive],
  ['is_model_active', ''],
  ['is_year_active', ''],
  ['is_internet_price_active', ''],
  ['is_mileage_active', ''],
  ['internet_price_from', MIN.value || ''],
  ['internet_price_to', ''],
  ...tail,
]
function submitBody() {
  go([...panelHead('body_type', ''), ['body_type[]', panelBody.value]])
}
function submitMake() {
  go([...panelHead('make', 'true'), ['make[]', makeTab.value]])
}
function submitPrice() {
  go([
    ['page', '1'],
    ['last_updated_value', 'internet_price'],
    ['is_make_active', ''],
    ['is_model_active', ''],
    ['is_year_active', ''],
    ['is_internet_price_active', 'true'],
    ['is_mileage_active', ''],
    ...tail,
    ['internet_price_from', pricePanelFrom.value ?? ''],
    ['internet_price_to', pricePanelTo.value ?? ''],
  ])
}

const selectClass =
  'w-full sm:flex-1 sm:min-w-[110px] border-2 border-gray-200 rounded-lg p-3 text-sm font-bold text-gray-900 bg-white focus:outline-hidden appearance-none cursor-pointer'
const tabSelectClass =
  'flex-1 border-2 border-gray-200 rounded-lg p-3 text-sm font-bold bg-white focus:outline-hidden appearance-none cursor-pointer'
</script>

<template>
  <div class="container t1-sec mx-auto my-2 px-10 relative z-20">
    <div id="lf4-card" class="bg-white w-full py-4 px-4 rounded-2xl shadow-lg overflow-hidden">
      <!-- Tabs -->
      <div class="flex items-center gap-8 border-b border-gray-100 overflow-x-auto scrollbar-hide">
        <button
          id="lf4-tab-inventory"
          type="button"
          class="lf4-tab lf4-tab-active flex items-center gap-2 px-3 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors"
          @click="prClose"
        >
          <T1Icon name="car" class="lf4-tab-icon t1-ico-sm" /> Search Inventory
        </button>
      </div>

      <!-- Panel: Search Inventory -->
      <div id="lf4-panel-inventory" class="lf4-panel">
        <form
          id="lf4-form-inventory"
          action="/pre-owned-cars"
          method="GET"
          class="flex flex-col gap-3 py-3"
          @submit.prevent="submitInventory"
        >
          <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <select v-model="bodyType" name="body_type[]" :class="selectClass" @change="onBodyType">
              <option value="">Any Body Style</option>
              <option v-for="(bt, i) in bodyOptions" :key="i" :value="bt">{{ bt }}</option>
            </select>

            <select id="lf4-make" v-model="make" name="make[]" :class="selectClass" :disabled="loading.make" @change="onMake">
              <option v-if="loading.make" value="">Loading…</option>
              <template v-else>
                <option value="">Any Make</option>
                <option v-for="m in makeOptions" :key="m" :value="m">{{ m }}</option>
              </template>
            </select>

            <select id="lf4-model" v-model="model" name="model[]" :class="selectClass" :disabled="loading.model" @change="onModel">
              <option v-if="loading.model" value="">Loading…</option>
              <template v-else>
                <option value="">Any Model</option>
                <option v-for="m in modelOptions" :key="m" :value="m">{{ m }}</option>
              </template>
            </select>

            <select id="lf4-trim" v-model="trim" name="trim[]" :class="selectClass" :disabled="loading.trim" @change="onTrim">
              <option v-if="loading.trim" value="">Loading…</option>
              <template v-else>
                <option value="">Any Trim</option>
                <option v-for="t in trimOptions" :key="t" :value="t">{{ t }}</option>
              </template>
            </select>

            <button
              id="lf4-pr-btn"
              ref="prBtn"
              type="button"
              class="w-full sm:flex-1 sm:min-w-[110px] border-2 border-gray-200 rounded-lg p-3 text-sm font-bold text-gray-900 bg-white focus:outline-hidden cursor-pointer flex items-center justify-between gap-1"
              @click.stop="prToggle"
            >
              <span id="lf4-pr-label">{{ priceLabel }}</span>
              <svg class="w-4 h-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          <div class="flex justify-center">
            <button
              type="submit"
              class="lf4-submit-btn flex items-center gap-2 px-5 py-2 rounded-sm text-white text-sm font-semibold whitespace-nowrap"
            >
              Search Vehicles
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </form>
      </div>

      <!-- Price floating panel (fixed, to escape the card's overflow:hidden) -->
      <div
        id="lf4-pr-panel"
        ref="prPanel"
        :class="{ hidden: !prOpen }"
        :style="{
          position: 'fixed',
          zIndex: 9999,
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '.75rem',
          boxShadow: '0 8px 24px rgba(0,0,0,.14)',
          minWidth: '300px',
          top: prPos.top,
          left: prPos.left,
          transform: 'translateX(-50%)',
        }"
      >
        <div style="padding: 14px 16px 0; display: flex; justify-content: space-between">
          <span id="lf4-pr-lo-lbl" style="font-size: 0.875rem; font-weight: 700; color: #111827">${{ lo.toLocaleString('en-US') }}</span>
          <span id="lf4-pr-hi-lbl" style="font-size: 0.875rem; font-weight: 700; color: #111827">${{ hi.toLocaleString('en-US') }}{{ hi >= MAX ? '+' : '' }}</span>
        </div>
        <div style="position: relative; height: 20px; margin: 10px 16px 8px">
          <div
            style="position: absolute; top: 50%; left: 10px; right: 10px; height: 4px; margin-top: -2px; background: #e5e7eb; border-radius: 9999px; pointer-events: none"
          >
            <div
              id="lf4-pr-fill"
              :style="{ position: 'absolute', height: '100%', borderRadius: '9999px', background: '#2563eb', left: `${prLPct}%`, right: `${100 - prRPct}%` }"
            ></div>
          </div>
          <input
            id="lf4-pr-min-r"
            ref="prMinEl"
            type="range"
            class="lf4-pr-rng"
            :min="MIN"
            :max="MAX"
            :value="lo"
            step="100"
            :style="{ zIndex: prMinOnTop ? 6 : 4 }"
            @input="prUpdate('min')"
            @change="prApply"
          />
          <input
            id="lf4-pr-max-r"
            ref="prMaxEl"
            type="range"
            class="lf4-pr-rng"
            :min="MIN"
            :max="MAX"
            :value="hi"
            step="100"
            :style="{ zIndex: prMinOnTop ? 4 : 5 }"
            @input="prUpdate('max')"
            @change="prApply"
          />
        </div>
        <div id="lf4-pr-hist" style="display: flex; align-items: flex-end; height: 52px; gap: 2px; padding: 0 16px 14px">
          <div
            v-for="(h, i) in bars"
            :key="i"
            :style="{ flex: 1, background: prBarIn(i) ? '#93c5fd' : '#d1d5db', borderRadius: '2px 2px 0 0', height: `${h}%` }"
          ></div>
        </div>
      </div>

      <!-- Panel: Body Style (its tab is commented out in the Blade) -->
      <div id="lf4-panel-body" class="lf4-panel hidden">
        <form action="/pre-owned-cars" method="GET" class="flex flex-wrap items-center gap-3 py-3" @submit.prevent="submitBody">
          <select v-model="panelBody" name="body_type[]" :class="tabSelectClass">
            <option value="">Any Body Style</option>
            <option v-for="(bt, i) in bodyOptions" :key="i" :value="bt">{{ bt }}</option>
          </select>
          <button type="submit" class="lf4-submit-btn flex items-center gap-2 px-5 py-2 text-white text-sm font-semibold" :class="isSales ? 'rounded-sm' : 'rounded-full'">
            Search
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </form>
      </div>

      <!-- Panel: Make (hidden) -->
      <div id="lf4-panel-make" class="lf4-panel hidden">
        <form action="/pre-owned-cars" method="GET" class="flex flex-wrap items-center gap-3 py-3" @submit.prevent="submitMake">
          <select id="lf4-make-tab" v-model="makeTab" name="make[]" :class="tabSelectClass">
            <option value="">Any Make</option>
            <option v-for="m in makeTabOptions" :key="m" :value="m">{{ m }}</option>
          </select>
          <button type="submit" class="lf4-submit-btn flex items-center gap-2 px-5 py-2 text-white text-sm font-semibold" :class="isSales ? 'rounded-sm' : 'rounded-full'">
            Search
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </form>
      </div>

      <!-- Panel: Price (hidden) -->
      <div id="lf4-panel-price" class="lf4-panel hidden">
        <form id="lf4-form-price" action="/pre-owned-cars" method="GET" class="py-3" @submit.prevent="submitPrice">
          <PriceRange
            v-model:from="pricePanelFrom"
            v-model:to="pricePanelTo"
            id="internet_price"
            :choices="prices"
            ismoneyvalue="yes"
          />
          <div class="flex justify-end mt-2 px-4">
            <button type="submit" class="lf4-submit-btn flex items-center gap-2 px-5 py-2 text-white text-sm font-semibold" :class="isSales ? 'rounded-sm' : 'rounded-full'">
              Search
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lf4-tab-active {
  color: var(--company-primary-base);
  border-bottom-color: var(--company-primary-base) !important;
}

.lf4-tab {
  background: none;
  border-left: none;
  border-right: none;
  border-top: none;
  cursor: pointer;
}
.lf4-submit-btn {
  background-color: var(--company-primary-base);
}
.lf4-submit-btn:hover {
  opacity: 0.9;
}

#lf4-card {
  border-radius: 1rem;
  padding: 0.75rem 1.25rem 0.5rem;
  border: 1px solid color-mix(in srgb, var(--company-primary-base) 12%, #e9e8ee);
  box-shadow: 0 12px 30px -20px rgba(22, 19, 31, 0.28), 0 1px 2px rgba(22, 19, 31, 0.05) !important;
}
#lf4-card > div:first-child {
  border-color: color-mix(in srgb, var(--company-primary-base) 14%, #ebe9f1);
}
#lf4-card .lf4-tab {
  font-size: 0.9375rem;
  /* Tailwind 3's text-sm line height stays 1.25rem at this size (Tailwind 4's is a ratio). */
  line-height: 1.25rem;
  padding-left: 1rem;
  padding-right: 1rem;
}
#lf4-card svg.lf4-tab-icon {
  width: 1rem;
  height: 1rem;
}
#lf4-card select,
#lf4-pr-btn {
  height: 3rem;
  padding: 0 0.875rem;
  border-width: 1.5px !important;
  border-color: color-mix(in srgb, var(--company-primary-base) 20%, #e4e1ec) !important;
  border-radius: 0.625rem !important;
  font-weight: 500 !important;
  font-size: 0.875rem;
  color: #1f1b2d !important;
  box-shadow: 0 1px 2px rgba(16, 12, 40, 0.04);
  transition: border-color 0.15s;
}
#lf4-card select:hover,
#lf4-pr-btn:hover,
#lf4-card select:focus {
  border-color: color-mix(in srgb, var(--company-primary-base) 45%, #e4e1ec) !important;
}

#lf4-card select,
#lf4-pr-btn {
  border-color: #16131f !important;
}
#lf4-card select:hover,
#lf4-pr-btn:hover,
#lf4-card select:focus {
  border-color: var(--company-primary-base) !important;
}
#lf4-card .lf4-submit-btn {
  padding: 0.65rem 1.4rem;
  border-radius: var(--t1-btn-radius, 0.5rem) !important;
  font-size: 0.875rem;
  background: #141626;
  box-shadow: 0 10px 22px -12px rgba(20, 22, 38, 0.8);
}
#lf4-card .lf4-submit-btn:hover {
  opacity: 1;
  filter: brightness(1.15);
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.lf4-pr-rng {
  position: absolute;
  left: 0;
  top: 50%;
  width: 100%;
  height: 0;
  margin: 0;
  padding: 0;
  background: transparent;
  pointer-events: none;
  -webkit-appearance: none;
  appearance: none;
  outline: none;
  z-index: 4;
}
.lf4-pr-rng::-webkit-slider-thumb {
  -webkit-appearance: none !important;
  appearance: none !important;
  width: 20px !important;
  height: 20px !important;
  border-radius: 50% !important;
  background: #2563eb !important;
  border: 2.5px solid #fff !important;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.28) !important;
  pointer-events: all !important;
  cursor: pointer !important;
  margin-top: -10px;
}
.lf4-pr-rng::-moz-range-thumb {
  width: 20px !important;
  height: 20px !important;
  border-radius: 50% !important;
  background: #2563eb !important;
  border: 2.5px solid #fff !important;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.28) !important;
  pointer-events: all !important;
  cursor: pointer !important;
}
.lf4-pr-rng::-webkit-slider-runnable-track {
  background: transparent !important;
  height: 0 !important;
}
.lf4-pr-rng::-moz-range-track {
  background: transparent !important;
  height: 0 !important;
}
</style>
