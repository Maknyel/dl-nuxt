<script setup lang="ts">
/**
 * Sell Us Your Car, /sell (the Laravel HomeController@sell: __fixed-templates/{template}/sell.blade.php, which includes
 * components/global/sell/form.blade.php). The same page on all four templates; the layout adds the template's nav and
 * footer. Two cards on the tinted page: what the service is (hidden on phones) and the two-step form.
 *
 * Data: the dealer (useSite()) for the store picker and the logo; the controller's `staticmake`
 * (/api/site/sell, get-sell-us-your-car-data) is fetched as the Laravel page does, though the form doesn't render it
 * (its makes come from the saleable-makes list in the browser).
 */
import '~/components/global/sell/sell-page.css'
import SellIntro from '~/components/global/sell/Intro.vue'
import SellForm from '~/components/global/sell/Form.vue'

await useFetch('/api/site/sell', { key: 'sell-data' })
</script>

<template>
  <div class="sell-page">
    <SellIntro />
    <SellForm />
  </div>
</template>
