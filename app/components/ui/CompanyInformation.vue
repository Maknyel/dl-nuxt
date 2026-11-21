<script setup lang="ts">
/**
 * <x-company-information :valuearray="..."> (custom-components/contact-us/company-information.blade.php): the
 * "Company Information" card on About Us and Contact Us. Phone, email and address rows, Get Directions, and the social
 * links under "Follow us". Styles: lp-cards.css.
 *
 * The social icons are Font Awesome 4's glyphs, as the Blade's <i class="fa fa-..."> (FaSocialIcon).
 */
const props = defineProps<{ valuearray: Record<string, any> }>()

const v = computed(() => props.valuearray ?? {})
const state = computed(() => capsOnly(v.value.state ?? ''))
const mapUrl = computed(
  () =>
    `https://www.google.com/maps/dir/?api=1&destination=${v.value.street_address ?? ''}, ${v.value.city ?? ''}, ${state.value} ${v.value.zip_code ?? ''}`,
)

/** `footer_setting.social_links` (an array, or a JSON string); the Blade shows the block unless it is ''. */
const socialLinks = computed<Record<string, any>[] | null>(() => {
  let links = v.value.footer_setting?.social_links
  if (links == null || links === '') return null
  if (typeof links === 'string') {
    try {
      links = JSON.parse(links)
    } catch {
      return []
    }
  }
  return Array.isArray(links) ? links : Object.values(links ?? {})
})

const socials = computed(() =>
  (socialLinks.value ?? [])
    .filter((s) => !!s?.link)
    .map((s) => {
      const label = String(s?.label ?? s?.code ?? '').toLowerCase()
      return { link: String(s.link), label }
    }),
)
</script>

<template>
  <div class="lp-card lp-company">
    <div class="lp-h">
      <span class="lp-ico"><Icon name="ion:business-outline" aria-hidden="true" /></span>Company Information
    </div>

    <ul class="lp-items">
      <li v-if="v.phone_number">
        <a :href="`tel:${v.phone_number}`" class="lp-item">
          <span class="lp-ico"><Icon name="ion:call-outline" aria-hidden="true" /></span>
          <span class="lp-item-txt"><small>Phone</small><strong>{{ formatPhone(v.phone_number) }}</strong></span>
          <Icon name="ion:chevron-forward-outline" aria-hidden="true" />
        </a>
      </li>

      <li v-if="v.email">
        <a :href="`mailto:${v.email}`" class="lp-item">
          <span class="lp-ico"><Icon name="ion:mail-outline" aria-hidden="true" /></span>
          <span class="lp-item-txt"><small>Email</small><strong>{{ v.email }}</strong></span>
          <Icon name="ion:chevron-forward-outline" aria-hidden="true" />
        </a>
      </li>

      <li v-if="v.street_address">
        <a target="_blank" :href="mapUrl" class="lp-item">
          <span class="lp-ico"><Icon name="ion:location-outline" aria-hidden="true" /></span>
          <span class="lp-item-txt"
            ><small>Address</small
            ><strong>{{ v.street_address }}<br />{{ v.city }}, {{ state }} {{ v.zip_code }}</strong></span
          >
          <Icon name="ion:chevron-forward-outline" aria-hidden="true" />
        </a>
      </li>
    </ul>

    <a v-if="v.street_address" target="_blank" :href="mapUrl" class="lp-btn lp-directions">
      <Icon name="ion:location-outline" aria-hidden="true" /> Get Directions
    </a>

    <!-- Social Links -->
    <div v-if="socialLinks" class="lp-follow">
      <span class="lp-follow-lbl">FOLLOW US</span>
      <ul class="lp-socials">
        <li v-for="(s, i) in socials" :key="i">
          <a target="_blank" :href="s.link" :aria-label="s.label">
            <UiFaSocialIcon :name="s.label" />
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>

<style src="./lp-cards.css"></style>
