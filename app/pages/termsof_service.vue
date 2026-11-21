<script setup lang="ts">
/**
 * Terms of service (the Laravel HomeController@termsof_service: __fixed-templates/{template}/termsof_service.blade.php, which includes
 * components/global/terms-service/index.blade.php). The same page on all four templates; the layout adds the template's nav
 * and footer. Its data is the dealer's company and locations (useSite()).
 */
import TermsOfService from '~/components/global/pages/TermsOfService.vue'
</script>

<template>
  <TermsOfService />
</template>
