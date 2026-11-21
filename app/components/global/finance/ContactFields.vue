<script setup lang="ts">
/**
 * The contact information fields (step 1 Applicant / step 4 Co-Applicant), grid items of the step's 12-column card:
 * the title row (with the Multi dealer's Store Location for the applicant), names, phone, email, SSN, birthdate and
 * the driver's license. Typing a license number makes its state required (the star), clearing it lifts that again.
 */
import type { FinCtx } from './CreditApp.vue'
import FinField from './FinField.vue'
import BirthdateField from './BirthdateField.vue'

const props = withDefaults(defineProps<{ co?: boolean }>(), { co: false })

const ctx = inject<FinCtx>('finCtx')!
const { form, bad, msg, ind, vehicleLocationId } = ctx
const { mainCompany, isMulti } = useSite()

const p = props.co ? 'co_' : ''
const STATE = `${p}state`
const DL_IND = `${p}app_dl_state`

/** The location's line in the Store Location select: "Name - street, city STATE zip". */
function locationLabel(loc: Record<string, any>) {
  const address = `${loc.street_address ?? ''}, ${loc.city ?? ''} ${String(loc.state ?? '').toUpperCase()} ${loc.zip_code ?? ''}`.trim()
  return `${loc.name ?? ''}${address !== '' ? ` - ${address}` : ''}`
}

function onLicenseInput(e: Event) {
  if ((e.target as HTMLInputElement).value) {
    ind[DL_IND] = '*'
  } else {
    bad[STATE] = false
    msg[STATE] = ''
    ind[DL_IND] = ''
  }
}

const US_STATES: [string, string][] = [
  ['ALABAMA', 'AL'], ['ALASKA', 'AK'], ['AMERICAN SAMOA', 'AS'], ['ARIZONA', 'AZ'], ['ARKANSAS', 'AR'],
  ['CALIFORNIA', 'CA'], ['COLORADO', 'CO'], ['CONNECTICUT', 'CT'], ['DELAWARE', 'DE'], ['DISTRICT OF COLUMBIA', 'DC'],
  ['FEDERATED STATES OF MICRONESIA', 'FM'], ['FLORIDA', 'FL'], ['GEORGIA', 'GA'], ['GUAM', 'GU'], ['HAWAII', 'HI'],
  ['IDAHO', 'ID'], ['ILLINOIS', 'IL'], ['INDIANA', 'IN'], ['IOWA', 'IA'], ['KANSAS', 'KS'], ['KENTUCKY', 'KY'],
  ['LOUISIANA', 'LA'], ['MAINE', 'ME'], ['MARSHALL ISLANDS', 'MH'], ['MARYLAND', 'MD'], ['MASSACHUSETTS', 'MA'],
  ['MICHIGAN', 'MI'], ['MINNESOTA', 'MN'], ['MISSISSIPPI', 'MS'], ['MISSOURI', 'MO'], ['MONTANA', 'MT'],
  ['NEBRASKA', 'NE'], ['NEVADA', 'NV'], ['NEW HAMPSHIRE', 'NH'], ['NEW JERSEY', 'NJ'], ['NEW MEXICO', 'NM'],
  ['NEW YORK', 'NY'], ['NORTH CAROLINA', 'NC'], ['NORTH DAKOTA', 'ND'], ['NORTHERN MARIANA ISLANDS', 'MP'],
  ['OHIO', 'OH'], ['OKLAHOMA', 'OK'], ['OREGON', 'OR'], ['PALAU', 'PW'], ['PENNSYLVANIA', 'PA'],
  ['PUERTO RICO', 'PR'], ['RHODE ISLAND', 'RI'], ['SOUTH CAROLINA', 'SC'], ['SOUTH DAKOTA', 'SD'],
  ['TENNESSEE', 'TN'], ['TEXAS', 'TX'], ['UTAH', 'UT'], ['VERMONT', 'VT'], ['VIRGIN ISLANDS', 'VI'],
  ['VIRGINIA', 'VA'], ['WASHINGTON', 'WA'], ['WEST VIRGINIA', 'WV'], ['WISCONSIN', 'WI'], ['WYOMING', 'WY'],
]

const COL4 = 'lg:col-span-3 md:col-span-6 col-span-full'
const COL2 = 'lg:col-span-6 md:col-span-6 col-span-full'
</script>

<template>
  <div class="col-span-full flex flex-col gap-2">
    <h1 class="font-bold text-gray-500 uppercase lg:text-left text-center">{{ co ? 'Co-Applicant' : 'Applicant' }}</h1>

    <div v-if="!co && isMulti" class="input-container mt-2.5">
      <label class="form-label text-sm font-bold">Store Location <span class="required-indicator">*</span></label>
      <select
        id="store_location"
        v-model="form.store_location"
        name="store_location"
        class="mt-2.5 input"
        :class="{ 'opacity-60 cursor-not-allowed': vehicleLocationId, 'input-error': bad.store_location }"
        :disabled="!!vehicleLocationId"
        @change="!vehicleLocationId && ctx.reset('store_location')"
      >
        <option value="" disabled>Select Store Location</option>
        <option v-for="loc in mainCompany" :key="loc.id" :value="String(loc.id)">{{ locationLabel(loc) }}</option>
      </select>
      <input v-if="vehicleLocationId" id="store_location_from_vehicle" type="hidden" :value="vehicleLocationId" />
      <span id="store_location_vt" class="validation-text">{{ msg.store_location }}</span>
    </div>
    <h2 class="col-span-full font-semibold company-primary-base-text lg:text-left text-center">Contact Information</h2>
  </div>

  <FinField :id="`${p}first_name`" label="First Name" req :col="COL4">
    <template v-if="!co" #before>
      <input id="vehicle_vin" type="hidden" name="vehicle_vin" :value="form.vehicle_vin" />
      <input id="vehicle_id" type="hidden" name="vehicle_id" :value="form.vehicle_id" />
    </template>
  </FinField>
  <FinField :id="`${p}middle_name`" label="Middle Name" :col="COL4" :vt="co" reset-on="none" />
  <FinField :id="`${p}last_name`" label="Last Name" req :col="COL4" />
  <FinField :id="`${p}suffix`" label="Suffix" :col="COL4" :vt="co" reset-on="none" />

  <FinField :id="`${p}contact_number`" label="Contact Number" req kind="phone" :col="COL2" inputmode="numeric" />
  <FinField :id="`${p}email`" label="Email" req kind="email" :col="COL2" />
  <FinField :id="`${p}sss`" label="Social Security Number" req kind="ssn" :col="COL2" />
  <BirthdateField :co="co" />

  <FinField
    :id="`${p}drivers_license_number`"
    label="Driver's License Number"
    type="text"
    :col="COL2"
    :vt="co"
    :reset-on="co ? 'none' : 'keyup'"
    @input="onLicenseInput"
  />

  <div :class="COL2" class="flex flex-col">
    <label class="form-label text-sm font-bold">
      Driver's License State <span :id="`${DL_IND}_required_indicator`" class="required-indicator">{{ ind[DL_IND] }}</span>
    </label>
    <select
      :id="STATE"
      v-model="form[STATE]"
      class="mt-2.5 input"
      :name="STATE"
      :class="{ 'input-error': bad[STATE] }"
      @change="ctx.reset(STATE)"
    >
      <option value="" disabled />
      <option v-for="[name, abbr] in US_STATES" :key="abbr" :value="name">{{ name }} - {{ abbr }}</option>
    </select>
    <span :id="`${STATE}_vt`" class="validation-text">{{ msg[STATE] }}</span>
  </div>
</template>
