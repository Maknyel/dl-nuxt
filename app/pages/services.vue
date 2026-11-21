<script setup lang="ts">
/**
 * Book Service, /services (the Laravel HomeController@services: __fixed-templates/{template}/view_service.blade.php,
 * which includes components/global/service/form.blade.php). The same page on all four templates; the layout adds the
 * template's nav and footer. Its data: the dealer's services and the make list (/api/site/services), and the company
 * and locations (useSite()).
 */
import BookService from '~/components/global/service/BookService.vue'

const { data } = await useFetch('/api/site/services', { key: 'site-services' })
</script>

<template>
  <BookService :services="data?.services ?? []" :makes="data?.makes ?? []" />
</template>
