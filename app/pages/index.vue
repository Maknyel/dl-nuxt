<script setup lang="ts">
/**
 * The home page (the Laravel HomeController@index + wip-template-builder/index.blade.php). Template 1 has its own
 * sections; templates 2–4 share theirs. The nav and footer always show here (definePageMeta), as on the Laravel home.
 */
import Template1Home from '~/components/template-1/home/Home.vue'
import GlobalHome from '~/components/global/home/Home.vue'

definePageMeta({ alwaysShell: true })

const route = useRoute()
const { template } = useSite()

const { data: home } = await useFetch('/api/site/home', {
  key: 'home',
  query: { currentHeroImage: route.query.currentHeroImage },
})
</script>

<template>
  <Template1Home v-if="template === 'template-1'" :home="home" />
  <GlobalHome v-else :home="home" />
</template>
