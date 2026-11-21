<script setup lang="ts">
/**
 * The vehicle page, /view/{id} (the Laravel HomeController@show + __fixed-templates/{t}/show.blade.php; the same on
 * all 4 templates apart from the nav and footer):
 *  - the title band, the gallery with the price panel and inquiry form, the payment row, the details, About and the
 *    trust strip (components/global/vehicle/*), styled by vdp-page.css (the Blade's inline styles);
 *  - the I'm Interested pop-up (the band's button; Schedule Test Drive falls back to it);
 *  - the head: the title "{year} {make} {model} {trim}", the "Explore this ..." description and the vehicle's JSON-LD
 *    (Vehicle + Offer), as the Blade's @section / @push('head'); keywords from the vehicle's meta_keywords.
 *  - No such vehicle: Vehicle Not Found with a 404, without the nav and footer (the Laravel controller returns that
 *    view on its own).
 *
 * Not ported (dead on the Laravel page, views-map.md): the hidden legacy tab block (with the hours table, so the
 * dealer's hours, returned as `hours`, show nowhere there either), Similar Vehicles (`@if (false)`), the market card
 * (`@if (false)`), and the PhotoSwipe / #inquireform scripts.
 */
import '~/components/global/vehicle/vdp-page.css'
import VehicleHeader from '~/components/global/vehicle/Header.vue'
import VehicleInformation from '~/components/global/vehicle/Information.vue'
import VehiclePayment from '~/components/global/vehicle/Payment.vue'
import VehicleDetails from '~/components/global/vehicle/Details.vue'
import InquiryForm from '~/components/global/vehicle/InquiryForm.vue'
import VehicleNotFound from '~/components/global/vehicle/NotFound.vue'

// The layout is chosen below: the vehicle in the site's frame, Vehicle Not Found on its own.
definePageMeta({ layout: false })

const route = useRoute()
const id = computed(() => String(route.params.id ?? ''))

const { data } = await useFetch(() => `/api/site/vehicle/${encodeURIComponent(id.value)}`, {
  key: `vehicle-${id.value}`,
})
const vehicle = computed<Record<string, any> | null>(() => (data.value?.vehicle as Record<string, any> | null) ?? null)

if (!vehicle.value && import.meta.server) {
  const event = useRequestEvent()
  if (event) setResponseStatus(event, 404, 'Vehicle Not Found')
}

/* ── Head ── */
const requestUrl = useRequestURL()
const num = (x: unknown) => (x !== null && x !== undefined && String(x).trim() !== '' && !Number.isNaN(Number(x)) ? Number(x) : null)

const title = computed(() => {
  const v = vehicle.value
  return v ? `${v.year} ${v.make} ${v.model} ${v.trim ?? ''}` : ''
})
const description = computed(() => {
  const v = vehicle.value
  return v ? `Explore this ${v.year} ${v.make} ${v.model} with ${v.mileage} miles. VIN: ${v.vin_number}` : ''
})

const jsonLd = computed(() => {
  const v = vehicle.value
  if (!v) return ''
  const price = num(v.internet_price)
  const miles = num(v.mileage) ?? 0
  const images = v.features?.image_urls ? String(v.features.image_urls).split('|') : []
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Vehicle',
    name: `${v.year} ${v.make} ${v.model}${v.trim !== null && v.trim !== undefined ? ` ${v.trim}` : ''}`,
    description: `Explore this ${v.year} ${v.make} ${v.model} with ${Math.round(miles).toLocaleString('en-US')} miles. VIN: ${v.vin_number}.`,
    vehicleModelDate: String(v.year ?? ''),
    manufacturer: { '@type': 'Organization', name: v.make },
    model: v.model,
    brand: { '@type': 'Brand', name: v.make },
    vehicleIdentificationNumber: v.vin_number,
    mileageFromOdometer: { '@type': 'QuantitativeValue', value: Math.trunc(miles), unitCode: 'MI' },
    offers: {
      '@type': 'Offer',
      url: `${requestUrl.origin}${requestUrl.pathname}`,
      availability: 'https://schema.org/InStock',
      ...(price !== null ? { price, priceCurrency: 'USD' } : {}),
    },
    image: images,
  })
})

useHead(() =>
  vehicle.value
    ? {
        title: title.value,
        meta: [
          { name: 'description', content: description.value, key: 'description' },
          ...(vehicle.value.features?.meta_keywords
            ? [{ name: 'keywords', content: String(vehicle.value.features.meta_keywords), key: 'keywords' }]
            : []),
        ],
        script: [{ type: 'application/ld+json', innerHTML: jsonLd.value, key: 'vdp-jsonld' }],
      }
    : {},
)

/* ── The I'm Interested pop-up ── */
const interestedOpen = ref(false)
watch(interestedOpen, (open) => {
  if (import.meta.client) document.body.style.overflow = open ? 'hidden' : ''
})
onBeforeUnmount(() => {
  if (import.meta.client) document.body.style.overflow = ''
})
</script>

<template>
  <NuxtLayout v-if="vehicle" name="default">
    <div class="container m-auto lg:px-0 px-4 show-vehicle">
      <VehicleHeader :vehicle="vehicle" @interested="interestedOpen = true" />
      <VehicleInformation :vehicle="vehicle" />
      <VehiclePayment :vehicle="vehicle" />
      <VehicleDetails :vehicle="vehicle" @interested="interestedOpen = true" />
    </div>
    <!-- On the Laravel page the hidden legacy block closes the container early and leaves these two spacers (and the
         pop-up) after it. -->
    <div class="h-4" />
    <div class="h-4" />

    <div
      v-show="interestedOpen"
      class="fixed top-0 left-0 flex items-center justify-center w-full h-full z-50 padding-for-modal-interested"
      style="background-color: rgba(0, 0, 0, 0.5)"
    >
      <InquiryForm :vehicle="vehicle" variant="modal" @close="interestedOpen = false" />
    </div>
  </NuxtLayout>
  <VehicleNotFound v-else />
</template>

<style>
@media (max-width: 991px) {
  /* custom-design.css (every Laravel page). */
  .padding-for-modal-interested {
    padding-left: 10px;
    padding-right: 10px;
  }
}
</style>
