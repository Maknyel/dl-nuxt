<script setup lang="ts">
/**
 * Contact us (the Laravel HomeController@contactus: __fixed-templates/{template}/contactus.blade.php, which includes
 * components/global/contact-us/contactus.blade.php). The same page on all four templates; the layout adds the template's nav
 * and footer. Its data is the dealer's company and locations (useSite()).
 */
import ContactUs from '~/components/global/pages/ContactUs.vue'
</script>

<template>
  <ContactUs />
</template>
