<script setup lang="ts">
/**
 * The vehicle cards (global/cars/vehicle-lists.blade.php): three a row on a desktop, each with its photo (and a
 * SALE PENDING / special badge), the price and miles, the title, the trim details and the colour chips (an info button
 * shows a clipped colour in full), and View vehicle (stretched over the whole card). A JSON-LD Vehicle per card. No
 * listings: the "no listings found" panel.
 *
 * The "I'm interested" inquiry modal is here (InquiryModal), opened with search.inquiryVehicle; the Laravel cards have
 * no button for it at present, as here.
 */
import type { InventoryResponse } from '~/composables/useInventorySearch'
import InquiryModal from './InquiryModal.vue'

const props = defineProps<{ data: InventoryResponse | null }>()
const search = useInventorySearch()
const { company, site } = useSite()
const requestUrl = useRequestURL()

const FALLBACK_IMG = '/media/images/company/exv3.jpg'

const BADGE_COLORS: Record<string, string> = {
  'manager special': '#16a34a',
  'price drop': '#16a34a',
  'fresh arrival': '#0891b2',
  'best value': '#2563eb',
  'one owner': '#2563eb',
  'low miles': 'rgb(126,34, 206)',
  'great mpg': '#16a34a',
  'clean carfax': '#16a34a',
  'sale pending': '#dc2626',
}

/** The dealer's show_car_price for its template (the template_nav row whose template_id is the dealer's template). */
const showPrice = computed(() => {
  const rows: any[] = Array.isArray(company.value.template_nav) ? company.value.template_nav : []
  const row = rows.find((m) => company.value.template == m?.template_id)
  return String(row?.show_car_price ?? '1') === '1'
})

const isNumeric = (v: unknown) => v !== null && v !== '' && v !== undefined && !Number.isNaN(Number(v))
const fmt0 = (v: unknown) => Math.round(Number(v)).toLocaleString('en-US')

/** A colour name's last word as a CSS colour ("Glacier Silver" → silver). */
const swatch = (name: unknown) =>
  (
    String(name ?? '')
      .trim()
      .split(/\s+/)
      .pop() ?? ''
  )
    .replace(/[^a-z]/gi, '')
    .toLowerCase()

const cards = computed(() =>
  (props.data?.vehicles ?? []).map((v) => {
    const badge = v.special_tag ?? v.listing_label ?? v.badge ?? null
    const hasPrice = isNumeric(v.internet_price) && Number(v.internet_price) > 0
    const sub = `${v.trim ?? ''} ${v.body_type ?? ''} ${v.drivetrain ?? ''}`.trim()
    const specs = (
      [
        ['Trim', v.trim],
        ['Body', v.body_type],
        ['Drivetrain', v.drivetrain],
      ] as [string, unknown][]
    ).filter(([, val]) => val !== null && val !== undefined && val !== '')
    const img = v.features
      ? String(v.features.image_urls ?? '').split('|')[0]
      : v.vehicle_logo
        ? `${String(site.value?.mediaBase ?? '/').replace(/\/?$/, '/')}media/vehicle/${v.vehicle_logo}`
        : FALLBACK_IMG
    return {
      v,
      badge: badge || null,
      badgeColor: badge ? (BADGE_COLORS[String(badge).toLowerCase()] ?? 'var(--company-primary-base,#1d4ed8)') : null,
      displayPrice: hasPrice ? '$' + fmt0(v.internet_price) : 'CALL FOR PRICE',
      monthly: isNumeric(v.monthly_payment) && Number(v.monthly_payment) > 0 ? '$' + fmt0(v.monthly_payment) : '',
      miles: v.mileage && isNumeric(v.mileage) ? fmt0(v.mileage) : '',
      sub,
      specs,
      img,
      url: `/view/${v.id}`,
    }
  }),
)

// JSON-LD Vehicle + Offer per card (the Blade's inline <script type="application/ld+json">).
useHead(() => ({
  script: cards.value.map(({ v }) => {
    const price = isNumeric(v.internet_price) && v.internet_price !== '' ? Number(v.internet_price) : null
    const miles = v.mileage && isNumeric(v.mileage) ? Number(v.mileage) : 0
    const offer: Record<string, unknown> = {
      '@type': 'Offer',
      url: `${requestUrl.origin}${requestUrl.pathname}`,
      availability: 'https://schema.org/InStock',
    }
    if (price !== null) Object.assign(offer, { price, priceCurrency: 'USD' })
    return {
      key: `vehicle-ld-${v.id}`,
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Vehicle',
        name: `${v.year} ${v.make} ${v.model}${v.trim ? ' ' + v.trim : ''}`,
        description: `Explore this ${v.year} ${v.make} ${v.model} with ${Math.round(miles).toLocaleString('en-US')} miles. VIN: ${v.vin_number}.`,
        vehicleModelDate: String(v.year ?? ''),
        manufacturer: { '@type': 'Organization', name: v.make },
        model: v.model,
        brand: { '@type': 'Brand', name: v.make },
        vehicleIdentificationNumber: v.vin_number,
        mileageFromOdometer: { '@type': 'QuantitativeValue', value: Math.trunc(miles), unitCode: 'MI' },
        offers: offer,
        image: v.features?.image_urls ? String(v.features.image_urls).split('|') : [],
      }),
    }
  }),
}))

function onImgError(e: Event) {
  const img = e.target as HTMLImageElement
  if (!img.src.endsWith(FALLBACK_IMG)) img.src = FALLBACK_IMG
}

// ── The colour chips' info buttons and their shared tooltip ─────────────────────────────────────────
const grid = ref<HTMLElement | null>(null)
const tooltip = reactive({ open: false, text: '', left: 0, top: 0, btn: null as HTMLElement | null })
const tipEl = ref<HTMLElement | null>(null)
const hoverable = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches

async function openTooltip(btn: HTMLElement) {
  tooltip.text = btn.getAttribute('data-color') || ''
  tooltip.open = true
  tooltip.btn = btn
  await nextTick()
  const margin = 8
  const b = btn.getBoundingClientRect()
  const t = tipEl.value?.getBoundingClientRect() ?? { width: 0, height: 0 }
  let left = b.left + b.width / 2 - t.width / 2
  left = Math.max(margin, Math.min(left, window.innerWidth - t.width - margin))
  let top = b.top - t.height - margin
  if (top < margin) top = b.bottom + margin
  tooltip.left = left
  tooltip.top = top
}
function closeTooltip() {
  tooltip.open = false
  tooltip.btn = null
}
function toggleTooltip(e: MouseEvent) {
  const btn = e.currentTarget as HTMLElement
  if (tooltip.btn === btn && tooltip.open) closeTooltip()
  else openTooltip(btn)
}

// Show an info button only where its colour is actually cut off (carSetupColorTruncationWatcher).
let observer: ResizeObserver | null = null
function watchTruncation() {
  observer?.disconnect()
  if (!grid.value) return
  const els = grid.value.querySelectorAll<HTMLElement>('.ar-stat .truncate')
  if (typeof ResizeObserver === 'undefined') {
    els.forEach((el) => el.nextElementSibling?.classList.add('is-visible'))
    return
  }
  observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const el = entry.target as HTMLElement
      const btn = el.nextElementSibling
      if (btn?.classList.contains('car-color-info-btn')) btn.classList.toggle('is-visible', el.scrollWidth > el.clientWidth + 1)
    }
  })
  els.forEach((el) => observer!.observe(el))
  // The first check can run before the web font is in (the Laravel page stays hidden until it's styled): measure again
  // once it is, with the buttons hidden, as a button shown too early narrows the text it measures.
  document.fonts?.ready.then(() => {
    const btns = [...els].map((el) => el.nextElementSibling).filter((b) => b?.classList.contains('car-color-info-btn'))
    btns.forEach((b) => b!.classList.remove('is-visible'))
    const cut = [...els].map((el) => el.scrollWidth > el.clientWidth + 1)
    els.forEach((el, i) => {
      const btn = el.nextElementSibling
      if (btn?.classList.contains('car-color-info-btn')) btn.classList.toggle('is-visible', cut[i]!)
    })
  })
}

function onDocClick(e: MouseEvent) {
  if (!(e.target as HTMLElement).closest?.('.car-color-info-btn')) closeTooltip()
}
onMounted(() => {
  watchTruncation()
  document.addEventListener('click', onDocClick)
  window.addEventListener('scroll', closeTooltip, true)
  window.addEventListener('resize', closeTooltip)
  // A photo that failed before the page was interactive gets the placeholder too.
  grid.value?.querySelectorAll<HTMLImageElement>('img.car-card-img').forEach((img) => {
    if (img.complete && img.naturalWidth === 0 && !img.src.endsWith(FALLBACK_IMG)) img.src = FALLBACK_IMG
  })
})
watch(cards, () => nextTick(watchTruncation))
onBeforeUnmount(() => {
  observer?.disconnect()
  document.removeEventListener('click', onDocClick)
  window.removeEventListener('scroll', closeTooltip, true)
  window.removeEventListener('resize', closeTooltip)
})
</script>

<template>
  <div id="car-listing" class="car-position-listing">
    <div v-if="!cards.length" class="flex flex-col min-h-[200px] justify-center items-center">
      <div class="flex py-10 flex-col gap-[16px]">
        <div class="text-center w-full">
          <img src="/media/images/company/NoListings.png" class="w-auto h-auto m-auto" />
        </div>
        <label class="text-black font-semibold text-xl text-center"> NO LISTINGS FOUND FOR THE SPECIFIED SEARCH </label>
        <div class="text-center">
          <NuxtLink
            to="/pre-owned-cars"
            class="place-self-end px-5 py-3 rounded-lg font-semibold company-primary-base-background text-base-content self-center capitalize text-center hover:opacity-80 hover:-translate-y-0.5 ease-in-out delay-75 duration-300"
          >
            View Inventory
          </NuxtLink>
        </div>
      </div>
    </div>

    <div v-else id="car-grid" ref="grid" class="tile-view">
      <div v-for="c in cards" :key="c.v.id" class="car-card" :data-id="c.v.id">
        <!-- The title first, above the photo (ADR-0182, QA: "so the user can see that title immediately"): the year,
             make and model, then the trim, body and drive, on one line (the whole name as its tooltip). -->
        <NuxtLink
          :to="c.url"
          class="car-card-title"
          :title="`${c.v.year} ${c.v.make} ${c.v.model} ${c.sub}`.trim()"
        >
          <!-- The space between the two (Vue drops the whitespace-only line break the Blade keeps). -->
          <span class="car-card-title-main">{{ c.v.year }} {{ c.v.make }} {{ c.v.model }}</span>{{ ' ' }}<span
            v-if="c.sub !== ''"
            class="car-card-title-sub"
            >{{ c.sub }}</span
          >
        </NuxtLink>

        <div class="car-card-img-wrap">
          <span v-if="c.badge" class="car-badge" :style="{ background: c.badgeColor! }">{{ String(c.badge).toUpperCase() }}</span>
          <span v-if="c.v.vehicle_status == 2" class="car-badge" style="background: #dc2626">SALE PENDING</span>
          <NuxtLink :to="c.url">
            <img
              :src="c.img"
              :alt="`${c.v.year} ${c.v.make} ${c.v.model}`"
              class="car-card-img"
              loading="lazy"
              @error="onImgError"
            />
          </NuxtLink>
        </div>

        <div class="car-card-body">
          <div class="car-card-head">
            <div v-if="showPrice" class="car-card-price-block">
              <div class="car-card-price-lbl">Vehicle price</div>
              <div class="car-card-price">{{ c.displayPrice }}</div>
              <span v-if="c.monthly" class="car-card-monthly">{{ c.monthly }}/mo</span>
            </div>

            <div v-if="c.miles" class="car-card-miles-block">
              <div class="car-card-price-lbl car-card-miles-lbl">Vehicle miles</div>
              <div class="car-card-miles">
                <Icon name="ion:speedometer-outline" />
                <span>{{ c.miles }}</span>
              </div>
            </div>
          </div>

          <!-- The title is at the card's top, above the photo (ADR-0182). -->

          <div v-if="c.specs.length" class="car-card-specs">
            <div class="car-card-price-lbl">Trim details</div>
            <div class="car-card-specs-grid">
              <div v-for="[lbl, val] in c.specs" :key="lbl">
                <span>{{ lbl }}</span>
                <strong>{{ val }}</strong>
              </div>
            </div>
          </div>

          <div class="car-card-stats">
            <div class="grid grid-cols-2 gap-2 col-span-2">
              <span v-if="c.v.exterior" class="ar-stat car-color-chip min-w-0" :class="{ 'col-span-2': !c.v.interior }">
                <span class="car-swatch" :style="`background: #c9c9cf; background: ${swatch(c.v.exterior)};`" />
                <span class="truncate"><span class="car-chip-lbl">Ext</span> <span class="font-normal">{{ c.v.exterior }}</span></span>
                <button
                  type="button"
                  class="car-color-info-btn"
                  :data-color="c.v.exterior"
                  aria-label="Show full exterior color"
                  @click.stop="toggleTooltip"
                  @mouseenter="hoverable() && openTooltip($event.currentTarget as HTMLElement)"
                  @mouseleave="hoverable() && closeTooltip()"
                >
                  <Icon name="ion:information-circle-outline" />
                </button>
              </span>
              <span
                v-if="c.v.interior"
                class="ar-stat car-color-chip font-normal min-w-0"
                :class="{ 'col-span-2': !c.v.exterior }"
              >
                <span class="car-swatch" :style="`background: #c9c9cf; background: ${swatch(c.v.interior)};`" />
                <span class="truncate"><span class="car-chip-lbl">Int</span> <span class="font-normal">{{ c.v.interior }}</span></span>
                <button
                  type="button"
                  class="car-color-info-btn"
                  :data-color="c.v.interior"
                  aria-label="Show full interior color"
                  @click.stop="toggleTooltip"
                  @mouseenter="hoverable() && openTooltip($event.currentTarget as HTMLElement)"
                  @mouseleave="hoverable() && closeTooltip()"
                >
                  <Icon name="ion:information-circle-outline" />
                </button>
              </span>
            </div>
          </div>

          <div class="car-card-footer">
            <NuxtLink
              :to="c.url"
              class="lf4-submit-btn car-view-btn flex justify-center items-center gap-2 px-5 py-2 rounded-sm text-white text-sm font-semibold whitespace-nowrap"
            >
              <span>View vehicle</span>
            </NuxtLink>
          </div>
        </div>

        <!-- Hidden: for the training bot. -->
        <div class="hidden">
          Vehicle URL: {{ requestUrl.origin }}{{ c.url }} Price: {{ c.displayPrice }} Mileage:
          {{ c.v.mileage ? fmt0(c.v.mileage) + ' mi.' : 'CALL FOR MILEAGE' }} Carfax Link:
          http://www.carfax.com/VehicleHistory/p/Report.cfx?vin={{ c.v.vin_number }}
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        id="car-color-tooltip"
        ref="tipEl"
        :class="{ 'is-open': tooltip.open }"
        :style="{ left: tooltip.left + 'px', top: tooltip.top + 'px' }"
      >
        {{ tooltip.text }}
      </div>
    </Teleport>

    <InquiryModal v-if="search.inquiryVehicle.value" :vehicle="search.inquiryVehicle.value" @close="search.inquiryVehicle.value = null" />
  </div>
</template>
