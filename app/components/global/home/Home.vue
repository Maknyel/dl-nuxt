<script setup lang="ts">
/**
 * The template 2-4 home body (wip-template-builder/index.blade.php's section list for those templates): the hero
 * (or the multi-location hero for a Multi dealer), then inventory, sell, finance, about and reviews, each behind the
 * dealer's template_nav flag as the Blade has it. The nav and footer come from the layout.
 */
import Hero from './Hero.vue'
import MultiHero from './MultiHero.vue'
import Inventory from './Inventory.vue'
import Sell from './Sell.vue'
import Finance from './Finance.vue'
import About from './About.vue'
import Review from './Review.vue'

defineProps<{ home: any }>()

const { templateNav, isMulti, isSales } = useSite()
const on = (flag: string) => String(templateNav.value?.[flag] ?? '') === '1'
</script>

<template>
  <div>
    <MultiHero v-if="isMulti && !isSales" :home="home" />
    <Hero v-else />
    <Inventory v-if="on('show_view_inventory')" :vehicles="home?.vehicles ?? []" />
    <Sell v-if="on('show_sell')" />
    <Finance v-if="on('show_credit')" />
    <About />
    <Review v-if="on('show_review')" :reviews="home?.reviews ?? []" />
  </div>
</template>
