<script setup lang="ts">
/**
 * global/contact-us/company-info.blade.php: the "COMPANY INFORMATION" card beside the Privacy Policy and Terms of
 * Service text (phone, email, address with a directions link).
 */
const { company } = useSite()

const state = computed(() => capsOnly(company.value.state ?? ''))
const mapUrl = computed(
  () =>
    `https://www.google.com/maps/dir/?api=1&destination=${company.value.street_address ?? ''}, ${company.value.city ?? ''}, ${state.value} ${company.value.zip_code ?? ''}`,
)
</script>

<template>
  <div
    class="rounded-sm px-6 py-10 min-h-full w-full flex flex-col gap-5"
    style="
      box-shadow: 0 8px 26px -4px rgb(20 20 20 / 15%), 0 8px 9px -5px rgb(20 20 20 / 6%) !important;
      border: 1px solid rgba(0, 0, 0, 0.125) !important;
    "
  >
    <h4 class="font-semibold form-label text-xl mb-3.5 lg:text-left text-center">COMPANY INFORMATION</h4>
    <ul class="flex flex-col gap-5">
      <li v-if="company.phone_number" class="flex flex-col">
        <span class="font-bold">Phone:</span>
        <a :href="`tel:${company.phone_number}`" class="py-2">{{ formatPhone(company.phone_number) }}</a>
      </li>
      <li v-if="company.email" class="flex flex-col">
        <span class="font-bold">Email:</span>
        <a :href="`mailto:${company.email}`" class="py-2">
          {{ company.email }}
        </a>
      </li>
      <li v-if="company.street_address" class="flex flex-col">
        <span class="font-bold">Address:</span>
        <a target="_blank" :href="mapUrl" class="py-2"
          >{{ company.street_address }} {{ company.city }} {{ state }} {{ company.zip_code }}</a
        >
      </li>
    </ul>
  </div>
</template>
