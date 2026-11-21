<script setup lang="ts">
/**
 * The vehicle page's sections under the payment row (the inline sections of Laravel
 * __fixed-templates/{t}/show.blade.php): Vehicle Details (three groups of specs), Features & Equipment (with View More
 * Features), About This Vehicle (the description cut to two lines with Read more, three highlights, condition badges),
 * Ready to drive it?, and the trust strip. Styled by vdp-page.css.
 *
 * Left out as on the Laravel page: What Our Customers Say is `hidden` there (kept hidden here: the About card's layout
 * keys off it), and Similar Vehicles is `@if (false)`.
 */
import CopyButton from './CopyButton.vue'

const props = defineProps<{ vehicle: Record<string, any> }>()
const emit = defineEmits<{ interested: [] }>()
const { company, templateNav } = useSite()

const v = computed(() => props.vehicle)
const isNum = (x: unknown) => x !== null && x !== undefined && String(x).trim() !== '' && !Number.isNaN(Number(x))
const fmt0 = (x: unknown) => Math.round(Number(x)).toLocaleString('en-US')
/** PHP's empty(): null, '', '0', 0 and false are empty. */
const filled = (x: unknown) => !(x === null || x === undefined || x === '' || x === '0' || x === 0 || x === false)

interface Group {
  title: string
  icon: string
  rows: [string, string][]
}
const groups = computed<Group[]>(() => {
  const f = v.value
  const rows = (pairs: [string, unknown][]) => pairs.filter(([, val]) => filled(val)).map(([k, val]) => [k, String(val)] as [string, string])
  return [
    {
      title: 'Overview',
      icon: 'ion:car-outline',
      rows: rows([
        ['Body Style', f.style],
        ['Year', f.year],
        ['Make', f.make],
        ['Model', f.model],
        ['Trim', f.trim],
        ['Mileage', filled(f.mileage) && isNum(f.mileage) ? `${fmt0(f.mileage)} mi` : null],
      ]),
    },
    {
      title: 'Powertrain',
      icon: 'ion:cog-outline',
      rows: rows([
        ['Engine', f.engine],
        ['Transmission', f.transmission],
        ['Drive Type', f.drivetrain],
      ]),
    },
    {
      title: 'Appearance & ID',
      icon: 'ion:color-palette-outline',
      rows: rows([
        ['Exterior Color', f.exterior],
        ['Interior Color', f.interior],
        ['VIN', f.vin_number],
        ['Stock #', f.stock],
      ]),
    },
  ].filter((g) => g.rows.length > 0)
})

/** A colour chip's swatch: the colour name's last word ("Glacier Silver" → silver); an unknown name keeps the grey. */
function swatchStyle(name: string): string {
  const words = name.replace(/\(.*?\)/g, '').trim().split(/\s+/)
  const last = (words[words.length - 1] ?? '').replace(/[^a-z]/gi, '').toLowerCase()
  return `background: #c9c9cf; background: ${last};`
}

const features = computed(() =>
  String(v.value.features?.features ?? '')
    .split('|')
    .filter((s) => s !== ''),
)
const showMoreFeatures = ref(false)

const title = computed(() => `${v.value.year ?? ''} ${v.value.make ?? ''} ${v.value.model ?? ''} ${v.value.trim ?? ''}`.trim())
const description = computed(() => v.value.features?.description || '')
const descOpen = ref(false)

const tiles = computed(() => {
  const f = v.value
  const showPrice = String(templateNav.value?.show_car_price ?? '1') === '1'
  const out: { icon: string; title: string; text: string }[] = []
  if (filled(f.mileage) && isNum(f.mileage)) {
    out.push({ icon: 'ion:speedometer-outline', title: `Only ${fmt0(f.mileage)} miles`, text: 'In excellent condition and ready to hit the road.' })
  }
  if (isNum(f.internet_price) && Number(f.internet_price) > 0 && showPrice) {
    out.push({ icon: 'ion:pricetag-outline', title: `Priced at $${fmt0(f.internet_price)}`, text: 'A great deal on a quality pre-owned vehicle.' })
  }
  out.push({ icon: 'ion:star-outline', title: 'Comfort, features & value', text: 'Built for commuting, road trips, or cruising around town.' })
  return out
})

/** Schedule Test Drive: to the inquiry form beside the gallery, its first field focused; else the pop-up. */
function goToForm() {
  const panel = document.querySelector<HTMLElement>('.vdp-right-col')
  const field = panel?.querySelector<HTMLInputElement>('input[type="text"], input:not([type="hidden"])')
  if (!panel) {
    emit('interested')
    return
  }
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' })
  if (field) setTimeout(() => field.focus({ preventScroll: true }), 450)
}
</script>

<template>
  <!-- Vehicle Details -->
  <div class="vdp-hl-details-card">
    <div class="vdp-details-panel">
      <h2 class="vdp-section-title">Vehicle Details</h2>
      <div class="vdp-details-groups">
        <div v-for="group in groups" :key="group.title" class="vdp-details-group">
          <div class="vdp-details-group-hd">
            <span class="vdp-tile-sm"><Icon :name="group.icon" /></span>
            {{ group.title }}
            <span class="vdp-details-count">{{ group.rows.length }} {{ group.rows.length === 1 ? 'spec' : 'specs' }}</span>
          </div>
          <div class="vdp-details-tiles">
            <div
              v-for="[label, value] in group.rows"
              :key="label"
              class="vdp-details-row"
              :class="{ 'vdp-details-row--id': label === 'VIN' || label === 'Stock #' }"
            >
              <span class="vdp-details-label">{{ label }}</span>
              <span class="vdp-details-val">
                <span
                  v-if="label === 'Exterior Color' || label === 'Interior Color'"
                  class="vdp-details-swatch"
                  :style="swatchStyle(value)"
                />
                <span class="vdp-details-text">{{ value }}</span>
                <CopyButton
                  v-if="label === 'VIN' || label === 'Stock #'"
                  class="vdp-copy vdp-copy--inline"
                  :text="value"
                  :label="`Copy ${label}`"
                />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Features & Equipment -->
  <div v-if="features.length" class="vdp-features-section">
    <h2 class="vdp-features-title">Features &amp; Equipment</h2>
    <div id="vdp-features-main" class="vdp-features-grid">
      <div v-for="(feat, i) in features.slice(0, 16)" :key="i" class="vdp-feature-item">
        <Icon name="ion:checkmark-circle-outline" />
        {{ feat.trim() }}
      </div>
    </div>
    <template v-if="features.length > 16">
      <a class="vdp-show-more-link" style="margin-top: 1rem" @click="showMoreFeatures = !showMoreFeatures">
        View More Features <Icon :name="showMoreFeatures ? 'ion:chevron-up-outline' : 'ion:chevron-down-outline'" />
      </a>
      <div id="vdp-features-extra" class="vdp-features-grid" :class="{ hidden: !showMoreFeatures }" style="margin-top: 0.75rem">
        <div v-for="(feat, i) in features.slice(16)" :key="i" class="vdp-feature-item">
          <Icon name="ion:checkmark-circle-outline" />
          {{ feat.trim() }}
        </div>
      </div>
    </template>
  </div>

  <!-- About This Vehicle + Ready to drive it? (+ the hidden reviews panel) -->
  <div class="vdp-about-row">
    <h2 class="vdp-section-title vdp-about-heading">About This Vehicle</h2>
    <div class="vdp-about-panel">
      <div class="vdp-about-name">
        {{ title }}
        <span v-if="Number(vehicle.vehicle_status) !== 2" class="vdp-about-badge">Now Available</span>
      </div>
      <template v-if="description">
        <!-- The dealer's own description (HTML from the CRM), as the Blade's {!! !!}. -->
        <div id="vdp-about-desc" class="vdp-about-desc" :class="{ 'is-open': descOpen }" v-html="description" />
        <button type="button" class="vdp-about-more" @click="descOpen = !descOpen">{{ descOpen ? 'Show less' : 'Read more' }}</button>
      </template>
      <p v-else style="font-size: 0.875rem; color: #000000">
        {{ vehicle.year }} {{ vehicle.make }} {{ vehicle.model }}
        {{ vehicle.trim }}.
        <template v-if="filled(vehicle.mileage)">{{ fmt0(vehicle.mileage) }} miles. </template>
        <template v-if="vehicle.drivetrain">{{ vehicle.drivetrain }}. </template>
        VIN: {{ vehicle.vin_number }}.
      </p>

      <div class="vdp-about-tiles">
        <div v-for="t in tiles" :key="t.title" class="vdp-about-tile">
          <span class="vdp-tile-sm"><Icon :name="t.icon" /></span>
          <div>
            <strong>{{ t.title }}</strong>
            <small>{{ t.text }}</small>
          </div>
        </div>
      </div>

      <div class="vdp-badges">
        <span v-if="filled(vehicle.non_smoker)" class="vdp-badge"><Icon name="ion:ban-outline" /> Non-Smoker</span>
        <span v-if="filled(vehicle.well_maintained)" class="vdp-badge"><Icon name="ion:checkmark-done-outline" /> Well Maintained</span>
      </div>
    </div>

    <div class="vdp-drive-cta">
      <div class="vdp-drive-cta-title">Ready to drive it?</div>
      <p class="vdp-drive-cta-text">Schedule a test drive or ask our team a question.</p>
      <a href="#vdp-inline-form" class="vdp-drive-cta-btn vdp-drive-cta-btn--white" @click.prevent="goToForm">
        <Icon name="ion:calendar-outline" /> Schedule Test Drive
      </a>
      <a v-if="company.phone_number" :href="`tel:${company.phone_number}`" class="vdp-drive-cta-btn vdp-drive-cta-btn--ghost">
        <Icon name="ion:call-outline" /> Call {{ formatPhone(company.phone_number) }}
      </a>
    </div>

    <div class="vdp-reviews-panel hidden">
      <div class="vdp-reviews-header">
        <h2 class="vdp-section-title" style="margin-bottom: 0; border: none; padding: 0">What Our Customers Say</h2>
        <a href="#" class="vdp-reviews-link">View All Reviews <Icon name="ion:arrow-forward-outline" /></a>
      </div>
      <div class="vdp-rating-row">
        <span class="vdp-rating-num">4.8</span>
        <div>
          <div class="vdp-stars"><Icon v-for="s in 5" :key="s" name="ion:star" /></div>
          <div class="vdp-rating-count">Based on customer reviews</div>
        </div>
      </div>
      <p style="font-size: 0.8rem; color: #9ca3af; margin: 0">Connect a reviews integration to display customer reviews here.</p>
    </div>
  </div>

  <!-- Trust strip -->
  <div class="vdp-footer-cta flex md:flex-row flex-col gap-2 justify-around">
    <div class="vdp-cta-item">
      <div class="vdp-cta-icon"><Icon name="ion:pricetag-outline" /></div>
      <div class="vdp-cta-text">
        <strong>Transparent Pricing</strong>
        <small>No hidden fees</small>
      </div>
    </div>
    <div class="vdp-cta-item">
      <div class="vdp-cta-icon"><Icon name="ion:shield-checkmark-outline" /></div>
      <div class="vdp-cta-text">
        <strong>Quality Inspected</strong>
        <small>Every vehicle inspected</small>
      </div>
    </div>
    <div class="vdp-cta-item">
      <div class="vdp-cta-icon"><Icon name="ion:location-outline" /></div>
      <div class="vdp-cta-text">
        <strong>Local &amp; Trusted</strong>
        <small>Serving our community</small>
      </div>
    </div>
  </div>
</template>
