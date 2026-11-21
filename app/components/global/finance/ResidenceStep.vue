<script setup lang="ts">
/**
 * Step 2 (Applicant) / step 5 (Co-Applicant): Current Residence and Previous Residence, as new_form.blade.php has them.
 *  - Monthly Payment is required (its star) unless the status is "Own ( Paid and Clear )"; switching back clears it.
 *  - Years at Residence of 1 or less makes the previous residence required (the stars); more clears and unstars it
 *    (is_prev_residence_required / is_co_prev_residence_required, then the previous monthly payment's own check).
 *  - Years / months are clamped as they're typed (0-99 / 0-11).
 *  - The co-applicant's "Same As Primary" boxes copy the applicant's current / previous residence and lock the fields;
 *    unticking empties and unlocks them.
 */
import type { FinCtx } from './CreditApp.vue'
import { OWN } from './CreditApp.vue'
import FinField from './FinField.vue'

const props = withDefaults(defineProps<{ step: number; co?: boolean }>(), { co: false })

const ctx = inject<FinCtx>('finCtx')!
const { form, bad, msg, dis, current } = ctx

const co = props.co
const p = co ? 'co_' : ''
/** The ids of this step's fields (the Blade's, which differ a little for the co-applicant). */
const F = {
  street: `${p}street_address`,
  city: `${p}city`,
  state: co ? 'application_co_state' : 'applicant_state',
  zip: `${p}zip_code`,
  status: `${p}residence_status`,
  monthly: `${p}monthly_payment`,
  years: `${p}years_residence`,
  months: `${p}months_residence`,
}
const PREV = {
  street: `${p}prev_street_address`,
  city: `${p}prev_city`,
  state: `${p}prev_state`,
  zip: `${p}prev_zip_code`,
  status: `${p}prev_residence_status`,
  monthly: `${p}prev_monthly_payment`,
  years: `${p}prev_years_residence`,
  months: `${p}prev_months_residence`,
}
const PREV_IND = `${p}residence`

const STATUSES = [OWN, 'Own ( Paying Mortgage )', 'Rent', 'Other']

function clearField(id: string, value = '') {
  bad[id] = false
  msg[id] = ''
  form[id] = value
}

/** forMonthlyPaymentValidation() / forCoMonthlyPaymentValidation() */
function forMonthlyPayment() {
  if (form[F.status] !== OWN) ctx.ind[F.monthly] = '*'
  else {
    ctx.ind[F.monthly] = ''
    clearField(F.monthly)
  }
}

/** forPrevMonthlyPaymentValidation() / forCoPrevMonthlyPaymentValidation() */
function forPrevMonthlyPayment() {
  if (Number(form[F.years]) <= 1 && form[PREV.status] !== OWN) ctx.ind[PREV.monthly] = '*'
  else {
    ctx.ind[PREV.monthly] = ''
    clearField(PREV.monthly)
  }
}

/** is_prev_residence_required() / is_co_prev_residence_required() */
function isPrevResidenceRequired() {
  if (form[F.years] !== '') {
    if (Number(form[F.years]) <= 1) ctx.ind[PREV_IND] = '*'
    else {
      ctx.ind[PREV_IND] = ''
      for (const id of Object.values(PREV)) clearField(id, id === PREV.status ? OWN : '')
    }
  }
  forPrevMonthlyPayment()
}

function onYearsOrMonths(id: string) {
  isPrevResidenceRequired()
  ctx.reset(id)
}

/* ── The co-applicant's "Same As Primary" boxes (handleCoApplicantCurrentAdd / handleCoApplicantPreviousAdd) ── */
const sameAdd = ref(false)
const samePrevAdd = ref(false)
const CURRENT_PAIRS: [string, string][] = [
  ['street_address', 'co_street_address'],
  ['city', 'co_city'],
  ['applicant_state', 'application_co_state'],
  ['zip_code', 'co_zip_code'],
  ['residence_status', 'co_residence_status'],
  ['monthly_payment', 'co_monthly_payment'],
  ['years_residence', 'co_years_residence'],
  ['months_residence', 'co_months_residence'],
]
const PREV_PAIRS: [string, string][] = [
  'prev_street_address',
  'prev_city',
  'prev_state',
  'prev_zip_code',
  'prev_residence_status',
  'prev_monthly_payment',
  'prev_years_residence',
  'prev_months_residence',
].map((id) => [id, `co_${id}`])

function applySame(pairs: [string, string][], checked: boolean, alsoClear: string[] = []) {
  for (const [from, to] of pairs) {
    if (checked) {
      form[to] = form[from] ?? ''
      msg[to] = ''
    } else {
      form[to] = to.endsWith('residence_status') ? OWN : ''
    }
    dis[to] = checked
    bad[to] = false
  }
  if (checked) for (const id of alsoClear) msg[id] = ''
}
function onSameAdd() {
  applySame(CURRENT_PAIRS, sameAdd.value, ['co_state'])
}
function onSamePrevAdd() {
  applySame(PREV_PAIRS, samePrevAdd.value)
}
</script>

<template>
  <section :data-section="`step-${step}`" :class="[`step-${step}`, { hidden: current !== step }]" class="flex flex-col gap-4">
    <div class="grid grid-cols-12 gap-4">
      <div class="col-span-full flex flex-col gap-2">
        <h1 class="font-bold text-gray-500 uppercase lg:text-left text-center">{{ co ? 'Co-Applicant' : 'Applicant' }}</h1>
        <h2 class="col-span-full font-semibold company-primary-base-text lg:text-left text-center">Current Residence</h2>
        <label v-if="co" class="form-label text-sm font-bold">
          <input id="co-applicant-same-add" v-model="sameAdd" type="checkbox" @change="onSameAdd" /><small> Same As Primary (Current Residence)</small>
        </label>
      </div>

      <FinField :id="F.street" label="Street Address" req :col="co ? 'lg:col-span-6 md:col-span-4 col-span-full' : 'lg:col-span-6 md:col-span-8 col-span-full'" />
      <FinField :id="F.city" label="City" req col="lg:col-span-2 md:col-span-4 col-span-full" />
      <FinField
        :id="F.state"
        label="State"
        req
        type="text"
        col="lg:col-span-2 md:col-span-6 col-span-full"
        :reset-on="co ? 'change' : 'keyup'"
        :autocomplete="co ? undefined : 'off'"
      />
      <FinField :id="F.zip" label="Zip Code" req kind="zip" col="lg:col-span-2 md:col-span-6 col-span-full" />

      <div class="md:col-span-3 col-span-full flex flex-col">
        <label class="form-label text-sm font-bold">Residence Status</label>
        <select
          :id="F.status"
          v-model="form[F.status]"
          class="mt-2.5 input"
          :name="F.status"
          :disabled="dis[F.status]"
          :class="{ 'input-error': bad[F.status] }"
          @change="forMonthlyPayment(); co && ctx.reset(F.status)"
        >
          <option v-for="s in STATUSES" :key="s">{{ s }}</option>
        </select>
        <span :id="`${F.status}_vt`" class="validation-text">{{ msg[F.status] }}</span>
      </div>

      <FinField
        :id="F.monthly"
        label="Monthly Payment"
        kind="money"
        col="md:col-span-3 col-span-full"
        :ind-id="`${F.monthly}_required_indicator`"
        :ind-key="F.monthly"
      />
      <FinField
        :id="F.years"
        label="Years at Residence"
        req
        kind="number"
        :clamp="99"
        col="md:col-span-3 col-span-full"
        :maxlength="co ? undefined : 2"
        @keyup="onYearsOrMonths(F.years)"
        @change="onYearsOrMonths(F.years)"
      />
      <FinField
        :id="F.months"
        label="Months at Residence"
        req
        kind="number"
        :clamp="11"
        col="md:col-span-3 col-span-full"
        @keyup="onYearsOrMonths(F.months)"
        @change="onYearsOrMonths(F.months)"
      />
    </div>

    <div :id="`${p}prev_residence`" class="grid grid-cols-12 gap-4">
      <h1 class="col-span-full col-span-full font-semibold company-primary-base-text lg:text-left text-center">
        Previous Residence <span class="fin-note">Only if at your primary residence less than 2 years</span>
      </h1>
      <label v-if="co" class="col-span-full text-sm font-bold">
        <input id="co-applicant-same-prev-add" v-model="samePrevAdd" type="checkbox" @change="onSamePrevAdd" /><small> Same As Primary (Previous Residence) </small>
      </label>

      <FinField
        :id="PREV.street"
        label="Street Address"
        col="lg:col-span-6 md:col-span-8 col-span-full"
        :ind-id="`${PREV_IND}_required_indicator`"
        :ind-key="PREV_IND"
      />
      <FinField
        :id="PREV.city"
        label="City"
        col="lg:col-span-2 md:col-span-4 col-span-full"
        :ind-id="`${PREV_IND}_required_indicator`"
        :ind-key="PREV_IND"
      />
      <FinField
        :id="PREV.state"
        label="State"
        type="text"
        reset-on="change"
        col="lg:col-span-2 md:col-span-6 col-span-full"
        :ind-id="`${PREV_IND}_required_indicator`"
        :ind-key="PREV_IND"
      />
      <FinField
        :id="PREV.zip"
        label="Zip Code"
        kind="zip"
        :reset-on="co ? 'click' : 'keyup'"
        col="lg:col-span-2 md:col-span-6 col-span-full"
        :ind-id="`${PREV_IND}_required_indicator`"
        :ind-key="PREV_IND"
      />

      <div class="md:col-span-3 col-span-full flex flex-col">
        <label class="form-label text-sm font-bold">Residence Status</label>
        <select
          :id="PREV.status"
          v-model="form[PREV.status]"
          class="mt-2.5 input"
          :name="PREV.status"
          :disabled="dis[PREV.status]"
          :class="{ 'input-error': bad[PREV.status] }"
          @change="forPrevMonthlyPayment(); co && ctx.reset(PREV.status)"
        >
          <option v-for="s in STATUSES" :key="s">{{ s }}</option>
        </select>
        <span :id="`${PREV.status}_vt`" class="validation-text">{{ msg[PREV.status] }}</span>
      </div>

      <FinField
        :id="PREV.monthly"
        label="Monthly Payment"
        kind="money"
        col="md:col-span-3 col-span-full"
        :ind-id="`${PREV.monthly}_required_indicator`"
        :ind-key="PREV.monthly"
      />
      <FinField
        :id="PREV.years"
        label="Years at Residence"
        kind="number"
        :clamp="99"
        col="md:col-span-3 col-span-full"
        :ind-id="`${PREV_IND}_required_indicator`"
        :ind-key="PREV_IND"
        @change="ctx.reset(PREV.years)"
      />
      <FinField
        :id="PREV.months"
        label="Months at Residence"
        kind="number"
        :clamp="11"
        col="md:col-span-3 col-span-full"
        :ind-id="`${PREV_IND}_required_indicator`"
        :ind-key="PREV_IND"
        @change="ctx.reset(PREV.months)"
      />
    </div>
  </section>
</template>
