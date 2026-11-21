<script setup lang="ts">
/**
 * Privacy policy (the Laravel HomeController@privacy_policy: __fixed-templates/{template}/privacy_policy.blade.php, which includes
 * components/global/privacy-policy/index.blade.php). The same page on all four templates; the layout adds the template's nav
 * and footer. Its data is the dealer's company and locations (useSite()).
 */
import PrivacyPolicy from '~/components/global/pages/PrivacyPolicy.vue'
</script>

<template>
  <PrivacyPolicy />
</template>
