<script setup lang="ts">
/**
 * Step 3 (Applicant) / step 6 (Co-Applicant): Current Employment and Previous Employment, as new_form.blade.php has
 * them. Years at the Company of 1 or less makes the previous employer required (the stars); more clears and unstars
 * it (is_prev_company_required / is_co_prev_company_required). Phones format as (xxx) xxx-xxxx, incomes as money,
 * years / months are clamped as they're typed (0-99 / 0-11).
 */
import type { FinCtx } from './CreditApp.vue'
import FinField from './FinField.vue'

const props = withDefaults(defineProps<{ step: number; co?: boolean }>(), { co: false })

const ctx = inject<FinCtx>('finCtx')!
const { form, bad, msg, current } = ctx

const co = props.co
const p = co ? 'co_' : ''
const F = {
  company: `${p}company_name`,
  phone: `${p}employer_phone`,
  title: `${p}job_title`,
  years: `${p}years_at_the_company`,
  months: `${p}months_at_the_company`,
  income: `${p}gross_monthly_income`,
}
const PREV = {
  company: `${p}prev_company_name`,
  phone: `${p}prev_employer_phone`,
  title: `${p}prev_job_title`,
  years: co ? 'co_years_prev_at_the_company' : 'prev_years_at_the_company',
  months: co ? 'co_months_prev_at_the_company' : 'prev_months_at_the_company',
  income: `${p}prev_gross_monthly_income`,
}
const PREV_IND = `${p}company`

/** is_prev_company_required() / is_co_prev_company_required() */
function isPrevCompanyRequired() {
  if (form[F.years] === '') return
  if (Number(form[F.years]) <= 1) {
    ctx.ind[PREV_IND] = '*'
    return
  }
  ctx.ind[PREV_IND] = ''
  for (const id of Object.values(PREV)) {
    bad[id] = false
    msg[id] = ''
    form[id] = ''
  }
}

function onYearsOrMonths(id: string) {
  ctx.reset(id)
  isPrevCompanyRequired()
}
</script>

<template>
  <section :data-section="`step-${step}`" :class="[`step-${step}`, { hidden: current !== step }]" class="flex flex-col gap-4">
    <div class="grid grid-cols-12 gap-4">
      <div class="col-span-full flex flex-col gap-2">
        <h1 class="font-bold text-gray-500 uppercase lg:text-left text-center">{{ co ? 'Co-Applicant' : 'Applicant' }}</h1>
        <h2 class="col-span-full font-semibold company-primary-base-text lg:text-left text-center">Current Employment</h2>
      </div>

      <FinField :id="F.company" label="Company Name" req col="md:col-span-6 col-span-full" />
      <FinField :id="F.phone" label="Employer Phone" req kind="phone" col="md:col-span-6 col-span-full" />
      <FinField :id="F.title" label="Job Title" req col="md:col-span-3 col-span-full" />
      <FinField
        :id="F.years"
        label="Years at the Company"
        req
        kind="number"
        :clamp="99"
        col="md:col-span-3 col-span-full"
        @keyup="onYearsOrMonths(F.years)"
        @change="onYearsOrMonths(F.years)"
      />
      <FinField
        :id="F.months"
        label="Months at the Company"
        req
        kind="number"
        :clamp="11"
        min="0"
        max="11"
        col="md:col-span-3 col-span-full"
        @keyup="onYearsOrMonths(F.months)"
        @change="onYearsOrMonths(F.months)"
      />
      <FinField :id="F.income" label="Gross Monthly Income" req kind="money" col="md:col-span-3 col-span-full" />
    </div>

    <div :id="`${p}prev_employment`" class="grid grid-cols-12 gap-4">
      <div v-if="co" class="col-span-full flex flex-col gap-2">
        <h2 class="col-span-full font-semibold company-primary-base-text lg:text-left text-center">
          Previous Employment <span class="fin-note">Only if at your current employer less than 2 years</span>
        </h2>
      </div>
      <h1 v-else class="col-span-full col-span-full font-semibold company-primary-base-text lg:text-left text-center">
        Previous Employment <span class="fin-note">Only if at your current employer less than 2 years</span>
      </h1>

      <FinField
        :id="PREV.company"
        label="Company Name"
        col="md:col-span-6 col-span-full"
        :ind-id="`${PREV_IND}_required_indicator`"
        :ind-key="PREV_IND"
      />
      <FinField
        :id="PREV.phone"
        label="Employer Phone"
        kind="phone"
        col="md:col-span-6 col-span-full"
        :ind-id="`${PREV_IND}_required_indicator`"
        :ind-key="PREV_IND"
      />
      <FinField
        :id="PREV.title"
        label="Job Title"
        col="md:col-span-3 col-span-full"
        :ind-id="`${PREV_IND}_required_indicator`"
        :ind-key="PREV_IND"
      />
      <FinField
        :id="PREV.years"
        label="Years at the Company"
        kind="number"
        :clamp="99"
        col="md:col-span-3 col-span-full"
        :ind-id="`${PREV_IND}_required_indicator`"
        :ind-key="PREV_IND"
        @change="ctx.reset(PREV.years)"
      />
      <FinField
        :id="PREV.months"
        label="Months at the Company"
        kind="number"
        :clamp="11"
        min="0"
        max="11"
        col="md:col-span-3 col-span-full"
        :ind-id="`${PREV_IND}_required_indicator`"
        :ind-key="PREV_IND"
        @change="ctx.reset(PREV.months)"
      />
      <FinField
        :id="PREV.income"
        label="Gross Monthly Income"
        kind="money"
        :type="co ? undefined : 'text'"
        col="md:col-span-3 col-span-full"
        :ind-id="`${PREV_IND}_required_indicator`"
        :ind-key="PREV_IND"
      />
    </div>
  </section>
</template>
