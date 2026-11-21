<script setup lang="ts">
/**
 * <x-hour-operation :valuearray="..."> (custom-components/contact-us/hour-of-operation.blade.php): the "Hours of
 * Operation" card on About Us and Contact Us. Sales and service departments from `times`, a "--" week when there are
 * no hours or neither department is enabled, then the holiday note. Styles: lp-cards.css.
 */
const props = defineProps<{ valuearray: Record<string, any> }>()

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface Row {
  day: string
  time: string
}

const times = computed<Record<string, any> | null>(() => props.valuearray?.times || null)

/** PHP truthiness of `$valuearray['times']['sales_schedule']` (an empty array is false). */
const hasSchedule = computed(() => {
  const s = times.value?.sales_schedule
  return Array.isArray(s) ? s.length > 0 : Boolean(s)
})

const rows = (list: unknown): Row[] =>
  (Array.isArray(list) ? list : [])
    .filter((v: any) => v?.is_visible == true)
    .map((v: any) => ({
      day: String(v?.date_of_the_week ?? '').slice(0, 3),
      time: `${v?.time_in ?? ''} – ${v?.time_out ?? ''}`,
    }))

const salesOn = computed(() => String(times.value?.is_sales_enabled ?? '') === '1')
const serviceOn = computed(
  () => String(times.value?.is_service_enabled ?? '') === '1' && times.value?.service_schedule != null,
)
const neitherOn = computed(
  () => String(times.value?.is_sales_enabled ?? '') !== '1' && String(times.value?.is_service_enabled ?? '') !== '1',
)
const sales = computed(() => rows(times.value?.sales_schedule))
const service = computed(() => rows(times.value?.service_schedule))
</script>

<template>
  <div class="lp-card lp-hours">
    <div class="lp-h">
      <span class="lp-ico"><Icon name="ion:time-outline" aria-hidden="true" /></span>Hours of Operation
    </div>

    <div class="lp-depts">
      <template v-if="times && hasSchedule">
        <!-- Sales Department -->
        <div v-if="salesOn" class="lp-dept">
          <div class="lp-dept-h">
            <span class="lp-ico lp-ico--sm"><Icon name="ion:person-outline" aria-hidden="true" /></span>Sales
            <span class="lp-dept-word">Department</span>
          </div>
          <div v-for="(row, i) in sales" :key="i" class="lp-row">
            <span class="lp-day">{{ row.day }}</span>
            <span class="lp-fill" aria-hidden="true" />
            <span class="lp-time">{{ row.time }}</span>
          </div>
        </div>

        <!-- Service Department -->
        <div v-if="serviceOn" class="lp-dept">
          <div class="lp-dept-h">
            <span class="lp-ico lp-ico--sm"><Icon name="ion:construct-outline" aria-hidden="true" /></span>Service
            <span class="lp-dept-word">Department</span>
          </div>
          <div v-for="(row, i) in service" :key="i" class="lp-row">
            <span class="lp-day">{{ row.day }}</span>
            <span class="lp-fill" aria-hidden="true" />
            <span class="lp-time">{{ row.time }}</span>
          </div>
        </div>

        <!-- Fallback if neither enabled -->
        <div v-if="neitherOn" class="lp-dept">
          <div class="lp-dept-h">
            <span class="lp-ico lp-ico--sm"><Icon name="ion:person-outline" aria-hidden="true" /></span>Sales
            <span class="lp-dept-word">Department</span>
          </div>
          <div v-for="day in DAYS" :key="day" class="lp-row">
            <span class="lp-day">{{ day }}</span><span class="lp-fill" aria-hidden="true" /><span class="lp-time">--</span>
          </div>
        </div>
      </template>

      <!-- No data fallback -->
      <div v-else class="lp-dept">
        <div class="lp-dept-h">
          <span class="lp-ico lp-ico--sm"><Icon name="ion:person-outline" aria-hidden="true" /></span>Sales
          <span class="lp-dept-word">Department</span>
        </div>
        <div v-for="day in DAYS" :key="day" class="lp-row">
          <span class="lp-day">{{ day }}</span><span class="lp-fill" aria-hidden="true" /><span class="lp-time">--</span>
        </div>
      </div>
    </div>

    <!-- Holiday notice -->
    <div class="lp-note">
      <Icon name="ion:calendar-outline" aria-hidden="true" />
      <span>Holiday hours may vary. Please call ahead to confirm.</span>
    </div>
  </div>
</template>

<style src="./lp-cards.css"></style>
