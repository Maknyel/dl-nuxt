<script setup lang="ts">
/**
 * The inventory page (the Laravel HomeController@searchLive + __fixed-templates/{t}/search-live.blade.php →
 * global/cars/index-live), the same on all 4 templates. The query string is the Laravel page's (make[]=,
 * body_type[]=, page, sort_by, search, qbt[], ...): /api/site/inventory reads it, and every filter change is a route
 * change, so the page refetches, the URL is shareable and back / forward work.
 */
import type { InventoryResponse } from '~/composables/useInventorySearch'
import InventorySearch from '~/components/global/inventory/Search.vue'

const route = useRoute()

const { data, status, error, refresh } = await useFetch<InventoryResponse>('/api/site/inventory', {
  key: 'inventory',
  query: computed(() => route.query),
})
</script>

<template>
  <InventorySearch :data="data ?? null" :pending="status === 'pending'" :error="!!error" :refresh="refresh" />
</template>
