<script setup lang="ts">
/**
 * global/disclaimer-notice/index.blade.php: the Disclaimer Notice text beside the company card and the map.
 *
 * Unlike the privacy and terms pages, the Blade's text column has no p-4, so none here.
 * The page keeps the site's old body font (Poppins, not loaded, so the system UI font), as on :8002.
 */
import PolicyCompanyInfo from './PolicyCompanyInfo.vue'
import PolicyMap from './PolicyMap.vue'
</script>

<template>
  <div class="container min-height-container pt-2 lg:pb-4 pb-10 font-poppins">
    <div class="grid grid-cols-12 gap-4">
      <div class="col-span-12 sm:col-span-12 md:col-span-8 lg:col-span-8 xl:col-span-8">
        <div class="font-black text-center form-label text-4xl my-2 mb-3.5">Disclaimer Notice</div>
        <div class="h-3" />
        <p class="text-justify">
          All advertised prices exclude government fees and taxes, any finance charges, any dealer document preparation
          charge, and any emission testing charge. While we try to make sure that all prices posted here are accurate at
          all times, we cannot be responsible for typographical and other errors that may appear on the site. We make
          every effort to provide you the most accurate, up-to-the-minute information; however, it is your responsibility
          to verify with the Dealer that all details listed are accurate. The dealership is not responsible for
          typographical, pricing, product information, advertising or shipping errors. Advertised prices and available
          quantities are subject to change without notice. All rates and offers are dependent on bank approval, which
          varies based on applicant's credit as well as the vehicle.
        </p>
      </div>
      <div class="col-span-12 sm:col-span-12 md:col-span-4 lg:col-span-4 xl:col-span-4 flex flex-col gap-2">
        <div class="flex lg:mt-20">
          <PolicyCompanyInfo />
        </div>

        <div class="flex">
          <PolicyMap />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.min-height-container {
  min-height: calc(100vh - 5rem);
}
</style>
