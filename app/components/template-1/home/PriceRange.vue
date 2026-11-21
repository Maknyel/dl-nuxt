<script setup lang="ts">
/**
 * custom-components/price-range.blade.php (<x-price-range>): a two-handle price slider over a 24-bucket histogram,
 * with the range as `internet_price_from` / `internet_price_to` (v-model:from / v-model:to). `choices` is the price
 * list highest first, as the API returns it.
 */
const props = withDefaults(
  defineProps<{
    choices: Record<string, any>[]
    id?: string
    ismoneyvalue?: string
  }>(),
  { id: 'internet_price', ismoneyvalue: 'yes' },
)
const from = defineModel<number>('from')
const to = defineModel<number>('to')

const route = useRoute()
const STEP = 100
const BUCKETS = 24

const minLimit = computed(() => Math.trunc(Number(props.choices[props.choices.length - 1]?.[props.id] ?? 0)) || 0)
const maxLimit = computed(() => Math.trunc(Number(props.choices[0]?.[props.id] ?? 0)) || 0)
const span = computed(() => maxLimit.value - minLimit.value || 1)
const bktSize = computed(() => span.value / BUCKETS)
const hasRange = computed(() => maxLimit.value > minLimit.value)

const heights = computed(() => {
  const buckets = new Array(BUCKETS).fill(0) as number[]
  for (const item of props.choices) {
    const price = Math.trunc(Number(item[props.id] ?? 0)) || 0
    const idx = Math.max(0, Math.min(Math.floor((price - minLimit.value) / bktSize.value), BUCKETS - 1))
    buckets[idx]! += Math.trunc(Number(item.count ?? 0)) || 0
  }
  const peak = Math.max(...buckets) || 1
  return buckets.map((c) => (c > 0 ? Math.max(Math.round((c / peak) * 100), 8) : 2))
})

/** What a range input does with a value: snapped to the step from `min`, kept within [min, max]. */
function snap(v: number): number {
  const min = minLimit.value
  const max = maxLimit.value
  if (max < min) return min
  let s = min + Math.round((v - min) / STEP) * STEP
  while (s > max) s -= STEP
  return Math.max(min, s)
}

const queryInt = (key: string, fallback: number) => {
  const v = route.query[key]
  return v === undefined || v === null ? fallback : Math.trunc(Number(v)) || 0
}
const lo = ref(snap(queryInt('internet_price_from', minLimit.value)))
const hi = ref(snap(queryInt('internet_price_to', maxLimit.value)))

const minEl = ref<HTMLInputElement | null>(null)
const maxEl = ref<HTMLInputElement | null>(null)

/** prUpdate_internet_price(moved). */
function update(moved: 'min' | 'max' | null) {
  if (minEl.value) lo.value = parseInt(minEl.value.value, 10)
  if (maxEl.value) hi.value = parseInt(maxEl.value.value, 10)
  const GAP = hasRange.value ? STEP : 0
  if (hasRange.value && lo.value >= hi.value - GAP) {
    if (moved === 'min') {
      lo.value = hi.value - GAP
      if (minEl.value) minEl.value.value = String(lo.value)
    } else {
      hi.value = lo.value + GAP
      if (maxEl.value) maxEl.value.value = String(hi.value)
    }
  }
  from.value = lo.value
  to.value = hi.value
}
from.value = lo.value
to.value = hi.value

const pfx = computed(() => (props.ismoneyvalue === 'yes' ? '$' : ''))
const lPct = computed(() =>
  hasRange.value ? Math.max(0, Math.min(100, ((lo.value - minLimit.value) / span.value) * 100)) : 0,
)
const rPct = computed(() =>
  hasRange.value ? Math.max(0, Math.min(100, ((hi.value - minLimit.value) / span.value) * 100)) : 100,
)
const inRange = (i: number) => {
  const bLo = minLimit.value + i * bktSize.value
  return bLo + bktSize.value > lo.value && bLo < hi.value
}
const minOnTop = computed(() => (hasRange.value ? (lo.value - minLimit.value) / span.value : 0) > 0.9)

// prSubmit_internet_price() sets fields that only the inventory page has, then fires `customEventTriggered`, which
// nothing on the home listens to; the home's price form submits with its Search button.
</script>

<template>
  <div :class="`pr-root_${id}`" style="padding: 4px 16px 14px">
    <div style="display: flex; justify-content: space-between; margin-bottom: 10px">
      <span :id="`pr-lo-${id}`" style="font-size: 0.875rem; font-weight: 700; color: #111827">{{ pfx }}{{ lo.toLocaleString('en-US') }}</span>
      <span :id="`pr-hi-${id}`" style="font-size: 0.875rem; font-weight: 700; color: #111827">{{ pfx }}{{ hi.toLocaleString('en-US') }}{{ hi >= maxLimit ? '+' : '' }}</span>
    </div>

    <div style="position: relative; height: 20px; margin-bottom: 10px">
      <div
        style="position: absolute; top: 50%; left: 10px; right: 10px; height: 4px; margin-top: -2px; background: #e5e7eb; border-radius: 9999px; pointer-events: none"
      >
        <div
          :id="`pr-fill-${id}`"
          :style="{ position: 'absolute', height: '100%', borderRadius: '9999px', background: '#2563eb', left: `${lPct}%`, right: `${100 - rPct}%` }"
        ></div>
      </div>
      <input
        :id="`pr-min-${id}`"
        ref="minEl"
        type="range"
        class="pr-rng"
        :min="minLimit"
        :max="maxLimit"
        :value="lo"
        step="100"
        :style="{ zIndex: minOnTop ? 6 : 4 }"
        @input="update('min')"
      />
      <input
        :id="`pr-max-${id}`"
        ref="maxEl"
        type="range"
        class="pr-rng"
        :min="minLimit"
        :max="maxLimit"
        :value="hi"
        step="100"
        :style="{ zIndex: minOnTop ? 4 : 5 }"
        @input="update('max')"
      />
    </div>

    <div :id="`pr-hist-${id}`" style="display: flex; align-items: flex-end; height: 52px; gap: 2px; padding: 0 10px">
      <div
        v-for="(h, i) in heights"
        :key="i"
        :style="{ flex: 1, height: `${h}%`, background: inRange(i) ? '#93c5fd' : '#d1d5db', borderRadius: '2px 2px 0 0', transition: 'background .12s' }"
      ></div>
    </div>

    <input :id="`${id}_from`" type="hidden" :name="`${id}_from`" :value="lo" />
    <input :id="`${id}_to`" type="hidden" :name="`${id}_to`" :value="hi" />
  </div>
</template>

<style scoped>
.pr-rng {
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
}
.pr-rng::-webkit-slider-thumb {
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
.pr-rng::-moz-range-thumb {
  width: 20px !important;
  height: 20px !important;
  border-radius: 50% !important;
  background: #2563eb !important;
  border: 2.5px solid #fff !important;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.28) !important;
  pointer-events: all !important;
  cursor: pointer !important;
}
.pr-rng::-webkit-slider-runnable-track {
  background: transparent !important;
  height: 0 !important;
}
.pr-rng::-moz-range-track {
  background: transparent !important;
  height: 0 !important;
}
</style>
