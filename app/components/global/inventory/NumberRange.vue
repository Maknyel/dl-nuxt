<script setup lang="ts">
/**
 * The year and mileage sliders (custom-components/year-range.blade.php, miles-range.blade.php): two range handles
 * over a 24-bar histogram, in the components' own blue and grey. Mileage shows its numbers with commas and a "+" at the
 * top (its top is the highest mileage + 10,000). `commit` is the handle's change (rngSubmit_*).
 */
const props = defineProps<{
  lo: number
  hi: number
  step: number
  miles: boolean
  bars: number[]
  bktSize: number
}>()
const value = defineModel<[number, number]>({ required: true })
const emit = defineEmits<{ commit: [] }>()

const span = computed(() => props.hi - props.lo || 1)
const hasRange = computed(() => props.hi > props.lo)
const loLabel = computed(() => (props.miles ? value.value[0].toLocaleString('en-US') : String(value.value[0])))
const hiLabel = computed(() =>
  props.miles
    ? value.value[1].toLocaleString('en-US') + (value.value[1] >= props.hi ? '+' : '')
    : String(value.value[1]),
)
const lPct = computed(() => (hasRange.value ? Math.max(0, Math.min(100, ((value.value[0] - props.lo) / span.value) * 100)) : 0))
const rPct = computed(() =>
  hasRange.value ? Math.max(0, Math.min(100, ((value.value[1] - props.lo) / span.value) * 100)) : 100,
)
const lRatio = computed(() => (hasRange.value ? (value.value[0] - props.lo) / span.value : 0))

function barActive(i: number) {
  const bLo = props.lo + i * props.bktSize
  return bLo + props.bktSize > value.value[0] && bLo < value.value[1]
}

function onInput(moved: 'min' | 'max', e: Event) {
  const next: [number, number] = [...value.value]
  next[moved === 'min' ? 0 : 1] = parseInt((e.target as HTMLInputElement).value, 10)
  const gap = hasRange.value ? props.step : 0
  if (hasRange.value && next[0] >= next[1] - gap) {
    if (moved === 'min') next[0] = next[1] - gap
    else next[1] = next[0] + gap
  }
  value.value = next
  ;(e.target as HTMLInputElement).value = String(next[moved === 'min' ? 0 : 1])
}
</script>

<template>
  <div style="padding: 4px 16px 14px">
    <div style="display: flex; justify-content: space-between; margin-bottom: 10px">
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
          background: #e5e7eb;
          border-radius: 9999px;
          pointer-events: none;
        "
      >
        <div
          :style="{
            position: 'absolute',
            height: '100%',
            borderRadius: '9999px',
            background: '#2563eb',
            left: lPct + '%',
            right: 100 - rPct + '%',
          }"
        />
      </div>
      <input
        type="range"
        class="rng"
        :min="lo"
        :max="hi"
        :value="value[0]"
        :step="step"
        :style="{ zIndex: lRatio > 0.9 ? 6 : 4 }"
        @input="onInput('min', $event)"
        @change="emit('commit')"
      />
      <input
        type="range"
        class="rng"
        :min="lo"
        :max="hi"
        :value="value[1]"
        :step="step"
        :style="{ zIndex: lRatio > 0.9 ? 4 : 5 }"
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
          background: barActive(i) ? '#93c5fd' : '#d1d5db',
          borderRadius: '2px 2px 0 0',
          transition: 'background .12s',
        }"
      />
    </div>
  </div>
</template>

<style scoped>
.rng {
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
.rng::-webkit-slider-thumb {
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
.rng::-moz-range-thumb {
  width: 20px !important;
  height: 20px !important;
  border-radius: 50% !important;
  background: #2563eb !important;
  border: 2.5px solid #fff !important;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.28) !important;
  pointer-events: all !important;
  cursor: pointer !important;
}
.rng::-webkit-slider-runnable-track {
  background: transparent !important;
  height: 0 !important;
}
.rng::-moz-range-track {
  background: transparent !important;
  height: 0 !important;
}
</style>
