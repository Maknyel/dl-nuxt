<script setup lang="ts">
/**
 * The inventory's "I'm Interested in this Vehicle" pop-up (vehicle-lists.blade.php's #openVehicleInquiryModal): the
 * vehicle's title, price and miles, colours, VIN and stock over the shared inquiry form (global/vehicle/InquiryForm,
 * which has the contact and trade-in steps). For a Multi dealer, a vehicle at another location shows that location.
 */
import InquiryForm from '~/components/global/vehicle/InquiryForm.vue'

const props = defineProps<{ vehicle: Record<string, any> }>()
const emit = defineEmits<{ close: [] }>()
const { company } = useSite()

const v = computed(() => props.vehicle)
const title = computed(() => `${v.value.year ?? ''} ${v.value.make ?? ''} ${v.value.model ?? ''} ${v.value.trim ?? ''}`.trim())
const price = computed(() => {
  const n = Number(v.value.internet_price)
  return Number.isFinite(n) && n > 0 ? '$' + Math.round(n).toLocaleString('en-US') : 'CALL FOR PRICE'
})
const miles = computed(() => {
  const n = Number(v.value.mileage)
  return v.value.mileage && Number.isFinite(n) ? Math.round(n).toLocaleString('en-US') + ' mi.' : 'CALL FOR MILEAGE'
})
const location = computed(() =>
  company.value.account_type === 'Multi' && String(company.value.id) !== String(v.value.company_id) && v.value.company?.name
    ? `Location: ${v.value.company.name}`
    : '',
)

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
onMounted(() => document.addEventListener('keydown', onKey))
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <div id="openVehicleInquiryModal">
    <div
      class="fixed z-50 top-0 left-0 flex items-center justify-center w-full h-full px-[10px]"
      style="background-color: rgba(0, 0, 0, 0.5)"
    >
      <div
        class="relative iminterested-popup h-auto mx-2 text-left bg-white rounded-sm shadow-xl xl:max-w-5xl lg:max-w-5xl md:max-w-5xl max-w-full"
      >
        <div class="flex flex-1 flex-col overflow-hidden">
          <div class="flex justify-end items-center p-2">
            <a class="btn-icon-circle on-light cursor-pointer" @click="emit('close')">
              <Icon name="ion:close-outline" />
            </a>
          </div>

          <div class="flex flex-col gap-2">
            <div class="text-center md:block lg:block xl:block">
              <h3 class="text-center text-lg font-medium leading-6 text-gray-900 uppercase interested-modal-title-mobile">
                I'm Interested in this Vehicle
              </h3>
              <div id="vehicle_inquiry_title" class="car_title justify-center company-primary-base-text">{{ title }}</div>
            </div>

            <div v-if="location" id="div_rooftop" class="flex items-center justify-center gap-2">
              <div id="inquiry_vehicle_company" class="text-xl font-bold md:text-center">{{ location }}</div>
            </div>

            <div class="flex items-center justify-center gap-2">
              <div id="inquiry_vehicle_price" class="text-xl font-bold md:text-center">{{ price }}</div>
              ||
              <div id="inquiry_vehicle_miles" class="text-xl font-bold md:text-center flex items-center justify-center">
                {{ miles }}
              </div>
            </div>

            <div class="grid col-span-2 md:flex lg:flex xl:flex items-center justify-center gap-2 responsive-remove-div">
              <div class="carinfo-label"><b class="carinfo-label-b">Exterior: </b>{{ v.exterior }}</div>
              <span class="car-info-division">||</span>
              <div class="carinfo-label"><b class="carinfo-label-b">Interior: </b>{{ v.interior }}</div>
              <span class="car-info-division">||</span>
              <div class="carinfo-label"><b class="carinfo-label-b">Vin: </b>{{ v.vin_number }}</div>
              <span class="car-info-division">||</span>
              <div class="carinfo-label"><b class="carinfo-label-b">Stock Number: </b>{{ v.stock }}</div>
            </div>
          </div>

          <div id="vehicle_inquiry_form" class="p-2 flex flex-1 flex-col gap-1 overflow-auto" style="max-height: 60vh">
            <InquiryForm :vehicle="vehicle" variant="modal" @close="emit('close')" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
