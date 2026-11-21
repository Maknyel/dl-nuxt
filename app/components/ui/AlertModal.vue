<script setup lang="ts">
/**
 * <x-alert-component> (custom-components/alert-component.blade.php): the "Thank You!" modal a lead form shows after a
 * successful submit (hidden until then). Closing it reloads the page, as the Blade's closeThisModal() does.
 *
 * `vehicle` (the Blade's ifvehicle + vehiclevaluearray) adds the vehicle's photo and details.
 */
const props = withDefaults(
  defineProps<{
    show?: boolean
    title?: string
    description?: string
    bottomDescription?: string
    logoPath?: string
    vehicle?: Record<string, any> | null
  }>(),
  { show: false, title: '', description: '', bottomDescription: '', logoPath: '', vehicle: null },
)

const FALLBACK = '/imgfav/dealer-lion-logo.png'
const onImgError = (e: Event) => {
  const img = e.target as HTMLImageElement
  if (!img.src.endsWith(FALLBACK)) img.src = FALLBACK
}

const details = computed(() => {
  const v = props.vehicle
  if (!v) return []
  const rows: { id: string; label: string; key: string }[] = [
    { id: 'vin', label: 'VIN:', key: 'vin' },
    { id: 'year', label: 'Year:', key: 'year' },
    { id: 'make', label: 'Make:', key: 'make' },
    { id: 'model', label: 'Model:', key: 'model' },
    { id: 'trim', label: 'Trim:', key: 'trim' },
    { id: 'stock', label: 'Stock #:', key: 'stock' },
    { id: 'mileage', label: 'Mileage:', key: 'mileage' },
    { id: 'price', label: 'Price:', key: 'price' },
  ]
  return rows.filter((r) => v[r.key] != null)
})

function closeThisModal() {
  window.location.reload()
}
</script>

<template>
  <!-- Modal Background -->
  <div
    id="alert_modal_is_show"
    :class="{ hidden: !show }"
    class="fade-in fixed inset-0 bg-black/50 flex items-center justify-center z-50"
  >
    <!-- Modal Container -->
    <div
      class="bg-white rounded-lg w-[800px] max-w-[90vw] shadow-lg overflow-hidden max-h-[95vh] xl:max-h-[80vh] lg:max-h-[80vh] md:max-h-[80vh] flex flex-col"
    >
      <!-- Modal Header -->
      <div class="relative border-b border-gray-200 px-4 py-3 flex items-center justify-center h-[50px]">
        <div class="text-lg font-semibold">
          <img id="alert_modal_img" class="h-auto w-[100px]" :src="logoPath || FALLBACK" @error="onImgError" />
        </div>
        <!-- Close Button Right -->
        <button
          class="btn-icon-circle on-light absolute right-4 top-1/2 transform -translate-y-1/2 text-2xl leading-none"
          @click="closeThisModal"
        >
          &times;
        </button>
      </div>

      <!-- Modal Body -->
      <div class="w-full p-5 px-0 overflow-y-auto items-center flex flex-col gap-2 flex-1 h-full">
        <label id="alert_modal_title" class="text-3xl xl:px-20 lg:px-20 md:px-20 px-5 font-semibold">{{ title }}</label>
        <label id="alert_modal_description" class="xl:px-20 lg:px-20 md:px-20 px-5 font-normal text-center">{{
          description
        }}</label>
        <div v-if="vehicle" class="w-full py-2 xl:px-20 lg:px-20 md:px-20 px-5">
          <div class="gap-4 flex items-center justify-start w-full flex-col xl:flex-row lg:flex-row md:flex-row">
            <div class="w-[250px] min-w-[250px] max-w-[250px]">
              <img id="alert_modal_vehicle_img" class="h-auto w-full" :src="vehicle.image" @error="onImgError" />
            </div>
            <div class="flex flex-col w-full gap-2">
              <label v-if="vehicle.title != null" id="alert_modal_vehicle_title" class="text-xl font-semibold">
                {{ vehicle.title }}
              </label>
              <label
                v-for="row in details"
                :id="`alert_modal_vehicle_${row.id}`"
                :key="row.id"
                class="text-sm font-normal"
              >
                <b>{{ row.label }}</b> {{ vehicle[row.key] }}
              </label>
            </div>
          </div>
        </div>
        <div class="w-full xl:px-20 lg:px-20 md:px-20 px-5">
          <div
            id="alert_modal_bottom_description"
            class="w-full font-normal p-2 border border-[rgb(68,73,42)] bg-[rgb(187,210,192)] text-center"
          >
            {{ bottomDescription }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-in {
  opacity: 1;
  animation-name: fadeInOpacity;
  animation-iteration-count: 1;
  animation-timing-function: ease-in;
  animation-duration: 0.5s;
}

@keyframes fadeInOpacity {
  0% {
    opacity: 0;
  }

  100% {
    opacity: 1;
  }
}
</style>
