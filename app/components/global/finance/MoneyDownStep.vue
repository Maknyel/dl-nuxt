<script setup lang="ts">
/**
 * Step 8, Money Down, as new_form.blade.php has it: "Are you putting cash down?" (No by default); Yes shows the
 * Desired Downpayment amount (money formatting), required then (CreditApp.vue step8()); No empties it.
 */
import type { FinCtx } from './CreditApp.vue'
import { priceBlur, priceFocus, priceInput, priceKeydown } from './FinField.vue'

defineProps<{ step: number }>()

const ctx = inject<FinCtx>('finCtx')!
const { form, bad, msg, current } = ctx

const yes = computed(() => form['has-downpayment'] === 'Yes')

/** hasDownpayment('Yes' | 'No') */
function hasDownpayment(value: 'Yes' | 'No') {
  form['has-downpayment'] = value
  if (value === 'No') form.desired_downpayment = ''
}

function money(e: Event, fn: (raw: string) => string) {
  const el = e.target as HTMLInputElement
  el.value = fn(el.value)
  form.desired_downpayment = el.value
}

const RADIO = 'w-6 h-6 focus:outline-hidden focus:ring-2 rounded-full focus:shadow-lg'
</script>

<template>
  <section :data-section="`step-${step}`" :class="[`step-${step}`, { hidden: current !== step }]" class="flex flex-col gap-4">
    <div class="grid grid-cols-12 gap-4">
      <div class="col-span-full flex flex-col gap-2">
        <h1 class="font-bold text-gray-500 uppercase lg:text-left text-center">MONEY DOWN INFORMATION</h1>
      </div>
    </div>
    <div class="col-span-full flex gap-4 items-center lg:justify-start justify-center fin-choice">
      <label class="form-label text-sm font-bold"> Are you putting cash down? </label>
      <div class="flex items-center gap-4">
        <input
          id="hasDownPayment"
          type="radio"
          name="has-downpayment"
          value="Yes"
          :checked="yes"
          :class="RADIO"
          @click="hasDownpayment('Yes')"
        />
        <span class="form-label text-sm font-bold"> Yes </span>
      </div>
      <div class="flex items-center gap-4">
        <input type="radio" name="has-downpayment" value="No" :checked="!yes" :class="RADIO" @click="hasDownpayment('No')" />
        <span class="form-label text-sm font-bold"> No </span>
      </div>
    </div>
    <div id="hasDownPaymentDiv" class="col-span-full flex flex-col gap-2" :class="{ hidden: !yes }">
      <h2 class="fin-h">Money Down Information</h2>
      <div class="input-container mt-2.5">
        <label class="form-label text-sm font-bold">Desired Downpayment Amount </label>
        <div class="mt-2.5 group-input">
          <div class="icon">
            <span>$</span>
          </div>
          <input
            id="desired_downpayment"
            class="input"
            name="desired_downpayment"
            :class="{ 'input-error': bad.desired_downpayment }"
            :value="form.desired_downpayment"
            @keyup="ctx.reset('desired_downpayment')"
            @input="money($event, priceInput)"
            @blur="money($event, priceBlur)"
            @focus="money($event, priceFocus)"
            @keydown="priceKeydown"
          />
        </div>
        <span id="desired_downpayment_vt" class="validation-text">{{ msg.desired_downpayment }}</span>
      </div>
    </div>
  </section>
</template>
