<script setup lang="ts">
/**
 * The vehicle page's title band (Laravel global/cars/view-vehicle-header.blade.php): Back to Inventory, the title with
 * its body style and drive, Call Us and I'm Interested. (The miles pill is gone: the mileage is in the highlights under
 * the price, ADR-0180.) Below 1024px: a second row with the price and I'm Interested, and once the page is scrolled a
 * compact band (Back, the title, price | miles, Call and I'm Interested as icons). Styled by vdp-page.css.
 */
const props = defineProps<{ vehicle: Record<string, any> }>()
const emit = defineEmits<{ interested: [] }>()
const { company, templateNav } = useSite()

const v = computed(() => props.vehicle)
const title = computed(() =>
  `${v.value.year ?? ''} ${v.value.make ?? ''} ${v.value.model ?? ''} ${v.value.trim ?? ''}`.trim(),
)
const sub = computed(() => `${v.value.style ?? ''} ${v.value.drivetrain ?? ''}`.trim())
const hasMiles = computed(() => !!v.value.mileage && isNumeric(v.value.mileage))
const miles = computed(() => Math.round(Number(v.value.mileage)).toLocaleString('en-US'))

// The phone bar's price (ADR-0180): the dealer's "show car price" flag, then the price or CALL FOR PRICE.
const showPrice = computed(() => String(templateNav.value?.show_car_price ?? '1') === '1')
const hasPrice = computed(() => isNumeric(v.value.internet_price) && Number(v.value.internet_price) > 0)
const price = computed(() => `$${Math.round(Number(v.value.internet_price)).toLocaleString('en-US')}`)

function isNumeric(x: unknown): boolean {
  return x !== null && x !== '' && !Number.isNaN(Number(x))
}

// The compact band (ADR-0180): on after 220px of scrolling, off again above 60px (the gap stops it flickering when
// the band's height change moves the page). Only takes effect below 1024px (vdp-page.css). Stuck under the nav (any
// width): .is-stuck, square top corners, so it joins the header.
const band = ref<HTMLElement | null>(null)
const compact = ref(false)
const stuck = ref(false)
let ticking = false
function update() {
  ticking = false
  const el = band.value
  if (!el) return
  const y = window.scrollY || document.documentElement.scrollTop
  if (!compact.value && y > 220) compact.value = true
  else if (compact.value && y < 60) compact.value = false
  const stickTop = parseFloat(getComputedStyle(el).top) || 0
  stuck.value = y > 0 && el.getBoundingClientRect().top <= stickTop + 0.5
}
function onScroll() {
  if (!ticking) {
    ticking = true
    requestAnimationFrame(update)
  }
}
onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  update()
})
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <div ref="band" class="vdp-band" :class="{ 'is-compact': compact, 'is-stuck': stuck }">
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

    <!-- Below 1024px: a second row in the band, the price on the left and I'm Interested on the right (the first row's
         I'm Interested is hidden there). It sticks with the band. Hidden on wider screens. -->
    <div class="vdp-mobile-bar">
      <div v-if="showPrice" class="vdp-mobile-bar-price">
        <span>Our Price</span>
        <strong>{{ hasPrice ? price : 'CALL FOR PRICE' }}</strong>
      </div>
      <a href="#" class="vdp-mobile-bar-btn" @click.prevent="emit('interested')">
        <Icon name="ion:create-outline" />
        <span>I'm Interested</span>
      </a>
    </div>

    <!-- Below 1024px, once the page is scrolled: the band shrinks to its Back button, the title, and price | miles under
         it (QA). -->
    <div class="vdp-band-compact">
      <NuxtLink to="/pre-owned-cars" class="vdp-band-back" aria-label="Back to Inventory">
        <Icon name="ion:arrow-back-outline" />
      </NuxtLink>
      <div class="vdp-band-compact-text">
        <div class="vdp-band-title vdp-band-compact-title">{{ title }}</div>
        <div class="vdp-band-compact-meta">
          <span v-if="showPrice">{{ hasPrice ? price : 'Call for price' }}</span>
          <span v-if="showPrice && hasMiles" class="vdp-band-compact-sep">|</span>
          <span v-if="hasMiles">{{ miles }} mi</span>
        </div>
      </div>
      <!-- Right: Call and I'm Interested, as icons (the band's own button styles). -->
      <div class="vdp-band-compact-actions">
        <a :href="`tel:${company.phone_number ?? ''}`" class="vdp-band-btn vdp-band-btn--white" aria-label="Call Us">
          <Icon name="ion:call-outline" />
        </a>
        <a
          href="#"
          class="vdp-band-btn vdp-band-btn--primary vdp-band-compact-interested"
          aria-label="I'm Interested"
          @click.prevent="emit('interested')"
        >
          <Icon name="ion:create-outline" />
        </a>
      </div>
    </div>
  </div>
</template>
