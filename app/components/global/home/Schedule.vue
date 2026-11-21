<script setup lang="ts">
/**
 * global/contact-us/schedule.blade.php: the "HOURS OF OPERATION" card (sales and service tables), with a "--" week
 * when the dealer has no hours, or none enabled / visible.
 * The card has the Blade's `bg-base-300` and `company-primary-base-background`; the company class wins, as on :8002
 * (main.css keeps the company-* classes outside the Tailwind layers).
 */
const { company } = useSite()

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface Row {
  day: string
  hours: string
}

const times = computed<Record<string, any> | null>(() => company.value.times || null)

const visible = (list: unknown): Row[] =>
  Array.isArray(list)
    ? list
        .filter((v: any) => v?.is_visible == true)
        .map((v: any) => ({
          day: String(v.date_of_the_week ?? '').slice(0, 3),
          hours: `${v.time_in ?? ''} - ${v.time_out ?? ''}`,
        }))
    : []

const sales = computed(() => visible(times.value?.sales_schedule))
const service = computed(() => visible(times.value?.service_schedule))

/** PHP's empty-array / empty-string falsiness for `@if ($company['times']['sales_schedule'])`. */
const hasSalesSchedule = computed(() => {
  const s = times.value?.sales_schedule
  return Array.isArray(s) ? s.length > 0 : Boolean(s)
})

const salesOn = computed(() => String(times.value?.is_sales_enabled ?? '') === '1' && sales.value.length !== 0)
const serviceOn = computed(() => String(times.value?.is_service_enabled ?? '') === '1' && service.value.length !== 0)
const showEmpty = computed(
  () =>
    (String(times.value?.is_sales_enabled ?? '') !== '1' && String(times.value?.is_service_enabled ?? '') !== '1') ||
    (sales.value.length === 0 && service.value.length === 0),
)

const tables = computed(() => {
  const out: { title: string; rows: Row[] }[] = []
  if (salesOn.value) out.push({ title: 'Sales Department', rows: sales.value })
  if (serviceOn.value) out.push({ title: 'Service Department', rows: service.value })
  return out
})

const emptyRows: Row[] = DAYS.map((day) => ({ day, hours: '--' }))
</script>

<template>
  <div class="bg-base-300 text-base-content justify-start min-h-full company-primary-base-background shadow-lg px-6 py-10">
    <h4 class="font-semibold form-label text-xl mb-3.5 lg:text-left text-center">HOURS OF OPERATION</h4>

    <template v-if="times">
      <div v-if="hasSalesSchedule" class="flex flex-col">
        <div v-for="table in tables" :key="table.title" class="w-full ho-table-container">
          <table class="table-auto w-full" :class="{ 'text-left': table.title === 'Service Department' }">
            <thead>
              <tr>
                <th />
                <th class="p-2 text-center">{{ table.title }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in table.rows" :key="i" class="border-slate-300 border-b last:border-b-0">
                <td class="border-slate-300 border-r p-2 py-2 font-semibold text-center">{{ row.day }}</td>
                <td class="p-2 py-2 text-center">{{ row.hours }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <table v-if="showEmpty" class="table-auto w-full">
          <thead>
            <tr>
              <th />
              <th class="p-2 text-center">Sales Department</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in emptyRows" :key="row.day" class="border-slate-300 border-b last:border-b-0">
              <td class="border-slate-300 border-r p-2 py-2 font-semibold text-center">{{ row.day }}</td>
              <td class="p-2 py-2 text-center">{{ row.hours }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
    <table v-else class="table-auto w-full">
      <thead>
        <tr>
          <th />
          <th class="p-2 text-center">Sales Department</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in emptyRows" :key="row.day" class="border-slate-300 border-b last:border-b-0">
          <td class="border-slate-300 border-r p-2 py-2 font-semibold text-center">{{ row.day }}</td>
          <td class="p-2 py-2 text-center">{{ row.hours }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
