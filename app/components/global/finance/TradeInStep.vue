<script setup lang="ts">
/**
 * Step 7, Trade-In, as new_form.blade.php has it: "Do you have a trade-in?" (No by default); Yes shows the vehicle card.
 *  - Year → Make (the dealer's makes, from get-sell-us-your-car-data) → Model → Trim, each enabled once the one before
 *    has a value; changing one empties the ones after it. Models and trims come from JD Power through the server
 *    (/api/site/trade/models, /trims), the drive types once a trim is picked (/api/site/trade/drivetrain), with the
 *    Blade's "Loading trims..." / "Loading..." / "No trims found" / "Error loading data" states in the selects.
 *  - Mileage formats with thousands separators, Trade Payoff as money.
 *  - No empties the card's fields and locks Make / Model / Trim again.
 * Year, Make, Model and Trim are required when Yes is picked (CreditApp.vue step7()).
 */
import type { Ref } from 'vue'
import type { FinCtx } from './CreditApp.vue'
import { mileageInput, priceBlur, priceFocus, priceInput, priceKeydown } from './FinField.vue'

defineProps<{ step: number }>()

const ctx = inject<FinCtx>('finCtx')!
const { form, bad, msg, current, staticmake } = ctx

interface Opt {
  value: string
  label: string
  disabled?: boolean
}

const THIS_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: THIS_YEAR - 2007 + 1 }, (_, i) => String(THIS_YEAR - i))

const MODEL_PH: Opt = { value: '', label: 'Select your Vehicle Model', disabled: true }
const TRIM_PH: Opt = { value: '', label: 'Select your Vehicle Trim', disabled: true }
const DT_INITIAL: Opt[] = [
  { value: '', label: 'Select your Vehicle Drivetrain', disabled: true },
  ...['AWD', '4WD', 'FWD', 'RWD'].map((d) => ({ value: d, label: d })),
]

const modelOpts = ref<Opt[]>([MODEL_PH])
const trimOpts = ref<Opt[]>([TRIM_PH])
const dtOpts = ref<Opt[]>(DT_INITIAL)
const makeDis = ref(true)
const modelDis = ref(true)
const trimDis = ref(true)
const manualMake = ref(false)
const manualModel = ref(false)
const manualTrim = ref(false)
let currentTrims: { label?: string; body?: string; ucgvehicleid?: string | number }[] = []

const tradeYes = computed(() => form['trade-in'] === 'Yes')

/** Replace a select's options as jQuery's .html() did: the placeholder (or else the first enabled option) is picked. */
function setOptions(list: Ref<Opt[]>, field: string, opts: Opt[]) {
  list.value = opts
  form[field] = (opts[0]?.disabled ? '' : opts.find((o) => !o.disabled)?.value) ?? ''
}

function clear(id: string, value = '') {
  form[id] = value
  bad[id] = false
  msg[id] = ''
}

/** inputTradeInChecker(): each select opens once the one before it has a value. */
function checker() {
  if (form.year) makeDis.value = false
  if (form.make) modelDis.value = false
  if (form.model) trimDis.value = false
}
/** resetTradeInValidation(this) */
function resetTrade(id: string) {
  bad[id] = false
  msg[id] = ''
  checker()
}

/** hasTradeIn('Yes' | 'No') */
function hasTradeIn(value: 'Yes' | 'No') {
  form['trade-in'] = value
  if (value === 'Yes') return
  form.trade_ucgvehicleid = ''
  form.year = ''
  clear('make')
  makeDis.value = true
  clear('model')
  modelDis.value = true
  clear('trim')
  trimDis.value = true
  form.drivetrain = ''
  form.manual_mileage = ''
  form.manual_trade_payoff = ''
  form.manual_lien_holder = ''
}

function toggleManual(make: boolean | null, model: boolean, trim: boolean) {
  if (make !== null) {
    manualMake.value = make
    clear('manual_make')
  }
  manualModel.value = model
  clear('manual_model')
  manualTrim.value = trim
  clear('manual_trim')
}

function onYear() {
  resetTrade('year')
  clear('make')
  clear('model')
  modelDis.value = true
  clear('trim')
  trimDis.value = true
  form.drivetrain = ''
  // The Blade then asks for the models when a make is picked: never, the make was just emptied.
}

async function onMake() {
  resetTrade('make')
  toggleManual(form.make === 'Other', false, false)
  clear('model')
  clear('trim')
  trimDis.value = true
  form.drivetrain = ''

  const make = staticmake.value.find((m) => m.title === form.make)
  if (!make) {
    setOptions(modelOpts, 'model', [MODEL_PH])
    setOptions(trimOpts, 'trim', [TRIM_PH])
    return
  }
  try {
    const res = await $fetch<{ result?: { model: string }[] }>('/api/site/trade/models', {
      query: { make: make.title, modelyear: Number.parseInt(form.year ?? '', 10), period: 0, vehicletype: 'UsedCar' },
    })
    setOptions(modelOpts, 'model', [MODEL_PH, ...(res?.result ?? []).map((r) => ({ value: r.model, label: r.model }))])
    setOptions(trimOpts, 'trim', [TRIM_PH])
  } catch {
    // The Blade's call has no error handler: the selects stay as they are.
  }
}

async function onModel() {
  resetTrade('model')
  toggleManual(null, form.model === 'Other', false)
  form.drivetrain = ''
  setOptions(trimOpts, 'trim', [{ value: 'Loading trims...', label: 'Loading trims...' }])
  try {
    const res = await $fetch<{ status?: string; result?: any[] }>('/api/site/trade/trims', {
      query: { period: 0, vehicletype: 'UsedCar', modelyear: Number.parseInt(form.year ?? '', 10), make: form.make, model: form.model },
    })
    const opts: Opt[] = [TRIM_PH]
    if (res?.status === 'success' && Array.isArray(res.result)) {
      currentTrims = res.result
      const seen = new Set<string>()
      for (const item of res.result) {
        const label = String(item.label || item.body || 'Unknown Trim')
        if (seen.has(label)) continue
        seen.add(label)
        opts.push({ value: label, label })
      }
    } else {
      opts.push({ value: '', label: 'No trims found' })
    }
    setOptions(trimOpts, 'trim', opts)
  } catch {
    // No error handler in the Blade either: "Loading trims..." stays.
  }
}

async function onTrim() {
  resetTrade('trim')
  manualTrim.value = form.trim === 'Other'
  clear('manual_trim')
  const vehicle = currentTrims.find((item) => item.label === form.trim)
  if (vehicle) form.trade_ucgvehicleid = String(vehicle.ucgvehicleid ?? '')

  setOptions(dtOpts, 'drivetrain', [{ value: 'Loading...', label: 'Loading...' }])
  try {
    const res = await $fetch<{ status?: string; data?: { drivetype?: string }[] }>('/api/site/trade/drivetrain', {
      query: { vehicleID: form.trade_ucgvehicleid, period: 0, region: 8 },
    })
    const rows = res?.status === 'success' && Array.isArray(res.data) ? res.data : []
    if (rows.length > 0) {
      setOptions(dtOpts, 'drivetrain', [
        { value: '', label: 'Select Drive Train', disabled: true },
        ...rows.map((r) => ({ value: r.drivetype ?? 'Unknown', label: r.drivetype ?? 'Unknown' })),
      ])
      if (rows[0]?.drivetype) form.drivetrain = rows[0].drivetype
    } else {
      setOptions(dtOpts, 'drivetrain', [{ value: '', label: 'No drivetrain data found' }])
    }
  } catch {
    setOptions(dtOpts, 'drivetrain', [{ value: '', label: 'Error loading data' }])
  }
}

function onMileage(e: Event) {
  const el = e.target as HTMLInputElement
  el.value = mileageInput(el.value)
  form.manual_mileage = el.value
}

/** Trade Payoff: helpers.js's price handlers write the field. */
function money(e: Event, fn: (raw: string) => string) {
  const el = e.target as HTMLInputElement
  el.value = fn(el.value)
  form.manual_trade_payoff = el.value
}

function onText(id: string, e: Event) {
  form[id] = (e.target as HTMLInputElement).value
}

const RADIO = 'w-6 h-6 focus:outline-hidden focus:ring-2 rounded-full focus:shadow-lg'
</script>

<template>
  <section :data-section="`step-${step}`" :class="[`step-${step}`, { hidden: current !== step }]" class="flex flex-col gap-4">
    <div class="grid grid-cols-12 gap-4">
      <div class="col-span-full flex flex-col gap-2">
        <h1 class="font-bold text-gray-500 uppercase lg:text-left text-center">TRADE-IN INFORMATION</h1>
      </div>
    </div>
    <div class="col-span-full flex gap-4 items-center lg:justify-start justify-center fin-choice">
      <label class="form-label text-sm font-bold"> Do you have a trade-in? </label>
      <div class="flex items-center gap-4">
        <input
          id="hasTradeInRadioYes"
          type="radio"
          name="trade-in"
          value="Yes"
          :checked="tradeYes"
          :class="RADIO"
          @click="hasTradeIn('Yes')"
        />
        <span class="form-label text-sm font-bold"> Yes </span>
      </div>

      <div class="flex items-center gap-4">
        <input type="radio" name="trade-in" value="No" :checked="!tradeYes" :class="RADIO" @click="hasTradeIn('No')" />
        <span class="form-label text-sm font-bold"> No </span>
      </div>
    </div>
    <div id="hasTradeIn" class="col-span-full flex flex-col gap-2" :class="{ hidden: !tradeYes }">
      <h2 class="col-span-full font-semibold company-primary-base-text lg:text-left text-center fin-h">
        <span>Trade-In<span class="fin-dash"> —</span> Vehicle Information</span>
      </h2>
      <div id="no_vin_no_platenumber" class="">
        <div class="input-container mt-2.5">
          <label class="form-label text-sm font-bold">Year <span class="required-indicator">*</span></label>
          <select id="year" v-model="form.year" name="year" class="mt-2.5 input" :class="{ 'input-error': bad.year }" @change="onYear">
            <option value="" disabled>Select your Vehicle Year</option>
            <option v-for="y in YEARS" :key="y" :value="y">{{ y }}</option>
          </select>
          <span id="year_validation_text" class="validation-text">{{ msg.year }}</span>
        </div>

        <div class="input-container mt-2.5">
          <label class="form-label text-sm font-bold">Make <span class="required-indicator">*</span></label>
          <select
            id="make"
            v-model="form.make"
            name="make"
            class="mt-2.5 input"
            :class="{ 'input-error': bad.make }"
            :disabled="makeDis"
            @change="onMake"
          >
            <option value="" disabled>Select your Vehicle Make</option>
            <option v-for="m in staticmake" :key="m.id" :value="m.title" :data-makeid="m.id">{{ m.title }}</option>
          </select>
          <span id="make_validation_text" class="validation-text">{{ msg.make }}</span>
          <input
            id="manual_make"
            type="text"
            class="mt-2.5 input"
            :class="{ hidden: !manualMake, 'input-error': bad.manual_make }"
            name="manual_make"
            placeholder="Enter Your Vehicle Make"
            :value="form.manual_make"
            @input="onText('manual_make', $event)"
            @keyup="resetTrade('manual_make')"
          />
          <span id="manual_make_validation_text" class="validation-text">{{ msg.manual_make }}</span>
        </div>

        <div class="input-container mt-2.5">
          <label class="form-label text-sm font-bold">Model <span class="required-indicator">*</span></label>
          <select
            id="model"
            v-model="form.model"
            name="model"
            class="mt-2.5 input"
            :class="{ 'input-error': bad.model }"
            :disabled="modelDis"
            @change="onModel"
          >
            <option v-for="o in modelOpts" :key="o.label" :value="o.value" :disabled="o.disabled">{{ o.label }}</option>
          </select>
          <span id="model_validation_text" class="validation-text">{{ msg.model }}</span>
          <input
            id="manual_model"
            type="text"
            class="mt-2.5 input"
            :class="{ hidden: !manualModel, 'input-error': bad.manual_model }"
            name="manual_model"
            placeholder="Enter Your Vehicle Model"
            :value="form.manual_model"
            @input="onText('manual_model', $event)"
            @keyup="resetTrade('manual_model')"
          />
          <span id="manual_model_validation_text" class="validation-text">{{ msg.manual_model }}</span>
        </div>

        <div class="input-container mt-2.5">
          <label class="form-label text-sm font-bold">Trim <span class="required-indicator">*</span></label>
          <select
            id="trim"
            v-model="form.trim"
            name="trim"
            class="mt-2.5 input"
            :class="{ 'input-error': bad.trim }"
            :disabled="trimDis"
            @change="onTrim"
          >
            <option v-for="o in trimOpts" :key="o.label" :value="o.value" :disabled="o.disabled">{{ o.label }}</option>
          </select>
          <span id="trim_validation_text" class="validation-text">{{ msg.trim }}</span>
          <input
            id="manual_trim"
            type="text"
            class="mt-2.5 input"
            :class="{ hidden: !manualTrim, 'input-error': bad.manual_trim }"
            name="manual_trim"
            placeholder="Enter Your Vehicle Trim"
            :value="form.manual_trim"
            @input="onText('manual_trim', $event)"
            @keyup="resetTrade('manual_trim')"
          />
          <span id="manual_trim_validation_text" class="validation-text">{{ msg.manual_trim }}</span>
        </div>

        <div class="input-container mt-2.5">
          <label class="form-label text-sm font-bold">Drivetrain</label>
          <select
            id="drivetrain"
            v-model="form.drivetrain"
            name="drivetrain"
            class="mt-2.5 input"
            :class="{ 'input-error': bad.drivetrain }"
            @change="resetTrade('drivetrain')"
          >
            <option v-for="(o, i) in dtOpts" :key="`${i}-${o.label}`" :value="o.value" :disabled="o.disabled">{{ o.label }}</option>
          </select>
          <span id="drivetrain_validation_text" class="validation-text">{{ msg.drivetrain }}</span>
        </div>

        <div class="input-container mt-2.5">
          <label class="form-label text-sm font-bold">Mileage </label>
          <input
            id="manual_mileage"
            type="text"
            name="mileage"
            class="mt-2.5 input"
            placeholder="Enter your Vehicle Mileage"
            inputmode="numeric"
            :value="form.manual_mileage"
            @input="onMileage"
            @keyup="resetTrade('manual_mileage')"
          />
        </div>

        <div class="input-container mt-2.5">
          <label class="form-label text-sm font-bold">Trade Payoff </label>
          <div class="mt-2.5 group-input">
            <div class="icon">
              <span>$</span>
            </div>
            <input
              id="manual_trade_payoff"
              class="input"
              name="manual_trade_payoff"
              :class="{ 'input-error': bad.manual_trade_payoff }"
              :value="form.manual_trade_payoff"
              @keyup="ctx.reset('manual_trade_payoff')"
              @input="money($event, priceInput)"
              @blur="money($event, priceBlur)"
              @focus="money($event, priceFocus)"
              @keydown="priceKeydown"
            />
          </div>
        </div>

        <div class="input-container mt-2.5">
          <label class="form-label text-sm font-bold">Lien Holder </label>
          <input
            id="manual_lien_holder"
            type="text"
            class="mt-2.5 input"
            name="manual_lien_holder"
            placeholder="Enter Lien Holder"
            :value="form.manual_lien_holder"
            @input="onText('manual_lien_holder', $event)"
          />
        </div>
      </div>
    </div>
  </section>
</template>
