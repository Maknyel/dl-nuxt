<script setup lang="ts">
/**
 * components/financing-card.blade.php (x-financing-card): Financing Made Simple, one card for the home page (template
 * 1's Financing + Sell section) and the vehicle page (beside the payment estimator), so they can't drift apart. The
 * couple photo across the card under a black shade, strong at the left behind the text, nearly clear at the right; the
 * "GET PRE-APPROVED IN MINUTES" pill in the Top Dollar pill's style (the company's primary on its tint); white text and
 * checks; a white Get Pre-Approved button with near-black text. Self-contained: it doesn't rely on the page's theme.
 *
 * Usage: <UiFinancingCard />, with :href for a link other than the finance page (the vehicle page passes its
 * vehicle_id). Other attributes (class, id) land on the card.
 */
const props = defineProps<{ href?: string }>()

const finHref = computed(() => props.href ?? '/finance')
const finPoints = ['No impact to your credit score.', 'Personalized rates.', 'Instant decisions.']

const FALLBACK = '/media/images/company/finance.webp'
const src = ref('/media/images/company/finance-couple.jpg')
const img = ref<HTMLImageElement | null>(null)
const onError = () => {
  if (src.value !== FALLBACK) src.value = FALLBACK
}
// An image can fail before the component mounts, so check once on mount too.
onMounted(() => {
  if (img.value?.complete && img.value.naturalWidth === 0) onError()
})
</script>

<template>
  <section class="fin-card">
    <img ref="img" class="fin-card-img" :src="src" alt="" loading="lazy" decoding="async" @error="onError" />
    <div class="fin-card-body">
      <span class="fin-card-pill"><Icon name="ion:checkmark-circle-outline" aria-hidden="true" /> GET PRE-APPROVED IN MINUTES</span>
      <h2 class="fin-card-title">Financing<br />Made Simple</h2>
      <ul class="fin-card-list">
        <li v-for="point in finPoints" :key="point"><Icon name="ion:checkmark-outline" aria-hidden="true" /> {{ point }}</li>
      </ul>
      <NuxtLink :to="finHref" class="fin-card-btn">Get Pre-Approved <Icon name="ion:arrow-forward-outline" aria-hidden="true" /></NuxtLink>
    </div>
  </section>
</template>

<style>
.fin-card {
  --fin-p: var(--company-primary-base, #6d28d9);
  position: relative;
  display: flex;
  min-height: 20rem;
  overflow: hidden;
  border-radius: 1rem;
  background: #0d0d10; /* behind the photo, if it fails to load */
  border: 1px solid #2a2a33;
  box-shadow: 0 18px 40px -22px rgba(14, 13, 18, 0.65);
  font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
}

.fin-card .fin-card-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 70% center;
}

/* The black shade over the photo. */
.fin-card::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.94) 0%, rgba(0, 0, 0, 0.82) 38%, rgba(0, 0, 0, 0.38) 68%, rgba(0, 0, 0, 0.12) 100%);
  pointer-events: none;
}

.fin-card .fin-card-body {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  max-width: 24rem;
  padding: 2rem;
  color: #ffffff;
}

/* The Top Dollar pill's style: the primary on its tint. */
.fin-card .fin-card-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 1.25rem;
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  color: var(--fin-p);
  background: color-mix(in srgb, var(--fin-p) 10%, #ffffff);
}

.fin-card .fin-card-pill .ion-icon {
  font-size: 0.95rem;
}

.fin-card .fin-card-title {
  margin: 0 0 1.25rem;
  font-family: 'Outfit', 'Inter', sans-serif;
  font-size: 2.125rem;
  font-weight: 800;
  line-height: 1.12;
  color: #ffffff;
}

.fin-card .fin-card-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0 0 1.75rem;
  padding: 0;
  list-style: none;
}

.fin-card .fin-card-list li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.35;
  color: rgba(255, 255, 255, 0.9);
}

.fin-card .fin-card-list .ion-icon {
  flex-shrink: 0;
  font-size: 1rem;
}

.fin-card .fin-card-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1.25rem;
  white-space: nowrap;
  color: #141626;
  background: #ffffff;
  box-shadow: 0 10px 24px -10px rgba(0, 0, 0, 0.45), 0 0 0 3px rgba(255, 255, 255, 0.14);
  transition: transform 0.15s, filter 0.15s;
}

.fin-card .fin-card-btn:hover {
  color: #141626;
  transform: translateY(-1px);
  filter: brightness(0.96);
}

@media (max-width: 640px) {
  .fin-card .fin-card-body {
    padding: 1.5rem;
  }

  .fin-card .fin-card-title {
    font-size: 1.75rem;
  }
}
</style>
