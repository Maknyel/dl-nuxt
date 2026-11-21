<script setup lang="ts">
/**
 * The Birthdate field (applicant / co-applicant): Month, Day and Year selects and the hidden `birthdate` (YYYY-MM-DD)
 * the backend expects, as new_form.blade.php has it.
 *  - 18 or older: the years after today-18-years are listed but disabled; in that boundary year the later months, and
 *    in its boundary month the later days, are disabled too (the Blade's MAX_Y / MAX_M / MAX_D clamps).
 *  - The day list has the month's own length (February 28/29); a picked day or month that no longer fits is cleared.
 */
import type { FinCtx } from './CreditApp.vue'

const props = withDefaults(defineProps<{ co?: boolean }>(), { co: false })

const ctx = inject<FinCtx>('finCtx')!
const { form, bad, msg } = ctx
const p = props.co ? 'co_' : ''
const M = `${p}birth_month`
const D = `${p}birth_day`
const Y = `${p}birth_year`
const HIDDEN = `${p}birthdate`

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const today = new Date()
const cutoff = new Date(today.getTime())
cutoff.setFullYear(cutoff.getFullYear() - 18)
const MAX_Y = cutoff.getFullYear()
const MAX_M = cutoff.getMonth() + 1
const MAX_D = cutoff.getDate()
const YEARS = Array.from({ length: today.getFullYear() - 1900 + 1 }, (_, i) => today.getFullYear() - i)

const isLeapYear = (yr: number) => (yr % 4 === 0 && yr % 100 !== 0) || yr % 400 === 0
function daysInMonth(yr: number | null, mon: number | null) {
  if (!yr || !mon) return 31
  if (mon === 2) return isLeapYear(yr) ? 29 : 28
  return [4, 6, 9, 11].includes(mon) ? 30 : 31
}
const maxMonthForYear = (yr: number | null) => (yr === MAX_Y ? MAX_M : 12)
const maxDayFor = (yr: number | null, mon: number | null) =>
  yr === MAX_Y && mon === MAX_M ? Math.min(daysInMonth(yr, mon), MAX_D) : daysInMonth(yr, mon)

const yr = computed(() => Number(form[Y]) || null)
const mon = computed(() => Number(form[M]) || null)
const maxMonth = computed(() => maxMonthForYear(yr.value))
const dayCount = computed(() => daysInMonth(yr.value, mon.value))
const maxDay = computed(() => maxDayFor(yr.value, mon.value))

/** writeHiddenIso() */
function writeHidden() {
  form[HIDDEN] =
    form[Y] && form[M] && form[D] ? `${form[Y]}-${String(form[M]).padStart(2, '0')}-${String(form[D]).padStart(2, '0')}` : ''
}

/** onChange(): clamp the month, then the day, then the hidden date. */
function onChange() {
  if (form[M] && Number(form[M]) > maxMonthForYear(yr.value)) form[M] = ''
  const prev = Number(form[D]) || null
  const max = maxDayFor(Number(form[Y]) || null, Number(form[M]) || null)
  if (!(prev && prev <= max)) form[D] = ''
  writeHidden()
}

function onMonthOrYear() {
  onChange()
  ctx.resetName(HIDDEN)
}
function onDay() {
  writeHidden()
  ctx.resetName(HIDDEN)
}
</script>

<template>
  <div class="lg:col-span-6 md:col-span-6 col-span-full flex flex-col">
    <label class="form-label text-sm font-bold">
      Birthdate <span class="required-indicator">*</span>
    </label>
    <div class="grid grid-cols-3 gap-2 mt-2.5">
      <select :id="M" v-model="form[M]" :name="M" class="input" :class="{ 'input-error': bad[M] }" @change="onMonthOrYear">
        <option value="">Month</option>
        <option v-for="(label, i) in MONTHS" :key="label" :value="String(i + 1)" :disabled="i + 1 > maxMonth">
          {{ label }}
        </option>
      </select>

      <select :id="D" v-model="form[D]" :name="D" class="input" :class="{ 'input-error': bad[D] }" @change="onDay">
        <option value="">Day</option>
        <option v-for="d in dayCount" :key="d" :value="String(d)" :disabled="d > maxDay">{{ d }}</option>
      </select>

      <select :id="Y" v-model="form[Y]" :name="Y" class="input" :class="{ 'input-error': bad[Y] }" @change="onMonthOrYear">
        <option value="">Year</option>
        <option v-for="y in YEARS" :key="y" :value="String(y)" :disabled="y > MAX_Y">{{ y }}</option>
      </select>
    </div>

    <input :id="HIDDEN" type="hidden" :name="HIDDEN" :value="form[HIDDEN]" />
    <span :id="`${HIDDEN}_vt`" class="validation-text">{{ msg[HIDDEN] }}</span>
  </div>
</template>
