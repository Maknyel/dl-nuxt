<script setup lang="ts">
/**
 * components/page-pill.blade.php (x-page-pill): the page pill on About Us, Contact Us, Book Service, Finance and Sell
 * ("ABOUT US", "REAL PEOPLE. REAL HELP."). A rounded tint of the company's primary colour, its icon in the text's
 * colour; smaller on phones. Usage: <UiPagePill icon="people-outline">ABOUT US</UiPagePill>.
 */
defineProps<{ icon: string }>()
</script>

<template>
  <span class="page-pill"><Icon :name="`ion:${icon}`" aria-hidden="true" /> <slot /></span>
</template>

<style>
.page-pill {
  --pill-p: var(--company-primary-base, #6d28d9);
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.9rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: color-mix(in srgb, var(--pill-p) 80%, #000000);
  background: color-mix(in srgb, var(--pill-p) 9%, #ffffff);
  border: 1px solid color-mix(in srgb, var(--pill-p) 18%, #ffffff);
}

@media (max-width: 640px) {
  .page-pill {
    font-size: 0.6875rem;
    padding: 0.35rem 0.75rem;
  }
}
</style>
