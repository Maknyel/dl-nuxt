<script setup lang="ts">
/**
 * global/contact-us/map.blade.php: the embedded Google map card under the company card on Privacy Policy and Terms of
 * Service. (The Blade's map snippet also carries a hidden third-party backlink under the iframe; it is clipped by the
 * 500px box and not ported.)
 */
const { company } = useSite()

const src = computed(
  () =>
    `https://maps.google.it/maps?q=${company.value.street_address ?? ''}, ${company.value.city ?? ''}, ${capsOnly(company.value.state ?? '')} ${company.value.zip_code ?? ''}&output=embed`,
)
</script>

<template>
  <div
    class="p-4 rounded-sm card justify-content-center shadow-lg min-h-full w-full"
    style="
      box-shadow: 0 8px 26px -4px rgb(20 20 20 / 15%), 0 8px 9px -5px rgb(20 20 20 / 6%) !important;
      border: 1px solid rgba(0, 0, 0, 0.125) !important;
    "
  >
    <div class="my-auto">
      <div class="mapouter">
        <div class="gmap_canvas">
          <iframe
            id="gmap_canvas"
            height="100%"
            width="100%"
            :src="src"
            frameborder="0"
            scrolling="no"
            marginheight="0"
            marginwidth="0"
          />
          <br />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mapouter {
  position: relative;
  text-align: right;
  height: 500px;
  width: 100%;
}

.gmap_canvas {
  overflow: hidden;
  background: none !important;
  height: 500px;
  width: 100%;
}
</style>
