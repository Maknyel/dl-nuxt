<script setup lang="ts">
// The dealer template's footer: template-1 has its own; templates 2–4 share one (the Laravel global/footer), each in
// its own colours (the Laravel template-N/footer/layout-4 include parameters).
import Template1Footer from '~/components/template-1/Footer.vue'
import GlobalFooter from '~/components/global/Footer.vue'

const { template } = useSite()
interface FooterColours { background: string; subFooter: string; text: string }
const COLOURS: Record<string, FooterColours> = {
  'template-2': { background: '#312d2d', subFooter: 'rgb(0 0 0)', text: '#ffffff' },
  'template-3': { background: '#222222', subFooter: 'rgb(0 0 0)', text: '#ffffff' },
  'template-4': { background: '#26313c', subFooter: '#1e2832', text: '#ffffff' },
}
const colours = computed<FooterColours>(() => COLOURS[template.value] ?? COLOURS['template-2']!)
</script>

<template>
  <Template1Footer v-if="template === 'template-1'" />
  <GlobalFooter v-else v-bind="colours" />
</template>
