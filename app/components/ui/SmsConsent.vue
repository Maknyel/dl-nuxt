<script setup lang="ts">
/**
 * <x-sms-consent> (resources/views/components/sms-consent.blade.php): the SMS consent checkbox of the lead forms.
 * `v-model` is the box's checked state (the Blade's `x-model="smsConsent"`); a form keeps its submit button disabled
 * until it is checked and sends it as `sms_consent` (1 / 0). Other attributes land on the checkbox, as in the Blade.
 *
 * Props: `company` (the name in the consent text, Dealer Lion by default), `size` (the text size, 11px by default).
 */
defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{ company?: string; size?: string }>(), { company: 'Dealer Lion', size: '11px' })

const checked = defineModel<boolean>({ default: false })
</script>

<template>
  <label
    class="sms-consent w-full flex items-start gap-2 text-left cursor-pointer text-black"
    :style="{ fontSize: size, lineHeight: 1.4 }"
  >
    <input v-model="checked" type="checkbox" class="mt-0.5 shrink-0" v-bind="$attrs" />
    <span>
      I consent to receive SMS messages from {{ company }} at the number above. Msg &amp; data rates may apply.
      Reply STOP to opt-out. See our
      <NuxtLink to="/privacy_policy" target="_blank" class="underline">Privacy Policy</NuxtLink>
      and
      SMS Terms.
    </span>
  </label>
</template>

<style scoped>
/* Forms like Sell Us Your Car style every `input` (padding, font-size, width): keep the box a plain checkbox. Size must
   be explicit: Tailwind forms draws checkboxes with appearance:none, so `auto` collapses them to 0. */
.sms-consent input[type='checkbox'] {
  padding: 0 !important;
  width: 1rem !important;
  height: 1rem !important;
  min-width: 1rem;
  font-size: inherit !important;
  border: 1px solid #6b7280;
  cursor: pointer;
}

/* Ticked and focused: no grey border, as on :8002 (the forms plugin's checked state). */
.sms-consent input[type='checkbox']:checked:focus {
  border-color: transparent;
}
</style>
