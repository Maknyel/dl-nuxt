<script setup lang="ts">
/**
 * Step 1 (Applicant: the Individual / Joint choice over the contact card) and step 4 (Co-Applicant: the section is
 * the card itself), as new_form.blade.php lays them out. Shown while it's the current step.
 */
import type { FinCtx } from './CreditApp.vue'
import ContactFields from './ContactFields.vue'

withDefaults(defineProps<{ step: number; co?: boolean }>(), { co: false })

const { current, creditType, setCreditType } = inject<FinCtx>('finCtx')!

const RADIO = 'w-6 h-6 focus:outline-hidden focus:ring-2 rounded-full focus:shadow-lg'
</script>

<template>
  <section
    v-if="!co"
    :data-section="`step-${step}`"
    :class="[`step-${step}`, { hidden: current !== step }]"
    class="flex flex-col gap-4"
  >
    <div class="col-span-full flex gap-4 items-center lg:justify-start justify-center fin-choice">
      <label class="form-label text-sm font-bold">Application type</label>
      <div class="flex items-center gap-4">
        <input
          id="individualOption"
          type="radio"
          name="credit_type"
          value="individual"
          :checked="creditType === 'Individual'"
          :class="RADIO"
          @click="setCreditType('Individual')"
        />
        <span class="form-label text-sm font-bold"> Individual </span>
      </div>

      <div class="flex items-center gap-4">
        <input
          type="radio"
          name="credit_type"
          value="joint"
          :checked="creditType === 'Joint'"
          :class="RADIO"
          @click="setCreditType('Joint')"
        />
        <span class="form-label text-sm font-bold"> Joint </span>
      </div>
    </div>

    <!-- The applicant's fields, in their own card (the radios above sit outside it). -->
    <div class="grid grid-cols-12 gap-4">
      <ContactFields />
    </div>
  </section>

  <section
    v-else
    :data-section="`step-${step}`"
    :class="[`step-${step}`, { hidden: current !== step }]"
    class="grid grid-cols-12 gap-4"
  >
    <ContactFields co />
  </section>
</template>
