<script setup lang="ts">
/**
 * template-1/finance/layout-4.blade.php: the dark financing card, the light sell card, then the stats strip. The copy
 * is hard-coded; the sell photo is the dealer's pre_define.home.sell_your_vehicle_image.
 */
import T1Icon from './Icon.vue'

const { company, site } = useSite()

const financePoints = ['No impact to your credit score.', 'Personalized rates.', 'Instant decisions.']
const sellPoints = ['Get an instant cash offer online in under 2 minutes.', 'Free appraisal.', 'We buy all makes & models.']
const stats = [
  { icon: 'users', value: '2,000+', label: 'Happy Customers', filled: false },
  { icon: 'star', value: '5/5', label: 'Google Rating', filled: true },
  { icon: 'clock', value: '10+ Years', label: 'In Business', filled: false },
  { icon: 'map-pin', value: 'Local & Trusted', label: 'Since 2012', filled: false },
]

const FINANCE_FALLBACK = '/media/images/company/finance.webp'
const SELL_FALLBACK = '/media/images/company/sell_2.png'
const financeSrc = ref('/media/images/company/finance-couple.jpg')
const sellSrc = ref(
  String(site.value?.mediaBase ?? '') +
    (company.value.pre_define?.home?.sell_your_vehicle_image ?? 'global_images/home_new/sell.webp'),
)

// The Blade's onerror fallbacks. An image can fail before the page hydrates, so check once on mount too.
const financeImg = ref<HTMLImageElement | null>(null)
const sellImg = ref<HTMLImageElement | null>(null)
const onFinanceError = () => {
  if (financeSrc.value !== FINANCE_FALLBACK) financeSrc.value = FINANCE_FALLBACK
}
const onSellError = () => {
  if (sellSrc.value !== SELL_FALLBACK) sellSrc.value = SELL_FALLBACK
}
onMounted(() => {
  if (financeImg.value?.complete && financeImg.value.naturalWidth === 0) onFinanceError()
  if (sellImg.value?.complete && sellImg.value.naturalWidth === 0) onSellError()
})
</script>

<template>
  <section class="container t1-sec mx-auto px-10">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
      <!-- Finance card (dark) -->
      <div class="finance-card-dark relative rounded-2xl overflow-hidden min-h-[280px] flex">
        <div class="relative z-10 p-8 flex flex-col justify-center sm:w-3/5 shrink-0">
          <div class="finance-badge finance-badge-dark">
            <T1Icon name="circle-check" class="t1-ico-sm" />
            GET PRE-APPROVED IN MINUTES
          </div>
          <h2 class="finance-title text-white">Financing<br />Made Simple</h2>
          <ul class="finance-list">
            <li v-for="point in financePoints" :key="point" class="finance-list-dark">
              <T1Icon name="check" class="t1-ico-sm" :stroke="2.5" />
              {{ point }}
            </li>
          </ul>
          <NuxtLink to="/finance" class="t1-btn t1-btn--white w-fit">
            Get Pre-Approved
            <T1Icon name="arrow-right" class="t1-ico-sm" :stroke="2.5" />
          </NuxtLink>
        </div>
        <div class="finance-photo absolute right-0 top-0 h-full w-4/5 flex items-end justify-center overflow-hidden">
          <img
            ref="financeImg"
            :src="financeSrc"
            alt="Financing"
            loading="lazy"
            decoding="async"
            class="h-full w-full object-cover object-[40%_center] finance-img-fade"
            @error="onFinanceError"
          />
        </div>
      </div>

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

    <!-- Stats bar -->
    <div class="t1-panel px-8 py-6">
      <div class="lg:flex justify-around grid grid-cols-2 gap-6 items-center">
        <div v-for="stat in stats" :key="stat.label" class="flex flex-col items-center lg:flex-row gap-2 lg:gap-3">
          <div class="finance-stat-icon">
            <T1Icon :name="stat.icon" class="t1-ico" :filled="stat.filled" />
          </div>
          <div class="flex flex-col items-center lg:items-start">
            <div class="finance-stat-value">{{ stat.value }}</div>
            <div class="finance-stat-label">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.finance-card-dark {
  background: #2a2b38;
  border: 1px solid #34354a;
  box-shadow: 0 18px 40px -22px rgba(14, 13, 18, 0.65);
}

/* The photo across the whole card, under a dark purple tint (the Blade's `.finance-card-dark > .absolute`). */
.finance-card-dark > .finance-photo {
  width: 100%;
}

.finance-card-dark > .finance-photo::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(30, 18, 64, 0.94) 0%, rgba(38, 22, 80, 0.82) 38%, rgba(46, 26, 96, 0.38) 68%, rgba(46, 26, 96, 0.12) 100%);
  pointer-events: none;
}

.finance-card-dark .finance-img-fade {
  object-position: 70% center;
}

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

.finance-badge-dark {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
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

.finance-list-dark {
  color: rgba(255, 255, 255, 0.9);
}

.finance-card-dark,
.finance-card-light {
  min-height: 20rem;
}

.finance-check-icon {
  color: var(--company-primary-base);
}

.finance-stat-icon {
  display: inline-flex;
  color: var(--company-primary-base);
}

.finance-stat-icon .t1-ico {
  width: 1.75rem;
  height: 1.75rem;
}

.finance-stat-value {
  font-family: 'Outfit', 'Inter', sans-serif;
  font-size: 1.375rem;
  font-weight: 700;
  line-height: 1.2;
  color: #16131f;
  text-align: center;
}

.finance-stat-label {
  font-size: 0.8125rem;
  color: #6b6880;
}

.finance-img-fade {
  -webkit-mask-image: linear-gradient(to left, rgba(0, 0, 0, 0.9) 0%, transparent 100%);
  mask-image: linear-gradient(to left, rgba(0, 0, 0, 0.9) 0%, transparent 100%);
}

.sell-img-fade {
  -webkit-mask-image: linear-gradient(to left, rgba(0, 0, 0, 1) 40%, transparent 100%);
  mask-image: linear-gradient(to left, rgba(0, 0, 0, 1) 40%, transparent 100%);
}

@media (min-width: 1024px) {
  .finance-stat-value {
    text-align: left;
  }
}
</style>
