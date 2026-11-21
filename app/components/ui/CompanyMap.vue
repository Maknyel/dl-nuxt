<script setup lang="ts">
/**
 * <x-company-map :valuearray="..."> (custom-components/contact-us/company-map.blade.php): the "Visit Our Showroom" card
 * on Contact Us. The address beside phone / today's sales hours / email, the embedded map, then Get Directions and
 * Call Now. Styles: lp-cards.css.
 */
const props = defineProps<{ valuearray: Record<string, any> }>()

const v = computed(() => props.valuearray ?? {})
const state = computed(() => capsOnly(v.value.state ?? ''))
const mapAddress = computed(() => `${v.value.street_address ?? ''}, ${v.value.city ?? ''}, ${state.value} ${v.value.zip_code ?? ''}`)
// PHP urlencode(): spaces as '+'.
const googleUrl = computed(
  () => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapAddress.value).replace(/%20/g, '+')}`,
)
const embedUrl = computed(() => `https://maps.google.it/maps?q=${mapAddress.value}&output=embed`)

/**
 * The Laravel `date('l')` (its app timezone is UTC): today's weekday, taken once on the server so the browser renders
 * the same card.
 */
const today = useState('company-map-today', () =>
  new Date().toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }),
)
const todayHours = computed(() => {
  const list = v.value.times?.sales_schedule
  if (!Array.isArray(list) || !list.length) return ''
  const slot = list.find((s: any) => String(s?.date_of_the_week ?? '').toLowerCase() === today.value.toLowerCase())
  return slot && slot.is_visible ? `${slot.time_in ?? ''} – ${slot.time_out ?? ''}` : ''
})
</script>

<template>
  <div class="lp-card lp-map">
    <div class="lp-h">
      <span class="lp-ico"><Icon name="ion:location-outline" aria-hidden="true" /></span>Visit Our Showroom
    </div>

    <div class="lp-map-info">
      <div class="lp-map-addr">
        <strong>{{ v.street_address }}</strong>
        <strong>{{ v.city }}, {{ state }} {{ v.zip_code }}</strong>
        <span>USA</span>
      </div>

      <div class="lp-map-quick">
        <a v-if="v.phone_number" :href="`tel:${v.phone_number}`"
          ><Icon name="ion:call-outline" aria-hidden="true" />{{ formatPhone(v.phone_number) }}</a
        >
        <span v-if="todayHours"
          ><Icon name="ion:time-outline" aria-hidden="true" /><b class="lp-open">Open Today</b>{{ todayHours }}</span
        >
        <a v-if="v.email" :href="`mailto:${v.email}`"><Icon name="ion:mail-outline" aria-hidden="true" />{{ v.email }}</a>
      </div>
    </div>

    <!-- Embedded map -->
    <div class="lp-map-frame">
      <iframe
        :src="embedUrl"
        style="border: 0; display: block"
        frameborder="0"
        scrolling="no"
        marginheight="0"
        marginwidth="0"
        :title="`Map to ${mapAddress}`"
      />
    </div>

    <!-- CTA buttons -->
    <div class="lp-map-ctas">
      <a :href="googleUrl" target="_blank" class="lp-btn">
        Get Directions <Icon name="ion:arrow-forward-outline" aria-hidden="true" />
      </a>
      <a v-if="v.phone_number" :href="`tel:${v.phone_number}`" class="lp-btn lp-btn--ghost">
        <Icon name="ion:call-outline" aria-hidden="true" /> Call Now
      </a>
    </div>
  </div>
</template>

<style src="./lp-cards.css"></style>
