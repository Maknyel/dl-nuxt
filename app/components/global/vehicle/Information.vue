<script setup lang="ts">
/**
 * The vehicle page's main row (Laravel global/cars/view-vehicle-information.blade.php):
 *  - the gallery: the main photo (opens the full-screen viewer), the Inspected / photo-count tags, the thumbnail strip
 *    with prev / next, slid by dragging (mouse) or swiping (touch);
 *  - the price panel: Our Price, Share, the location (a Multi dealer's other site), the highlights with VIN / stock copy,
 *    and the I'm Interested form (InquiryForm, variant 'panel');
 *  - the full-screen viewer (lightbox): Esc closes it, the arrow keys step, a click on the backdrop closes it.
 * Styled by vdp-page.css. The Laravel page's market card is `@if (false)` there: not ported.
 */
import CopyButton from './CopyButton.vue'
import InquiryForm from './InquiryForm.vue'
import SalesInquiryForm from './SalesInquiryForm.vue'

const props = withDefaults(defineProps<{ vehicle: Record<string, any>; isDemo?: boolean }>(), { isDemo: false })
const { company, site, templateNav, isSales } = useSite()

const FALLBACK_IMG = '/media/images/company/exv3.jpg'
const v = computed(() => props.vehicle)

const isNum = (x: unknown) => x !== null && x !== undefined && String(x).trim() !== '' && !Number.isNaN(Number(x))
const fmt0 = (x: unknown) => Math.round(Number(x)).toLocaleString('en-US')

const images = computed<string[]>(() => {
  const urls = v.value.features?.image_urls
  if (v.value.features != null && urls) return String(urls).split('|')
  if (v.value.vehicle_logo) return [`${String(site.value?.mediaBase ?? '/').replace(/\/?$/, '/')}media/vehicle/${v.value.vehicle_logo}`]
  return []
})
const firstImage = computed(() => images.value[0] ?? FALLBACK_IMG)
const total = computed(() => images.value.length)

const hasPrice = computed(() => isNum(v.value.internet_price) && Number(v.value.internet_price) > 0)
const dispPrice = computed(() => (hasPrice.value ? `$${fmt0(v.value.internet_price)}` : 'CALL FOR PRICE'))
const showPrice = computed(() => String(templateNav.value?.show_car_price ?? '1') === '1')
const monthly = computed(() => v.value.monthly_payment)
const badge = computed(() => v.value.special_tag ?? v.value.listing_label ?? null)

/** A Multi dealer's vehicle at another of its locations. */
const loc = computed(() => {
  const c = v.value.company
  if (company.value.account_type !== 'Multi' || String(company.value.id) === String(v.value.company_id ?? '') || !c?.name) return null
  const address = `${c.street_address ?? ''}, ${c.city ?? ''}, ${c.state ?? ''} ${c.zip_code ?? ''}`.replace(/^[\s,]+|[\s,]+$/g, '')
  const href = c.dl_website || `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
  return { name: c.name, address, href }
})

const viewerTitle = computed(() =>
  [v.value.year, v.value.make, v.value.model, v.value.trim, v.value.style, v.value.drivetrain]
    .map((s) => s ?? '')
    .join(' ')
    .trim(),
)

function onImgError(e: Event) {
  const img = e.target as HTMLImageElement
  if (!img.src.endsWith(FALLBACK_IMG)) img.src = FALLBACK_IMG
}

/* ── Gallery ── */
const current = ref(0)
const strip = ref<HTMLElement | null>(null)
const lbStrip = ref<HTMLElement | null>(null)
const dragging = ref(false)

/** Scrolls a strip (never the page) so the thumbnail at idx is in view. */
function reveal(container: HTMLElement | null, idx: number) {
  const thumb = container?.children[idx] as HTMLElement | undefined
  if (!container || !thumb) return
  const s = container.getBoundingClientRect()
  const t = thumb.getBoundingClientRect()
  if (t.left < s.left) container.scrollBy({ left: t.left - s.left, behavior: 'smooth' })
  else if (t.right > s.right) container.scrollBy({ left: t.right - s.right, behavior: 'smooth' })
}

function setImg(idx: number) {
  current.value = idx
  nextTick(() => reveal(strip.value, idx))
}
function nav(step: number) {
  setImg((current.value + step + total.value) % total.value)
}

// Dragging the strip with the mouse slides it; a drag past 5px isn't a click on the thumbnail under the pointer.
let down = false
let dragged = false
let startX = 0
let startLeft = 0
function onPointerDown(e: PointerEvent) {
  if (e.pointerType !== 'mouse' || e.button !== 0 || !strip.value) return
  down = true
  dragged = false
  startX = e.clientX
  startLeft = strip.value.scrollLeft
}
function onPointerMove(e: PointerEvent) {
  if (!down || !strip.value) return
  const dx = e.clientX - startX
  if (!dragged && Math.abs(dx) > 5) {
    dragged = true
    dragging.value = true
  }
  if (dragged) strip.value.scrollLeft = startLeft - dx
}
function onPointerUp() {
  if (!down) return
  down = false
  dragging.value = false
}
function onStripClickCapture(e: MouseEvent) {
  if (!dragged) return
  dragged = false
  e.stopPropagation()
  e.preventDefault()
}

/* ── Full-screen viewer ── */
const lbOpen = ref(false)
const lbIdx = ref(0)

function lbShow(idx: number) {
  lbIdx.value = idx
  nextTick(() => reveal(lbStrip.value, idx))
}
function openFull(idx: number) {
  current.value = idx
  lbOpen.value = true
  document.documentElement.style.overflow = 'hidden'
  lbShow(idx)
}
function navigateImage(step: number) {
  lbShow((lbIdx.value + step + total.value) % total.value)
}
/** Closing leaves the gallery on the photo last seen in the viewer. */
function closeFull() {
  lbOpen.value = false
  document.documentElement.style.overflow = ''
  if (lbIdx.value !== current.value) setImg(lbIdx.value)
}
function onKey(e: KeyboardEvent) {
  if (!lbOpen.value) return
  if (e.key === 'Escape') closeFull()
  else if (e.key === 'ArrowLeft') navigateImage(-1)
  else if (e.key === 'ArrowRight') navigateImage(1)
}

/* ── Share: the device's share sheet, else the page link copied. ── */
const shared = ref(false)
function share() {
  const url = location.href
  if (navigator.share) {
    navigator.share({ title: document.title, url }).catch(() => {})
    return
  }
  const done = () => {
    shared.value = true
    setTimeout(() => (shared.value = false), 1600)
  }
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(url).then(done, () => {})
  } else {
    const ta = document.createElement('textarea')
    ta.value = url
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    try {
      document.execCommand('copy')
      done()
    } catch {
      // Nothing to copy with.
    }
    ta.remove()
  }
}

onMounted(() => {
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  document.removeEventListener('keydown', onKey)
  if (lbOpen.value) document.documentElement.style.overflow = ''
})
</script>

<template>
  <div class="vdp-main-grid">
    <!-- Gallery -->
    <div class="vdp-gallery">
      <div id="vdp-main-wrap" class="vdp-main-img-wrap">
        <span v-if="badge" class="vdp-gallery-badge">{{ String(badge).toUpperCase() }}</span>

        <div v-if="Number(vehicle.vehicle_status) === 2" class="vdp-sale-pending"><span>SALE PENDING</span></div>

        <img
          id="vdp-active-img"
          class="vdp-main-img"
          :src="images[current] || firstImage"
          :alt="`${vehicle.year} ${vehicle.make} ${vehicle.model}`"
          @error="onImgError"
          @click="openFull(current)"
        />

        <div class="vdp-gallery-tags">
          <span class="vdp-gallery-tag"><Icon name="ion:shield-checkmark-outline" /> Inspected</span>
          <!-- prettier-ignore -->
          <span class="vdp-gallery-tag"><Icon name="ion:images-outline" /> <span id="vdp-counter" class="vdp-gallery-counter">{{ current + 1 }} / {{ total }}</span></span>
        </div>
      </div>

      <div v-if="total > 1" class="vdp-thumbs-card">
        <button type="button" class="vdp-thumbs-nav" aria-label="Previous photo" @click="nav(-1)">
          <Icon name="ion:chevron-back-outline" />
        </button>
        <div
          id="vdp-thumbs"
          ref="strip"
          class="vdp-thumbs"
          :class="{ 'is-dragging': dragging }"
          @pointerdown="onPointerDown"
          @click.capture="onStripClickCapture"
        >
          <div
            v-for="(url, i) in images"
            :id="`vdp-thumb-${i}`"
            :key="i"
            class="vdp-thumb"
            :class="{ active: i === current }"
            @click="setImg(i)"
          >
            <img :src="url" draggable="false" loading="lazy" :alt="`Photo ${i + 1}`" @error="onImgError" />
          </div>
        </div>
        <button type="button" class="vdp-thumbs-nav" aria-label="Next photo" @click="nav(1)">
          <Icon name="ion:chevron-forward-outline" />
        </button>
      </div>
    </div>

    <!-- Right column: price panel + contact form -->
    <div class="vdp-right-col">
      <div class="vdp-price-panel">
        <div class="vdp-price-hero">
          <div class="vdp-price-hero-main">
            <template v-if="showPrice">
              <span class="vdp-price-hero-lbl">OUR PRICE</span>
              <div class="vdp-price-main">{{ dispPrice }}</div>
            </template>
            <div v-if="monthly && isNum(monthly) && Number(monthly) > 0" class="vdp-price-monthly">
              ${{ fmt0(monthly) }}/mo
              <small>Est. Payment</small>
            </div>
            <span v-if="vehicle.special_price_label" class="vdp-price-hero-badge">
              <Icon name="ion:checkmark-circle" />
              {{ vehicle.special_price_label }}
            </span>
          </div>
          <button
            type="button"
            class="vdp-share-btn vdp-share-btn--icon"
            :class="{ 'is-copied': shared }"
            aria-label="Share this vehicle"
            @click="share"
          >
            <Icon name="ion:arrow-redo" /> <span>{{ shared ? 'Link copied' : 'Share' }}</span>
          </button>
        </div>

        <div v-if="loc" class="vdp-price-loc-wrap">
          <a :href="loc.href" target="_blank" class="vdp-vh-item vdp-price-location">
            <div class="vdp-vh-icon"><Icon name="ion:location-outline" /></div>
            <div>
              <div class="vdp-vh-val">{{ loc.name }}</div>
              <div v-if="loc.address !== ''" class="vdp-vh-lbl">{{ loc.address }}</div>
            </div>
          </a>
        </div>

        <div class="vdp-vh-grid">
          <div v-if="vehicle.mileage && Number(vehicle.mileage) !== 0" class="vdp-vh-item">
            <div class="vdp-vh-icon"><Icon name="ion:speedometer-outline" /></div>
            <div>
              <div class="vdp-vh-val">{{ fmt0(vehicle.mileage) }}</div>
              <div class="vdp-vh-lbl">Mileage</div>
            </div>
          </div>
          <div v-if="vehicle.drivetrain" class="vdp-vh-item">
            <div class="vdp-vh-icon"><Icon name="ion:git-network-outline" /></div>
            <div>
              <div class="vdp-vh-val">{{ vehicle.drivetrain }}</div>
              <div class="vdp-vh-lbl">Drivetrain</div>
            </div>
          </div>
          <div v-if="vehicle.exterior" class="vdp-vh-item">
            <div class="vdp-vh-icon"><Icon name="ion:color-palette-outline" /></div>
            <div>
              <div class="vdp-vh-val">{{ vehicle.exterior }}</div>
              <div class="vdp-vh-lbl">Ext. Color</div>
            </div>
          </div>
          <div v-if="vehicle.interior" class="vdp-vh-item">
            <div class="vdp-vh-icon"><Icon name="ion:brush-outline" /></div>
            <div>
              <div class="vdp-vh-val">{{ vehicle.interior }}</div>
              <div class="vdp-vh-lbl">Int. Color</div>
            </div>
          </div>
          <div v-if="vehicle.vin_number" class="vdp-vh-item">
            <div class="vdp-vh-icon"><Icon name="ion:barcode-outline" /></div>
            <div class="min-w-0">
              <div class="vdp-vh-val">
                <span>{{ vehicle.vin_number }}</span
                ><CopyButton class="vdp-copy vdp-copy--inline" :text="String(vehicle.vin_number)" label="Copy VIN" />
              </div>
              <div class="vdp-vh-lbl">VIN</div>
            </div>
          </div>
          <div v-if="vehicle.stock" class="vdp-vh-item">
            <div class="vdp-vh-icon"><Icon name="ion:pricetag-outline" /></div>
            <div class="min-w-0">
              <div class="vdp-vh-val">
                <span>{{ vehicle.stock }}</span
                ><CopyButton class="vdp-copy vdp-copy--inline" :text="String(vehicle.stock)" label="Copy stock number" />
              </div>
              <div class="vdp-vh-lbl">Stock #</div>
            </div>
          </div>
        </div>

        <!-- The sales site's form has Dealer Info instead of the trade-in. -->
        <SalesInquiryForm v-if="isSales" :vehicle="vehicle" variant="panel" :is-demo="isDemo" />
        <InquiryForm v-else :vehicle="vehicle" variant="panel" />
      </div>
    </div>
  </div>

  <!-- Full-screen viewer -->
  <div
    id="image-full-screen"
    class="vdp-lightbox"
    :class="{ hidden: !lbOpen }"
    role="dialog"
    aria-modal="true"
    :aria-label="`${viewerTitle} photos`"
  >
    <div class="vdp-lb-backdrop" @click="closeFull" />
    <div class="vdp-lb-dialog">
      <div class="vdp-lb-head">
        <div class="vdp-lb-title">
          <span class="vdp-lb-title-text">{{ viewerTitle }}</span>
          <span class="vdp-lb-count"><span id="current_image-step">{{ lbIdx + 1 }}</span> / {{ total }}</span>
        </div>
        <button type="button" class="vdp-lb-close" aria-label="Close photos" @click="closeFull">
          <Icon name="ion:close-outline" />
        </button>
      </div>

      <div class="vdp-lb-stage">
        <button v-if="total > 1" type="button" class="vdp-lb-nav vdp-lb-nav--prev" aria-label="Previous photo" @click="navigateImage(-1)">
          <Icon name="ion:chevron-back-outline" />
        </button>
        <div class="vdp-lb-frame">
          <img
            v-for="(url, key) in images"
            :id="`zoom-image-${key}`"
            :key="key"
            class="zoom-image fade-in"
            :style="{ display: key === lbIdx ? 'block' : 'none' }"
            :src="url"
            loading="lazy"
            :alt="`Photo ${key + 1}`"
            @error="onImgError"
          />
        </div>
        <button v-if="total > 1" type="button" class="vdp-lb-nav vdp-lb-nav--next" aria-label="Next photo" @click="navigateImage(1)">
          <Icon name="ion:chevron-forward-outline" />
        </button>
      </div>

      <div v-if="total > 1" id="vdp-lb-thumbs" ref="lbStrip" class="vdp-lb-thumbs">
        <button
          v-for="(url, key) in images"
          :id="`vdp-lb-thumb-${key}`"
          :key="key"
          type="button"
          class="vdp-lb-thumb"
          :class="{ active: key === lbIdx }"
          :aria-label="`Photo ${key + 1}`"
          @click="lbShow(key)"
        >
          <img :src="url" loading="lazy" draggable="false" alt="" @error="onImgError" />
        </button>
      </div>
    </div>
  </div>
</template>
