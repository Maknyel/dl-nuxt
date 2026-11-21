<script setup lang="ts">
/**
 * The row under the gallery (Laravel global/cars/vdp-payment.blade.php):
 *  - "Financing Made Simple": the financing card, Get Pre-Approved opens the credit application with the vehicle;
 *  - "Estimate My Monthly Payment" (the Alpine `vdpPayment`): credit range, term and down payment (its slider), with
 *    the payment and its breakdown. A standard amortised loan on the advertised price; the APRs are example rates.
 *    Shown only with a price and when the dealer shows prices; otherwise only the financing card.
 * Styled by vdp-page.css.
 */
const props = defineProps<{ vehicle: Record<string, any> }>()
const { templateNav } = useSite()

const TIERS = [
  { range: '500 – 600', label: 'Poor', apr: 18.9 },
  { range: '601 – 650', label: 'Fair', apr: 14.9 },
  { range: '651 – 700', label: 'Good', apr: 9.9 },
  { range: '701 – 750', label: 'Very Good', apr: 7.4 },
  { range: '751+', label: 'Excellent', apr: 5.9 },
]
const TERMS = [48, 60, 72]

const price = computed(() => {
  const p = props.vehicle.internet_price
  return p !== null && p !== '' && !Number.isNaN(Number(p)) && Number(p) > 0 ? Number(p) : 0
})
const on = computed(() => price.value > 0 && String(templateNav.value?.show_car_price ?? '1') === '1')
const downMax = computed(() => Math.floor((price.value * 0.5) / 500) * 500)

const tier = ref(2)
const term = ref(72)
const down = ref(Math.min(2000, downMax.value))

const financed = computed(() => Math.max(0, price.value - down.value))
const monthly = computed(() => {
  const r = TIERS[tier.value]!.apr / 100 / 12
  const n = term.value
  const p = financed.value
  if (p <= 0) return 0
  return r === 0 ? p / n : (p * r) / (1 - Math.pow(1 + r, -n))
})
const money = (x: number) => `$${Math.round(x).toLocaleString('en-US')}`

const financeUrl = computed(() => `/finance?vehicle_id=${encodeURIComponent(props.vehicle.id ?? '')}`)

function onDown(e: Event) {
  down.value = Number((e.target as HTMLInputElement).value)
}
function onImgError(e: Event) {
  const img = e.target as HTMLImageElement
  if (!img.src.endsWith('/media/images/company/finance.webp')) img.src = '/media/images/company/finance.webp'
}
</script>

<template>
  <div class="vdp-money-row" :class="{ 'vdp-money-row--solo': !on }">
    <section class="vdp-promo">
      <img
        class="vdp-promo-img"
        src="/media/images/company/finance-couple.jpg"
        alt=""
        loading="lazy"
        decoding="async"
        @error="onImgError"
      />
      <div class="vdp-promo-body">
        <span class="vdp-promo-badge"><Icon name="ion:checkmark-circle-outline" aria-hidden="true" /> GET PRE-APPROVED IN MINUTES</span>
        <h2 class="vdp-promo-title">Financing<br />Made Simple</h2>
        <ul class="vdp-promo-list">
          <li><Icon name="ion:checkmark-outline" aria-hidden="true" /> No impact to your credit score.</li>
          <li><Icon name="ion:checkmark-outline" aria-hidden="true" /> Personalized rates.</li>
          <li><Icon name="ion:checkmark-outline" aria-hidden="true" /> Instant decisions.</li>
        </ul>
        <NuxtLink :to="financeUrl" class="vdp-promo-btn">Get Pre-Approved <Icon name="ion:arrow-forward-outline" aria-hidden="true" /></NuxtLink>
      </div>
    </section>

    <section v-if="on" class="vdp-pay">
      <div class="vdp-pay-hd">
        <span class="vdp-tile-sm"><Icon name="ion:calculator-outline" /></span>
        <div>
          <h2 class="vdp-pay-title">Estimate My Monthly Payment</h2>
          <p class="vdp-pay-sub">Example rates for illustration only. Taxes and fees not included.</p>
        </div>
      </div>

      <div class="vdp-pay-grid">
        <div class="vdp-pay-main">
          <div class="vdp-pay-step">
            <span class="vdp-pay-eyebrow"><i>1</i> CREDIT SCORE</span>
            <div class="vdp-pay-tiers">
              <button
                v-for="(t, i) in TIERS"
                :key="i"
                type="button"
                class="vdp-pay-tier"
                :class="{ 'is-on': tier === i }"
                @click="tier = i"
              >
                <strong>{{ t.range }}</strong>
                <small>{{ t.label }}</small>
              </button>
            </div>
          </div>

          <div class="vdp-pay-step">
            <span class="vdp-pay-eyebrow"><i>2</i> LOAN TERM</span>
            <div class="vdp-pay-terms">
              <button
                v-for="m in TERMS"
                :key="m"
                type="button"
                class="vdp-pay-term"
                :class="{ 'is-on': term === m }"
                @click="term = m"
              >
                {{ m + ' mo' }}
              </button>
            </div>
          </div>

          <div class="vdp-pay-step vdp-pay-down">
            <div class="flex items-center justify-between">
              <span class="vdp-pay-eyebrow"><i>3</i> DOWN PAYMENT</span>
              <span class="vdp-pay-down-val">{{ money(down) }}</span>
            </div>
            <input type="range" min="0" :max="downMax" step="500" :value="down" aria-label="Down payment" @input="onDown" />
            <div class="vdp-pay-down-ends"><span>$0</span><span>{{ money(downMax) }}</span></div>
          </div>
        </div>

        <div class="vdp-pay-summary">
          <div class="vdp-pay-eyebrow">EST. MONTHLY PAYMENT</div>
          <div class="vdp-pay-amount"><span>{{ money(monthly) }}</span><small>/mo</small></div>
          <dl class="vdp-pay-break">
            <div><dt>Vehicle price</dt><dd>{{ money(price) }}</dd></div>
            <div><dt>Down payment</dt><dd>{{ money(down) }}</dd></div>
            <div><dt>APR · term</dt><dd>{{ TIERS[tier]!.apr.toFixed(1) + '% · ' + term + ' mo' }}</dd></div>
            <div class="is-total"><dt>Amount financed</dt><dd>{{ money(financed) }}</dd></div>
          </dl>
          <NuxtLink :to="financeUrl" class="vdp-pay-cta">Get Pre-Approved</NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
