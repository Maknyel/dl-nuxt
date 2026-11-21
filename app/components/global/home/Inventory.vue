<script setup lang="ts">
/**
 * global/home/inventory.blade.php (via template-{2,3,4}/cars/layout-4): "Our Used Car Inventory", the home's
 * vehicle cards (up to 6) and a "View All Inventory" link. The price row shows when the nav flag show_car_price is on.
 */
const props = defineProps<{ vehicles: any[] }>()

const { templateNav } = useSite()

const NO_IMAGE =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/1665px-No-Image-Placeholder.svg.png'
// The Blade's onerror image (asset('media/images/company/exv3.jpg')).
const FALLBACK = '/media/images/company/exv3.jpg'

const showPrice = computed(() => String(templateNav.value?.show_car_price ?? '') === '1')

/** Helper.php `check_string()`: the trim, plus the drivetrain unless the trim already names it. */
function checkString(longText: unknown, shortText: unknown): string {
  const long = String(longText ?? '')
  const short = String(shortText ?? '')
  const escaped = short.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const found = new RegExp(`\\b(${escaped})\\b`, 'i').test(long)
  return `${long} ${found ? '' : short}`
}

/** PHP truthiness of an API value (`"0.00"` is true, `"0"` and `""` are not). */
const phpTruthy = (v: unknown) => !(v === null || v === undefined || v === false || v === '' || v === '0' || v === 0)
/** PHP `is_numeric()`. */
const isNumeric = (v: unknown) => String(v ?? '').trim() !== '' && Number.isFinite(Number(v))

const cards = computed(() =>
  (props.vehicles ?? []).map((item: any) => {
    let src = `/media/vehicle/${item.vehicle_logo ?? ''}`
    // Str::of(image_urls)->explode('|')->first()
    if (item.features) src = String(item.features.image_urls ?? '').split('|')[0] ?? ''
    else if (!item.vehicle_logo) src = NO_IMAGE

    const price = Number(item.internet_price)
    const miles = Number(item.mileage)
    return {
      id: item.id,
      src,
      pending: Number(item.vehicle_status) === 2,
      title: `${item.year ?? ''} ${item.make ?? ''} ${item.model ?? ''} ${checkString(item.trim, item.drivetrain)}`,
      price:
        phpTruthy(item.internet_price) && isNumeric(item.internet_price)
          ? `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : 'CALL FOR PRICE',
      miles:
        phpTruthy(item.mileage) && isNumeric(item.mileage)
          ? Math.round(miles).toLocaleString('en-US')
          : 'CALL FOR MILEAGE',
    }
  }),
)

function onImgError(e: Event) {
  const img = e.target as HTMLImageElement
  if (!img.src.endsWith(FALLBACK)) img.src = FALLBACK
}

// An image that failed before hydration never reaches @error.
const grid = ref<HTMLElement | null>(null)
onMounted(() => {
  grid.value?.querySelectorAll('img').forEach((img) => {
    if (img.complete && img.naturalWidth === 0 && !img.src.endsWith(FALLBACK)) img.src = FALLBACK
  })
})
</script>

<template>
  <div class="container my-10 flex flex-col gap-8">
    <span class="lg:text-4xl text-3xl font-semibold text-center order-first"> Our Used Car Inventory </span>

    <div ref="grid" class="grid grid-cols-12 gap-4 place-items-center">
      <NuxtLink
        v-for="item in cards"
        :key="item.id"
        :to="`/view/${item.id}`"
        class="home-car-container flex flex-col rounded-lg border-2 border-gray-300 shadow-lg xl:col-span-4 lg:col-span-4 md:col-span-6 sm:col-span-6 col-span-full sm:w-full w-85 h-full bg-base-200"
      >
        <div class="relative w-full h-full overflow-hidden border border-gray-200 aspect-[4/3] home-image-container">
          <div v-if="item.pending" class="absolute right-0 top-0 h-16 w-16">
            <div
              class="absolute transform rotate-45 company-primary-base-background text-center text-white font-semibold py-1 right-[-35px] top-[32px] w-[170px] z-10"
            >
              SALE PENDING
            </div>
          </div>
          <img :src="item.src" class="object-cover w-full h-full aspect-[4/3]" alt="car" @error="onImgError" />
        </div>

        <div class="flex-1 flex flex-col gap-2 justify-between p-2">
          <ul class="flex-1 flex flex-col gap-2 text-base font-semibold p-1">
            <li class="flex items-center">
              <Icon name="ion:car-sport" class="mr-3" />
              <span class="h-6 overflow-hidden text-ellipsis">{{ item.title }}</span>
            </li>
            <li v-if="showPrice">
              <Icon name="ion:pricetag" class="mr-3" />
              Price:
              <span class="h-6 overflow-hidden text-ellipsis">{{ item.price }}</span>
            </li>
            <li>
              <Icon name="ion:speedometer" class="mr-3" />
              Miles:
              <span class="h-6 overflow-hidden text-ellipsis">{{ item.miles }}</span>
            </li>
          </ul>
          <div
            class="w-full place-self-end px-5 py-3 rounded-lg font-semibold company-primary-base-background text-base-content self-center capitalize text-center hover:opacity-80 hover:-translate-y-1 ease-in-out delay-75 duration-300"
          >
            View Details
          </div>
        </div>
      </NuxtLink>
    </div>
    <div class="flex items-center justify-center lg:order-none order-first">
      <NuxtLink
        to="/pre-owned-cars"
        class="place-self-end px-5 py-3 rounded-lg font-semibold company-primary-base-background text-base-content self-center capitalize text-center hover:opacity-80 hover:-translate-y-0.5 ease-in-out delay-75 duration-300"
      >
        View All Inventory
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.home-car-container:hover {
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  border: 1px solid var(--company-primary-base);
}
.home-car-container:hover div ul li {
  color: var(--company-primary-base);
}
.home-image-container {
  border-top-left-radius: 7.5px;
  border-top-right-radius: 7.5px;
}
</style>
