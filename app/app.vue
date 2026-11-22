<script setup lang="ts">
/**
 * The app's frame (Nuxt's NuxtLayout + NuxtPage): each page in the site's layout (nav, page, footer), except a page
 * whose route says `layout: false` (the vehicle page draws its own). Pages load their data with a top-level
 * `await useFetch(...)`, so each renders inside <Suspense>. Until a page's data is in, the fallback is a skeleton
 * (PageSkeleton), not an empty body.
 */
import DefaultLayout from '~/layouts/default.vue'
import PageSkeleton from '~/components/PageSkeleton.vue'
</script>

<template>
  <RouterView v-slot="{ Component, route }">
    <template v-if="route.meta.layout === false">
      <Suspense>
        <component :is="Component" :key="route.path" />
        <template #fallback><PageSkeleton /></template>
      </Suspense>
    </template>
    <DefaultLayout v-else>
      <Suspense>
        <component :is="Component" :key="route.path" />
        <template #fallback><PageSkeleton /></template>
      </Suspense>
    </DefaultLayout>
  </RouterView>
</template>
