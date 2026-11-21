<script setup lang="ts">
/**
 * The credit application, /finance (the Laravel HomeController@finance, which renders `new_finance`:
 * __fixed-templates/{template}/new_finance.blade.php → components/global/finance/new_form.blade.php). The same page
 * on all four templates; the layout adds the template's nav and footer.
 *
 * Data: the trade-in step's makes and, for a Multi dealer opened from a vehicle (?vehicle_id), that vehicle's store
 * (/api/site/finance); the company and its locations come from useSite().
 */
import CreditApp from '~/components/global/finance/CreditApp.vue'

const route = useRoute()
const vehicleId = computed(() => String(route.query.vehicle_id ?? ''))

const { data } = await useFetch('/api/site/finance', {
  key: () => `finance-${vehicleId.value}`,
  query: computed(() => (vehicleId.value ? { vehicle_id: vehicleId.value } : {})),
})
</script>

<template>
  <CreditApp :staticmake="data?.staticmake ?? []" :vehicle-location-id="data?.vehicleLocationId ?? null" />
</template>
