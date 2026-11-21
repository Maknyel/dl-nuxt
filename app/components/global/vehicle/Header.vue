<script setup lang="ts">
/**
 * The vehicle page's title band (Laravel global/cars/view-vehicle-header.blade.php): Back to Inventory, the title with
 * its body style and drive, the mileage pill (with copy), Call Us and I'm Interested. Styled by vdp-page.css.
 */
import CopyButton from './CopyButton.vue'

const props = defineProps<{ vehicle: Record<string, any> }>()
const emit = defineEmits<{ interested: [] }>()
const { company } = useSite()

const v = computed(() => props.vehicle)
const title = computed(() =>
  `${v.value.year ?? ''} ${v.value.make ?? ''} ${v.value.model ?? ''} ${v.value.trim ?? ''}`.trim(),
)
const sub = computed(() => `${v.value.style ?? ''} ${v.value.drivetrain ?? ''}`.trim())
const hasMiles = computed(() => isNumeric(v.value.mileage) && String(v.value.mileage).trim() !== '')
const miles = computed(() => Math.round(Number(v.value.mileage)).toLocaleString('en-US'))

function isNumeric(x: unknown): boolean {
  return x !== null && x !== '' && !Number.isNaN(Number(x))
}
</script>

<template>
  <div class="vdp-band">
    <div class="vdp-band-row">
      <NuxtLink to="/pre-owned-cars" class="vdp-band-back">
        <Icon name="ion:arrow-back-outline" />
        <span>Back to Inventory</span>
      </NuxtLink>

      <div class="vdp-band-main">
        <h1 class="vdp-band-title">
          {{ title }}
          <span v-if="sub !== ''" class="vdp-band-title-sub">{{ sub }}</span>
        </h1>
      </div>

      <div class="vdp-band-end">
        <div class="vdp-band-pills">
          <span v-if="hasMiles && Number(vehicle.mileage) !== 0" class="vdp-band-pill">
            <Icon name="ion:speedometer-outline" />
            <span>{{ miles }} mi</span>
            <CopyButton class="vdp-copy vdp-copy--pill" :text="miles" label="Copy mileage" />
          </span>
        </div>

        <div class="vdp-band-actions">
          <a :href="`tel:${company.phone_number ?? ''}`" class="vdp-band-btn vdp-band-btn--white">
            <Icon name="ion:call-outline" />
            <span>Call Us</span>
          </a>
          <a href="#" class="vdp-band-btn vdp-band-btn--primary" @click.prevent="emit('interested')">
            <Icon name="ion:create-outline" />
            <span>I'm Interested</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
