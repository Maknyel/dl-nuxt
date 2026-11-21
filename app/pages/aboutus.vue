<script setup lang="ts">
/**
 * About us (the Laravel HomeController@aboutus: __fixed-templates/{template}/aboutus.blade.php, which includes
 * components/global/about/index.blade.php). The same page on all four templates; the layout adds the template's nav
 * and footer. Its data is the dealer's company and locations (useSite()).
 */
import About from '~/components/global/pages/About.vue'
</script>

<template>
  <About />
</template>
