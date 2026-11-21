<script setup lang="ts">
// The dealer template's nav (the Laravel site's {template}/nav/layout-4): one component per template.
import Template1Nav from '~/components/template-1/Nav.vue'
import Template2Nav from '~/components/template-2/Nav.vue'
import Template3Nav from '~/components/template-3/Nav.vue'
import Template4Nav from '~/components/template-4/Nav.vue'

const { template } = useSite()
const NAVS = {
  'template-1': Template1Nav,
  'template-2': Template2Nav,
  'template-3': Template3Nav,
  'template-4': Template4Nav,
} as const
</script>

<template>
  <component :is="NAVS[template] ?? Template1Nav" />
</template>
