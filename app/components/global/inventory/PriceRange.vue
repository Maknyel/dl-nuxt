<script setup lang="ts">
/**
 * The price slider (custom-components/price-range-live.blade.php + the Alpine `priceRangeLive`): two range handles
 * over a 24-bar histogram, the selected range above. `input` moves the handles (they never cross); `commit` is the
 * handle's change (the search runs 400ms later, in useInventorySearch.submitRange).
 */
const props = defineProps<{
  lo: number
  hi: number
  bars: number[]
  bktSize: number
  money: boolean
}>()
const value = defineModel<[number, number]>({ required: true })
const emit = defineEmits<{ commit: [] }>()

const span = computed(() => props.hi - props.lo || 1)
const hasRange = computed(() => props.hi > props.lo)
const loLabel = computed(() => (props.money ? '$' : '') + Number(value.value[0]).toLocaleString('en-US'))
const hiLabel = computed(
  () => (props.money ? '$' : '') + Number(value.value[1]).toLocaleString('en-US') + (value.value[1] >= props.hi ? '+' : ''),
)
const fillLeftPct = computed(() =>
  hasRange.value ? Math.max(0, Math.min(100, ((value.value[0] - props.lo) / span.value) * 100)) : 0,
)
const fillRightPct = computed(
  () => 100 - (hasRange.value ? Math.max(0, Math.min(100, ((value.value[1] - props.lo) / span.value) * 100)) : 100),
)
const minZIndex = computed(() => ((hasRange.value ? (value.value[0] - props.lo) / span.value : 0) > 0.9 ? 6 : 4))
const maxZIndex = computed(() => (minZIndex.value === 6 ? 4 : 5))

function barActive(i: number) {
  const bLo = props.lo + i * props.bktSize
  return bLo + props.bktSize > value.value[0] && bLo < value.value[1]
}

function onInput(moved: 'min' | 'max', e: Event) {
  const v = Number((e.target as HTMLInputElement).value)
  const next: [number, number] = [...value.value]
  next[moved === 'min' ? 0 : 1] = v
  const gap = hasRange.value ? 100 : 0
  if (hasRange.value && next[0] >= next[1] - gap) {
    if (moved === 'min') next[0] = next[1] - gap
    else next[1] = next[0] + gap
  }
  value.value = next
  // x-model writes the clamped value back into the handle.
  ;(e.target as HTMLInputElement).value = String(next[moved === 'min' ? 0 : 1])
}

const ACTIVE_BAR =
  'linear-gradient(to top, var(--company-primary-base, #2563eb), color-mix(in srgb, var(--company-primary-base, #2563eb) 55%, #ffffff))'
const IDLE_BAR = 'color-mix(in srgb, var(--company-primary-base, #2563eb) 14%, #e5e7eb)'
</script>

<template>
  <div style="padding: 4px 16px 14px">
    <!-- The labels' line keeps its height (ADR-0173). -->
    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; min-height: 21px">
      <span style="font-size: 0.875rem; font-weight: 700; color: #111827">{{ loLabel }}</span>
      <span style="font-size: 0.875rem; font-weight: 700; color: #111827">{{ hiLabel }}</span>
    </div>

    <div style="position: relative; height: 20px; margin-bottom: 10px">
      <div
        style="
          position: absolute;
          top: 50%;
          left: 10px;
          right: 10px;
          height: 4px;
          margin-top: -2px;
          background: color-mix(in srgb, var(--company-primary-base, #2563eb) 14%, #e5e7eb);
          border-radius: 9999px;
          pointer-events: none;
        "
      >
        <div
          :style="{
            position: 'absolute',
            height: '100%',
            borderRadius: '9999px',
            background: 'var(--company-primary-base, #2563eb)',
            left: fillLeftPct + '%',
            right: fillRightPct + '%',
          }"
        />
      </div>
      <input
        type="range"
        class="prl-rng"
        :min="lo"
        :max="hi"
        step="100"
        :value="value[0]"
        :style="{ zIndex: minZIndex }"
        @input="onInput('min', $event)"
        @change="emit('commit')"
      />
      <input
        type="range"
        class="prl-rng"
        :min="lo"
        :max="hi"
        step="100"
        :value="value[1]"
        :style="{ zIndex: maxZIndex }"
        @input="onInput('max', $event)"
        @change="emit('commit')"
      />
    </div>

    <div style="display: flex; align-items: flex-end; height: 52px; gap: 2px; padding: 0 10px">
      <div
        v-for="(pct, i) in bars"
        :key="i"
        :style="{
          flex: 1,
          height: pct + '%',
          borderRadius: '2px 2px 0 0',
          transition: 'background .12s',
          background: barActive(i) ? ACTIVE_BAR : IDLE_BAR,
        }"
      />
    </div>
  </div>
</template>

<style scoped>
.prl-rng {
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
.prl-rng::-webkit-slider-thumb {
  -webkit-appearance: none !important;
  appearance: none !important;
  width: 20px !important;
  height: 20px !important;
  border-radius: 50% !important;
  background: #fff !important;
  border: 3px solid var(--company-primary-base, #2563eb) !important;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.28) !important;
  pointer-events: all !important;
  cursor: pointer !important;
  margin-top: -10px;
}
.prl-rng::-moz-range-thumb {
  width: 20px !important;
  height: 20px !important;
  border-radius: 50% !important;
  background: #fff !important;
  border: 3px solid var(--company-primary-base, #2563eb) !important;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.28) !important;
  pointer-events: all !important;
  cursor: pointer !important;
}
.prl-rng::-webkit-slider-runnable-track {
  background: transparent !important;
  height: 0 !important;
}
.prl-rng::-moz-range-track {
  background: transparent !important;
  height: 0 !important;
}
</style>
