<script setup lang="ts">
/**
 * template-1/finance/layout-4.blade.php: the financing card (UiFinancingCard, shared with the vehicle page) and the
 * light sell card. (The stats row under them was removed on request.) The copy is hard-coded; the sell photo is the
 * dealer's pre_define.home.sell_your_vehicle_image.
 */
import T1Icon from './Icon.vue'

const { company, site, isSales } = useSite()

const sellPoints = ['Get an instant cash offer online in under 2 minutes.', 'Free appraisal.', 'We buy all makes & models.']

const SELL_FALLBACK = '/media/images/company/sell_2.png'
// The sales site always shows its own sell photo (no dealer image).
const sellSrc = ref(
  isSales.value
    ? SELL_FALLBACK
    : String(site.value?.mediaBase ?? '') +
        (company.value.pre_define?.home?.sell_your_vehicle_image ?? 'global_images/home_new/sell.webp'),
)

// The Blade's onerror fallbacks. An image can fail before the page hydrates, so check once on mount too.
const sellImg = ref<HTMLImageElement | null>(null)
const onSellError = () => {
  if (sellSrc.value !== SELL_FALLBACK) sellSrc.value = SELL_FALLBACK
}
onMounted(() => {
  if (sellImg.value?.complete && sellImg.value.naturalWidth === 0) onSellError()
})
</script>

<template>
  <section class="container t1-sec mx-auto px-10">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
      <!-- Finance card: the shared component, the same card as the vehicle page's. -->
      <UiFinancingCard />

      <!-- Sell card (light) -->
      <div class="finance-card-light relative rounded-2xl overflow-hidden min-h-[280px] flex">
        <div class="relative z-10 p-8 flex flex-col justify-center w-4/5 sm:w-3/5 shrink-0">
          <div class="finance-badge finance-badge-light">
            <T1Icon name="dollar" class="t1-ico-sm" :stroke="2.5" />
            GET TOP DOLLAR
          </div>
          <h2 class="finance-title finance-heading-dark">Sell or Trade<br />Your Car</h2>
          <ul class="finance-list">
            <li v-for="point in sellPoints" :key="point" class="finance-list-light">
              <T1Icon name="check" class="t1-ico-sm finance-check-icon" :stroke="2.5" />
              {{ point }}
            </li>
          </ul>
          <NuxtLink to="/sell" class="t1-btn t1-btn--deep w-fit">
            Get My Offer
            <T1Icon name="arrow-right" class="t1-ico-sm" :stroke="2.5" />
          </NuxtLink>
        </div>
        <div class="absolute right-0 top-0 h-full w-4/5 flex items-center justify-center overflow-hidden">
          <img
            ref="sellImg"
            :src="sellSrc"
            alt="Sell your car"
            loading="lazy"
            decoding="async"
            class="h-full w-full object-cover object-center sell-img-fade"
            @error="onSellError"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.finance-card-light {
  background: #ffffff;
  border: 1px solid var(--t1-line, #e9e8ee);
  box-shadow: var(--t1-card-shadow, 0 12px 30px -20px rgba(22, 19, 31, 0.28));
}

.finance-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  width: fit-content;
  margin-bottom: 1.25rem;
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.finance-badge-light {
  color: var(--company-primary-base);
  background: color-mix(in srgb, var(--company-primary-base) 10%, #ffffff);
}

.finance-title {
  font-size: 2.125rem;
  font-weight: 800;
  line-height: 1.12;
  margin-bottom: 1.25rem;
}

.finance-heading-dark {
  color: #16131f;
}

.finance-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.75rem;
}

.finance-list li {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.35;
}

.finance-list li svg {
  margin-top: 0.1rem;
}

.finance-list-light {
  color: #2b2838;
}

.finance-card-light {
  min-height: 20rem;
}

.finance-check-icon {
  color: var(--company-primary-base);
}

.sell-img-fade {
  -webkit-mask-image: linear-gradient(to left, rgba(0, 0, 0, 1) 40%, transparent 100%);
  mask-image: linear-gradient(to left, rgba(0, 0, 0, 1) 40%, transparent 100%);
}

</style>
