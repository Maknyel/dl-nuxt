<script setup lang="ts">
/**
 * template-1/budget/layout-4.blade.php, "Shop Within Your Budget": the stock count, quick ranges, a two-handle price
 * slider over the prices' bar chart, the live match count, and "Show N Vehicles" to the inventory with that price
 * range. Not shown when there are no prices. (The Blade's Alpine t1Budget component, as Vue state.)
 */
import type { T1HomeData } from './types'
import T1Icon from './Icon.vue'

const props = defineProps<{ data: T1HomeData }>()

const BUCKETS = 24
const items = computed(() =>
  (props.data.getavailableinternetprice ?? [])
    .map((p) => ({ price: Math.trunc(Number(p.internet_price ?? 0)) || 0, count: Math.trunc(Number(p.count ?? 0)) || 0 }))
    .filter((p) => p.price > 0 && p.count > 0),
)
const min = computed(() => (items.value.length ? Math.floor(Math.min(...items.value.map((i) => i.price)) / 1000) * 1000 : 0))
const max = computed(() => {
  const m = items.value.length ? Math.ceil(Math.max(...items.value.map((i) => i.price)) / 1000) * 1000 : 0
  return m <= min.value ? min.value + 1000 : m
})
const total = computed(() => items.value.reduce((n, i) => n + i.count, 0))

const heights = computed(() => {
  const buckets = new Array(BUCKETS).fill(0) as number[]
  for (const it of items.value) {
    const i = Math.floor((it.price - min.value) / ((max.value - min.value) / BUCKETS))
    buckets[Math.max(0, Math.min(BUCKETS - 1, i))]! += it.count
  }
  const peak = Math.max(...buckets) || 1
  return buckets.map((c) => (c > 0 ? Math.max(Math.round((c / peak) * 100), 10) : 4))
})

const lo = ref(0)
const hi = ref(0)

/** A quick range, kept inside the stock's own prices. */
function preset(from: number | null, to: number | null) {
  lo.value = Math.max(min.value, from ?? min.value)
  hi.value = Math.min(max.value, to ?? max.value)
  if (hi.value <= lo.value) hi.value = Math.min(max.value, lo.value + 500)
}
const isPreset = (from: number | null, to: number | null) =>
  lo.value === Math.max(min.value, from ?? min.value) && hi.value === Math.min(max.value, to ?? max.value)

// Opens on Under $20K (the default range).
preset(null, 20000)

const matches = computed(() => items.value.reduce((n, it) => n + (it.price >= lo.value && it.price <= hi.value ? it.count : 0), 0))
const href = computed(
  () =>
    `/pre-owned-cars?page=1&last_updated_value=internet_price&is_internet_price_active=true&internet_price_from=${lo.value}&internet_price_to=${hi.value}`,
)
const pct = (v: number) => ((v - min.value) / (max.value - min.value)) * 100
const inRange = (i: number) => {
  const size = (max.value - min.value) / BUCKETS
  const from = min.value + i * size
  return from + size > lo.value && from < hi.value
}
const clampLo = () => {
  if (lo.value > hi.value - 500) lo.value = Math.max(min.value, hi.value - 500)
}
const clampHi = () => {
  if (hi.value < lo.value + 500) hi.value = Math.min(max.value, lo.value + 500)
}
const money = (v: number) => '$' + Number(v).toLocaleString('en-US')
</script>

<template>
  <section v-if="items.length" class="container t1-sec mt-4">
    <div class="t1-panel t1-budget">
      <div class="t1-budget-intro">
        <div class="flex items-center gap-3">
          <span class="t1-tile t1-tile--soft t1-budget-tile"><T1Icon name="calendar" class="t1-ico" /></span>
          <span class="t1-budget-stock">{{ total.toLocaleString('en-US') }} VEHICLES IN STOCK</span>
        </div>
        <h2 class="t1-budget-title">Shop Within Your Budget</h2>
        <p class="t1-budget-sub">Slide to set your price range and see what fits.</p>
        <div class="t1-budget-chips">
          <button type="button" class="t1-budget-chip" :class="isPreset(null, 20000) && 'is-on'" @click="preset(null, 20000)">Under $20K</button>
          <button type="button" class="t1-budget-chip" :class="isPreset(20000, 30000) && 'is-on'" @click="preset(20000, 30000)">$20K – $30K</button>
          <button type="button" class="t1-budget-chip" :class="isPreset(30000, null) && 'is-on'" @click="preset(30000, null)">$30K+</button>
        </div>
      </div>

      <div class="t1-budget-range">
        <div class="flex items-end justify-between gap-4">
          <div>
            <div class="t1-budget-eyebrow">YOUR PRICE RANGE</div>
            <div class="t1-budget-value"><span>{{ money(lo) }}</span> <span class="t1-budget-dash">–</span> <span>{{ money(hi) }}</span></div>
          </div>
          <div class="t1-budget-match"><b>{{ matches }}</b> vehicles match</div>
        </div>

        <div class="t1-budget-chart">
          <span v-for="(h, i) in heights" :key="i" :style="{ height: `${h}%` }" :class="inRange(i) && 'is-in'"></span>
        </div>

        <div class="t1-budget-slider">
          <div class="t1-budget-track"><span :style="`left:${pct(lo)}%; right:${100 - pct(hi)}%`"></span></div>
          <input v-model.number="lo" type="range" :min="min" :max="max" step="500" aria-label="Lowest price" @input="clampLo" />
          <input v-model.number="hi" type="range" :min="min" :max="max" step="500" aria-label="Highest price" @input="clampHi" />
        </div>

        <div class="flex justify-center mt-5">
          <NuxtLink :to="href" class="t1-btn t1-btn--deep t1-budget-btn">
            Show <span>{{ matches }}</span> Vehicles
            <T1Icon name="arrow-right" class="t1-ico-sm" :stroke="2.5" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.t1-budget {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  gap: 2.5rem;
  padding: 1.75rem 2rem;
}

.t1-budget-tile {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.625rem;
}

.t1-budget-stock {
  padding: 0.25rem 0.7rem;
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--t1-muted, #6b6880);
  background: color-mix(in srgb, var(--company-primary-base) 5%, #f4f4f7);
}

.t1-budget-title {
  margin: 1rem 0 0.35rem;
  font-size: 1.625rem;
  font-weight: 800;
  color: var(--t1-ink, #16131f);
}

.t1-budget-sub {
  font-size: 0.875rem;
  color: var(--t1-muted, #6b6880);
}

.t1-budget-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1.25rem;
}

.t1-budget-chip {
  padding: 0.4rem 0.85rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--t1-ink, #16131f);
  background: #fff;
  border: 1px solid var(--t1-line, #e9e8ee);
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.t1-budget-chip:hover {
  border-color: color-mix(in srgb, var(--company-primary-base) 35%, #ffffff);
}

.t1-budget-chip.is-on {
  color: var(--company-primary-base);
  background: color-mix(in srgb, var(--company-primary-base) 10%, #ffffff);
  border-color: color-mix(in srgb, var(--company-primary-base) 35%, #ffffff);
}

.t1-budget-eyebrow {
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--t1-muted, #6b6880);
}

.t1-budget-value {
  font-family: 'Outfit', 'Inter', sans-serif;
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--t1-ink, #16131f);
}

.t1-budget-dash {
  color: var(--t1-muted, #6b6880);
  font-weight: 500;
}

.t1-budget-match {
  font-size: 0.8125rem;
  color: var(--t1-muted, #6b6880);
}

.t1-budget-match b {
  color: var(--t1-ink, #16131f);
}

.t1-budget-chart {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 4.5rem;
  margin-top: 1rem;
  padding: 0 0.6rem;
}

.t1-budget-chart span {
  flex: 1;
  border-radius: 3px 3px 0 0;
  background: #e6e6ea;
  transition: background 0.15s;
}

.t1-budget-chart span.is-in {
  background: linear-gradient(to top, var(--company-primary-base), color-mix(in srgb, var(--company-primary-base) 70%, #ffffff));
}

.t1-budget-slider {
  position: relative;
  height: 1.25rem;
  margin-top: 0.4rem;
}

.t1-budget-track {
  position: absolute;
  left: 0.6rem;
  right: 0.6rem;
  top: 50%;
  height: 4px;
  margin-top: -2px;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--company-primary-base) 12%, #e7e6ec);
  pointer-events: none;
}

.t1-budget-track span {
  position: absolute;
  top: 0;
  bottom: 0;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--company-primary-base) 70%, #0b0817);
}

.t1-budget-slider input[type='range'] {
  position: absolute;
  inset: 0;
  width: 100%;
  margin: 0;
  background: transparent;
  pointer-events: none;
  -webkit-appearance: none;
  appearance: none;
}

.t1-budget-slider input[type='range']::-webkit-slider-runnable-track {
  background: transparent;
  height: 1.25rem;
}

.t1-budget-slider input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 9999px;
  background: #fff;
  border: 3px solid color-mix(in srgb, var(--company-primary-base) 70%, #0b0817);
  box-shadow: 0 2px 6px rgba(22, 19, 31, 0.25);
  pointer-events: all;
  cursor: pointer;
}

.t1-budget-slider input[type='range']::-moz-range-thumb {
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 9999px;
  background: #fff;
  border: 3px solid color-mix(in srgb, var(--company-primary-base) 70%, #0b0817);
  pointer-events: all;
  cursor: pointer;
}

.t1-budget-btn {
  border-radius: var(--t1-btn-radius, 0.5rem);
  padding: 0.6rem 1.25rem;
  font-size: 0.875rem;
}

@media (max-width: 1023px) {
  .t1-budget {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    padding: 1.25rem;
  }

  .t1-budget-value {
    font-size: 1.375rem;
  }
}

@media (max-width: 640px) {
  .t1-budget-range > .flex:first-child {
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    text-align: center;
  }

  .t1-budget-value {
    white-space: nowrap;
  }
}
</style>
