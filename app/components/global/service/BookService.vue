<script setup lang="ts">
/**
 * global/service/form.blade.php (the Book Service mock-up): two badges and the title above one white card holding four
 * titled sections (Service, Vehicle Information, Customer Information, Anything you would like us to know?), then the
 * SMS consent and Request Appointment.
 *
 * The behaviour is the Alpine `serviceSchedule` component (resources/js/template-builder-data/serviceSchedule.js) and
 * the page's jQuery handlers, as Vue state:
 *  - the store select (Multi dealers), the service multi-select (with "Other" asking for the service's name);
 *  - the VIN: DECODE (JD Power, /api/site/trade/decode-vin) swaps the Year / Make / Model fields for the decoded
 *    vehicle, REMOVE swaps them back; typing a VIN clears and locks Make and Model;
 *  - Year unlocks Make, Make unlocks Model and loads the models (/api/site/trade/models), Model loads the trims
 *    (/api/site/trade/trims), Trim loads the drive types (/api/site/trade/drivetrain) and picks the first;
 *  - miles with thousands separators, the phone as (xxx) xxx-xxxx (digits only), the 500-character counter;
 *  - the validation messages after a first submit, re-checked on every change; Request Appointment enabled by the
 *    SMS consent (always disabled on the demo hosts, as the Blade's disabledOption()).
 * It doesn't send anything yet (docs/PORTING.md "Forms are not ported yet").
 *
 * Not ported: the Blade's date / time fields (other_instructions2 / 3, flatpickr) are commented out in the Blade, so
 * :8002 shows no date or time picker; the payload keeps the `other_instructions` the script builds from them.
 */
import ServiceDropdown from './ServiceDropdown.vue'
import UiSwal, { type SwalOptions } from '~/components/ui/Swal.vue'

interface Option {
  id: number | string
  title: string
}

const props = withDefaults(defineProps<{ services?: Option[]; makes?: Option[] }>(), {
  services: () => [],
  makes: () => [],
})

const { company, mainCompany, logoUrl, isSales } = useSite()
const demo = isDemoHost(useRequestURL().hostname)
/** The sales site (:8003): the store select comes after the service (names only), and Request Appointment opens the
 *  "Demo Only" notice instead of sending. */
const demoNotice = ref(false)

const accountType = computed(() => String(company.value.account_type ?? ''))
const isMulti = computed(() => accountType.value === 'Multi')

const locationLabel = (loc: Record<string, any>) => {
  const address = `${loc.street_address ?? ''}, ${loc.city ?? ''} ${String(loc.state ?? '').toUpperCase()} ${loc.zip_code ?? ''}`.trim()
  return `${loc.name ?? ''}${address !== '' ? ` - ${address}` : ''}`
}

// The Year select: this year down to 2007 (the Blade's range(date('Y'), 2007)).
const years = (() => {
  const out: number[] = []
  for (let y = new Date().getFullYear(); y >= 2007; y--) out.push(y)
  return out
})()

// ── The Alpine `serviceSchedule` data ─────────────────────────────────────────────────────────────────────────────
const form = reactive({
  firstname: '',
  lastname: '',
  email: '',
  phone: '',
  store_location: '',
  other_instructions2: '',
  other_instructions3: '',
  vehicle_id: '0',
  year: '',
  hasVINYear: '',
  make: '',
  manual_make: '',
  hasVINMake: '',
  model: '',
  manual_model: '',
  hasVINModel: '',
  hasVINTrim: '',
  hasVINDrivetrain: '',
  miles: '',
  trim: '',
  manual_trim: '',
  drivetrain: '',
  vin_number: '',
  message: '',
  service_id: [] as string[],
  others: '',
})
const vinDecoded = ref(false)
const error = reactive({
  store_location: '',
  service_id: '',
  others: '',
  vin_number: '',
  year: '',
  make: '',
  manual_make: '',
  model: '',
  manual_model: '',
  drivetrain: '',
  miles: '',
  firstname: '',
  lastname: '',
  email: '',
  phone: '',
  message: '',
})
const alreadySubmit = ref(false)
const buttonDisabled = ref(false)
const smsConsent = ref(false)
const showAlert = ref(false)
const forVinAsterisk = ref('')
const forNoVinAsterisk = ref('')
const characterLimit = 500
const swal = ref<SwalOptions | null>(null)

// ── The page's jQuery state: which selects are locked, and the option lists it writes ─────────────────────────────
const makeDisabled = ref(true)
const modelDisabled = ref(true)
const models = ref<string[]>([])
type ListState = 'idle' | 'loading' | 'ready' | 'empty' | 'error'
const trims = ref<string[]>([])
const trimState = ref<ListState>('idle')
let currentTrims: { label?: string; ucgvehicleid?: string | number }[] = []
let currentVehicleId: string | number = ''
const drivetrains = ref<string[]>([])
const drivetrainState = ref<ListState>('idle') // idle = the Blade's AWD / 4WD / FWD / RWD
const decoding = ref(false)

/** Validates once a submit was tried; returns 1 when something is wrong, 0 when the form can be sent. */
function onchangeFunction(disableAlert: boolean): number | undefined {
  if (!alreadySubmit.value) return undefined
  error.service_id = ''
  error.others = ''
  error.vin_number = ''
  error.year = ''
  error.make = ''
  error.model = ''
  error.drivetrain = ''
  error.miles = ''
  error.firstname = ''
  error.lastname = ''
  error.email = ''
  error.store_location = ''
  error.phone = ''

  if (form.service_id.length <= 0) error.service_id = 'Please select your desired service'
  if (form.others === '' && form.service_id.includes('Other')) error.others = 'Please input your desired service'

  if (form.vin_number === '' && form.year === '' && form.make === '' && form.model === '') {
    error.year = 'Please enter your vehicle year'
    error.make = 'Please enter your vehicle make'
    error.model = 'Please enter your vehicle model'
  } else if (form.vin_number !== '' && !vinDecoded.value) {
    error.vin_number =
      form.vin_number.length !== 17 ? 'VIN must be exactly 17 characters' : 'Please decode the VIN first before submitting'
  } else {
    if (form.year === '') error.year = 'Please enter your vehicle year'
    if (form.make === '') error.make = 'Please enter your vehicle make'
    if (form.model === '') error.model = 'Please enter your vehicle model'
  }
  if (form.miles === '') error.miles = 'Please enter your vehicle miles'
  if (form.firstname === '') error.firstname = 'Please enter your first name'
  if (form.lastname === '') error.lastname = 'Please enter your last name'
  if (form.email === '') error.email = 'Please enter your email address'
  if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(form.email)) error.email = 'The email address is not valid'
  if (isMulti.value && form.store_location === '') error.store_location = 'Please select store location'
  if (form.phone === '') error.phone = 'Please enter your phone number'
  else if (form.phone.replace(/\D/g, '').length < 10) error.phone = 'Phone Number must be 10 digits'
  error.message = form.message.length > characterLimit ? `Message cannot exceed ${characterLimit} characters` : ''

  if (disableAlert) return undefined
  const common =
    error.service_id === '' &&
    error.others === '' &&
    error.vin_number === '' &&
    error.miles === '' &&
    error.firstname === '' &&
    error.lastname === '' &&
    error.email === '' &&
    (!isMulti.value || error.store_location === '') &&
    error.phone === '' &&
    error.message === ''
  if (vinDecoded.value) return common ? 0 : 1
  return common && error.year === '' && error.make === '' && error.model === '' ? 0 : 1
}

watch(
  () => form.service_id,
  () => onchangeFunction(true),
  { deep: true },
)

function isVINRequired(value: boolean) {
  forNoVinAsterisk.value = ''
  forVinAsterisk.value = ''
  if (form.vin_number && value) {
    forVinAsterisk.value = '*'
    form.year = ''
    form.make = ''
    form.model = ''
    form.trim = ''
    form.drivetrain = ''
    onchangeFunction(true)
    return
  }
  if (!value) {
    forNoVinAsterisk.value = '*'
    form.vin_number = ''
    onchangeFunction(true)
  }
}

// ── Vehicle fields ──────────────────────────────────────────────────────────────────────────────────────────────
function onVinKeyup() {
  isVINRequired(true)
  // The page's jQuery keyup: Make and Model locked and cleared, Trim and Drivetrain cleared.
  makeDisabled.value = true
  modelDisabled.value = true
  form.make = ''
  form.model = ''
  form.trim = ''
  form.drivetrain = ''
}

async function loadModels(make: string, year: string) {
  try {
    const res = await $fetch<{ result?: { model?: string }[] }>('/api/site/trade/models', {
      query: { make, modelyear: String(parseInt(year, 10)), period: 0, vehicletype: 'UsedCar' },
    })
    models.value = (res?.result ?? []).map((r) => String(r?.model ?? ''))
    trims.value = []
    trimState.value = 'idle'
  } catch {
    // The Blade's call has no error handler: the lists stay as they are.
  }
}

function onYearChange() {
  form.model = ''
  form.make = ''
  form.trim = ''
  form.drivetrain = ''
  isVINRequired(false)
  makeDisabled.value = false
  modelDisabled.value = true
  models.value = []
  trims.value = []
  trimState.value = 'idle'
}

function onMakeChange() {
  form.model = ''
  form.trim = ''
  form.drivetrain = ''
  isVINRequired(false)
  modelDisabled.value = false
  models.value = []
  const make = props.makes.find((m) => m.title === form.make)
  if (make?.title) loadModels(make.title, form.year)
}

async function onModelChange() {
  form.trim = ''
  form.drivetrain = ''
  isVINRequired(false)
  const year = String(parseInt(form.year, 10))
  const { make, model } = form
  trimState.value = 'loading'
  try {
    const res = await $fetch<{ status?: string; result?: { label?: string; body?: string; ucgvehicleid?: string | number }[] }>(
      '/api/site/trade/trims',
      { query: { period: 0, vehicletype: 'UsedCar', modelyear: year, make, model } },
    )
    if (res?.status === 'success' && Array.isArray(res.result)) {
      currentTrims = res.result
      const seen = new Set<string>()
      for (const item of res.result) seen.add(item.label || parseTrimFromBody(item.body || 'Unknown Trim'))
      trims.value = [...seen]
      trimState.value = 'ready'
    } else {
      trims.value = []
      trimState.value = 'empty'
    }
  } catch {
    // The Blade's call has no error handler: "Loading trims..." stays.
  }
}

async function onTrimChange() {
  const vehicle = currentTrims.find((t) => t.label === form.trim)
  if (vehicle) currentVehicleId = vehicle.ucgvehicleid ?? ''
  drivetrainState.value = 'loading'
  form.drivetrain = ''
  try {
    const res = await $fetch<{ status?: string; data?: { drivetype?: string | null }[] }>('/api/site/trade/drivetrain', {
      query: { vehicleID: String(currentVehicleId), period: 0, region: 8 },
    })
    if (res?.status === 'success' && (res.data?.length ?? 0) > 0) {
      drivetrains.value = res.data!.map((v) => v.drivetype ?? 'Unknown')
      drivetrainState.value = 'ready'
      if (res.data![0]?.drivetype) form.drivetrain = res.data![0].drivetype
    } else {
      drivetrainState.value = 'empty'
    }
  } catch {
    drivetrainState.value = 'error'
  }
}

function parseTrimFromBody(body: string): string {
  const prefixRegex = /^(Sedan|Coupe|Convertible|Utility|Hatchback|Truck|Van|Wagon)\s+\dD\s+/i
  const drivetrainRegex = /\b(AWD|FWD|RWD|4WD)\b/gi
  const engineRegex = /\d+(\.\d+)?L\s+[A-Z0-9]+\s*(Turbo|Supercharged|Hybrid)?(\s*(Auto|Manual|CVT|Hybrid))?/gi
  const out = body.replace(prefixRegex, '').replace(drivetrainRegex, '').replace(engineRegex, '').replace(/\s+/g, ' ')
  return out.trim() || 'Base'
}

// ── VIN decode ──────────────────────────────────────────────────────────────────────────────────────────────────
async function isVINdecodedFunction() {
  if (decoding.value) return
  if (!vinDecoded.value) {
    await decodeVIN()
  } else {
    form.vin_number = ''
    vinDecoded.value = false
  }
}

async function decodeVIN() {
  if (decoding.value) return
  error.vin_number = ''
  if (!form.vin_number || form.vin_number.length !== 17) {
    error.vin_number = 'VIN must be exactly 17 characters'
    swal.value = { icon: 'error', title: 'Invalid VIN!', text: 'VIN must be exactly 17 characters', confirmButtonText: 'Continue' }
    return
  }
  decoding.value = true
  try {
    const res = await $fetch<{ status?: string; data?: Record<string, any> }>('/api/site/trade/decode-vin', {
      query: { vin: form.vin_number },
    })
    if (res?.status === 'success' && res.data) {
      const d = res.data
      form.hasVINYear = d.modelyear || ''
      form.hasVINMake = d.make || ''
      form.hasVINModel = d.model || ''
      form.hasVINTrim = d.trim || ''
      form.hasVINDrivetrain = d.drivetype || ''
      swal.value = { icon: 'success', title: 'Success!', text: 'VIN successfully decoded', confirmButtonText: 'Continue' }
      vinDecoded.value = true
    } else {
      error.vin_number = 'Please enter a valid VIN'
      vinDecoded.value = false
    }
  } catch {
    error.vin_number = 'Failed to decode VIN. Please try again.'
    vinDecoded.value = false
  } finally {
    decoding.value = false
  }
}

const decodeLabel = computed(() => (decoding.value ? 'DECODING...' : vinDecoded.value ? 'REMOVE' : 'DECODE'))

// ── Input formatting ────────────────────────────────────────────────────────────────────────────────────────────
/** helpers.js mileageInputEvent: thousands separators, anything else cleared. */
function onMilesInput(e: Event) {
  const el = e.target as HTMLInputElement
  const val = el.value.replace(/,/g, '')
  el.value = !Number.isNaN(Number(val)) && val !== '' ? Number(val).toLocaleString() : ''
  form.miles = el.value
}

/** serviceSchedule.formatPhone: (xxx) xxx-xxxx. */
function onPhoneInput(e: Event) {
  const el = e.target as HTMLInputElement
  const input = el.value.replace(/\D/g, '').substring(0, 10)
  const zip = input.substring(0, 3)
  const middle = input.substring(3, 6)
  const last = input.substring(6, 10)
  if (input.length > 6) form.phone = `(${zip}) ${middle}-${last}`
  else if (input.length > 3) form.phone = `(${zip}) ${middle}`
  else if (input.length > 0) form.phone = `(${zip}`
  else form.phone = ''
  el.value = form.phone
  onchangeFunction(true)
}

/** The Blade's inline enforceFormat: only digits and editing / navigation keys in the phone field. */
function onPhoneKeydown(e: KeyboardEvent) {
  const key = e.keyCode
  const numeric = (key >= 48 && key <= 57) || (key >= 96 && key <= 105)
  const modifier =
    e.shiftKey === true ||
    key === 35 ||
    key === 36 ||
    key === 8 ||
    key === 9 ||
    key === 13 ||
    key === 46 ||
    (key > 36 && key < 41) ||
    ((e.ctrlKey === true || e.metaKey === true) && [65, 67, 86, 88, 90].includes(key))
  if (!numeric && !modifier) e.preventDefault()
}

// ── Submit ──────────────────────────────────────────────────────────────────────────────────────────────────────
function submit() {
  alreadySubmit.value = true
  if (onchangeFunction(false) !== 0) return

  // The script's date / time from the (commented-out) date and time fields: "YYYY-MM-DD hh:mm AM".
  const parts = form.other_instructions2.split('-')
  const otherInstructions = `${parts[2]}-${parts[0]}-${parts[1]} ${form.other_instructions3}`

  const decoded = vinDecoded.value
  const payload: Record<string, unknown> = {
    firstname: form.firstname,
    lastname: form.lastname,
    email: form.email,
    phone: form.phone,
    other_instructions: otherInstructions,
    vehicle_id: form.vehicle_id,
    year: decoded ? form.hasVINYear : form.year,
    make: decoded ? form.hasVINMake : form.make === 'Other' ? form.manual_make : form.make,
    model: decoded ? form.hasVINModel : form.model === 'Other' ? form.manual_model : form.model,
    miles: form.miles,
    vin_number: form.vin_number,
    message: form.message,
    service_id: [...form.service_id],
    others: form.others,
    // As the script: a trim of "Other" sends the manual model.
    trim: decoded ? form.hasVINTrim : form.trim === 'Other' ? form.manual_model : form.trim,
    drivetrain: decoded ? form.hasVINDrivetrain : form.drivetrain,
  }
  if (isMulti.value) payload.location_id = form.store_location

  // TODO(forms): POST /frontend/service_appointment → website/forms/book-service with `payload` (see data-map.md
  // "Form endpoints"); while it's pending set buttonDisabled (Requesting...), then on is_success == '1' set showAlert,
  // else show the API's message in an error pop-up.
  void payload
}
</script>

<template>
  <div class="svc-page">
    <div class="svc-badges">
      <UiPagePill icon="checkmark-circle-outline">BOOK SERVICE</UiPagePill>
      <UiPagePill icon="shield-checkmark-outline">SCHEDULE NOW</UiPagePill>
    </div>
    <h1 class="svc-title">Request a Service Appointment</h1>
    <div>
      <div id="serviceSchedule">
        <div class="svc-card">
          <section class="svc-sec">
            <h2 class="svc-h">
              <span class="svc-ico"><Icon name="ion:construct-outline" aria-hidden="true" /></span>Service
            </h2>
            <div class="grid grid-cols-12 gap-3">
              <div v-if="isMulti && !isSales" class="col-span-12 md:col-span-12 lg:col-span-12">
                <label class="form-label text-sm font-bold my-2.5">Store Location: <span class="required-indicator">*</span></label>
                <select
                  id="store_location"
                  v-model="form.store_location"
                  :class="{ 'input-error': error.store_location }"
                  required
                  name="store_location"
                  class="mt-2.5 input"
                  @change="onchangeFunction(true)"
                >
                  <option value="" disabled selected>Select Store Location</option>
                  <option v-for="loc in mainCompany" :key="loc.id" :value="String(loc.id)">{{ locationLabel(loc) }}</option>
                </select>
                <div v-show="error.store_location" class="text-xs text-red-500">{{ error.store_location }}</div>
              </div>

              <div class="col-span-12 md:col-span-12 lg:col-span-12">
                <label class="form-label text-sm font-bold my-2.5">Pick your desired service: <span class="required-indicator">*</span></label>

                <div :class="error.service_id ? 'error' : ''">
                  <ServiceDropdown
                    v-model="form.service_id"
                    :services="services"
                    placeholder="Please Select Your Desired Service"
                  />
                </div>

                <div v-show="error.service_id" class="text-xs text-red-500">{{ error.service_id }}</div>

                <div :class="{ hidden: !form.service_id.includes('Other') }">
                  <label class="form-label text-sm font-bold my-2.5">Please Input your desired service <span class="required-indicator">*</span></label>
                  <input
                    id="others"
                    v-model="form.others"
                    :class="{ 'input-error': error.others }"
                    name="others"
                    class="mt-2.5 input"
                    placeholder="Please input your desired service"
                    type="text"
                    @keyup="onchangeFunction(true)"
                  />
                  <div v-show="error.others" class="text-xs text-red-500">{{ error.others }}</div>
                </div>
              </div>

              <div v-if="isMulti && isSales" class="col-span-12 md:col-span-12 lg:col-span-12">
                <label class="form-label text-sm font-bold my-2.5">Store Location: <span class="required-indicator">*</span></label>
                <select
                  id="store_location"
                  v-model="form.store_location"
                  :class="{ 'input-error': error.store_location }"
                  required
                  name="store_location"
                  class="mt-2.5 input"
                  @change="onchangeFunction(true)"
                >
                  <option value="" disabled selected>Select Store Location</option>
                  <option v-for="loc in mainCompany" :key="loc.id" :value="String(loc.id)">{{ loc.name }}</option>
                </select>
                <div v-show="error.store_location" class="text-xs text-red-500">{{ error.store_location }}</div>
              </div>
            </div>
          </section>

          <section class="svc-sec">
            <h2 class="svc-h">
              <span class="svc-ico"><Icon name="ion:car-sport-outline" aria-hidden="true" /></span>Vehicle Information
            </h2>
            <div class="grid grid-cols-12 gap-3">
              <div class="col-span-12 md:col-span-12 lg:col-span-12">
                <label class="form-label text-sm font-bold my-2.5">VIN <span class="required-indicator">{{ forVinAsterisk }}</span></label>
                <div class="w-full relative mt-2.5">
                  <input
                    id="vin_number"
                    v-model="form.vin_number"
                    type="text"
                    required
                    :disabled="decoding || vinDecoded"
                    :class="{ 'input-error': error.vin_number }"
                    class="input"
                    name="vin_number"
                    placeholder="VIN"
                    @keyup="onVinKeyup"
                  />

                  <div
                    v-show="form.vin_number"
                    id="decode-button"
                    class="select-none absolute px-3 right-0 top-0 cursor-pointer h-full flex items-center justify-center text-blue-600 font-bold"
                    @click="isVINdecodedFunction()"
                  >
                    {{ decodeLabel }}
                  </div>

                  <input id="vin_decoded" type="hidden" name="vin_decoded" :value="vinDecoded ? 'true' : ''" />
                </div>
                <div v-show="error.vin_number" class="text-xs text-red-500">{{ error.vin_number }}</div>
              </div>

              <div id="noVIN" class="col-span-12 grid grid-cols-12 gap-3" :class="{ hidden: vinDecoded }">
                <div class="col-span-12 md:col-span-4 lg:col-span-4">
                  <label class="form-label text-sm font-bold my-2.5">Year <span class="required-indicator">{{ forNoVinAsterisk }}</span></label>
                  <select
                    id="year"
                    v-model="form.year"
                    :class="{ 'input-error': error.year }"
                    required
                    name="year"
                    class="mt-2.5 input"
                    @change="onYearChange"
                  >
                    <option value="" selected disabled>Select your Vehicle Year</option>
                    <option v-for="y in years" :key="y" :value="String(y)">{{ y }}</option>
                  </select>

                  <div v-show="error.year" class="text-xs text-red-500">{{ error.year }}</div>
                </div>

                <div class="col-span-12 md:col-span-4 lg:col-span-4">
                  <label class="form-label text-sm font-bold my-2.5">Make <span class="required-indicator">{{ forNoVinAsterisk }}</span></label>
                  <select
                    id="make"
                    v-model="form.make"
                    :class="{ 'input-error': error.make }"
                    required
                    name="make"
                    class="mt-2.5 input"
                    :disabled="makeDisabled"
                    @change="onMakeChange"
                  >
                    <option value="" selected>Select your Vehicle Make</option>
                    <option v-for="m in makes" :key="m.id" :value="m.title" :data-makeid="m.id">{{ m.title }}</option>
                  </select>

                  <div v-show="error.make" class="text-xs text-red-500">{{ error.make }}</div>

                  <div class="mt-2" :class="{ hidden: form.make !== 'Other' }">
                    <input
                      id="manual_make"
                      v-model="form.manual_make"
                      class="input"
                      :class="{ 'input-error': error.manual_make }"
                      type="text"
                      name="manual_make"
                      placeholder="Enter Your Vehicle Make"
                      @input="onchangeFunction(true)"
                    />
                    <div v-show="error.manual_make" class="text-xs text-red-500">{{ error.manual_make }}</div>
                  </div>
                </div>

                <div class="col-span-12 md:col-span-4 lg:col-span-4">
                  <label class="form-label text-sm font-bold my-2.5">Model <span class="required-indicator">{{ forNoVinAsterisk }}</span></label>

                  <select
                    id="model"
                    v-model="form.model"
                    :class="{ 'input-error': error.model }"
                    required
                    name="model"
                    class="mt-2.5 input"
                    :disabled="modelDisabled"
                    @change="onModelChange"
                  >
                    <option value="" disabled selected>Select your Vehicle Model</option>
                    <option v-for="(m, i) in models" :key="`${m}-${i}`" :value="m">{{ m }}</option>
                  </select>
                  <div v-show="error.model" class="text-xs text-red-500">{{ error.model }}</div>

                  <div class="mt-2" :class="{ hidden: form.model !== 'Other' }">
                    <input
                      id="manual_model"
                      v-model="form.manual_model"
                      class="input"
                      :class="{ 'input-error': error.manual_model }"
                      type="text"
                      name="manual_model"
                      placeholder="Enter Your Vehicle Model"
                      @input="onchangeFunction(true)"
                    />
                    <div v-show="error.manual_model" class="text-xs text-red-500">{{ error.manual_model }}</div>
                  </div>
                </div>

                <div class="col-span-12 md:col-span-4 lg:col-span-4">
                  <label class="form-label text-sm font-bold my-2.5">Trim</label>
                  <select id="trim" v-model="form.trim" name="trim" class="mt-2.5 input" @change="onTrimChange">
                    <option v-if="trimState === 'loading'" value="">Loading trims...</option>
                    <template v-else>
                      <option value="" disabled selected>Select your Vehicle Trim</option>
                      <option v-for="t in trims" :key="t" :value="t">{{ t }}</option>
                      <option v-if="trimState === 'empty'" value="">No trims found</option>
                    </template>
                  </select>

                  <div class="mt-2" :class="{ hidden: form.trim !== 'Other' }">
                    <input
                      id="manual_trim"
                      v-model="form.manual_trim"
                      class="input"
                      type="text"
                      name="manual_trim"
                      placeholder="Enter Your Vehicle Trim"
                    />
                  </div>
                </div>

                <div class="col-span-12 md:col-span-4 lg:col-span-4">
                  <label class="form-label text-sm font-bold my-2.5">Drivetrain</label>
                  <select id="drivetrain" v-model="form.drivetrain" required name="drivetrain" class="mt-2.5 input">
                    <option v-if="drivetrainState === 'loading'" value="">Loading...</option>
                    <option v-else-if="drivetrainState === 'empty'" value="">No drivetrain data found</option>
                    <option v-else-if="drivetrainState === 'error'" value="">Error loading data</option>
                    <template v-else-if="drivetrainState === 'ready'">
                      <option value="" disabled selected>Select Drive Train</option>
                      <option v-for="(d, i) in drivetrains" :key="`${d}-${i}`" :value="d">{{ d }}</option>
                    </template>
                    <template v-else>
                      <option value="" disabled selected>Select your Vehicle Drivetrain</option>
                      <option>AWD</option>
                      <option>4WD</option>
                      <option>FWD</option>
                      <option>RWD</option>
                    </template>
                  </select>
                </div>

                <div class="col-span-12 md:col-span-4 lg:col-span-4">
                  <label class="form-label text-sm font-bold my-2.5">Miles <span class="required-indicator">*</span></label>
                  <input
                    id="miles1"
                    :value="form.miles"
                    :class="{ 'input-error': error.miles }"
                    name="miles"
                    class="mt-2.5 input"
                    placeholder="Miles"
                    @input="onMilesInput"
                    @keyup="onchangeFunction(true)"
                  />
                  <div v-show="error.miles" class="text-xs text-red-500">{{ error.miles }}</div>
                </div>
              </div>

              <div id="hasVIN" class="col-span-12 grid grid-cols-12 gap-3" :class="{ hidden: !vinDecoded }">
                <div class="col-span-12 md:col-span-4 lg:col-span-4">
                  <label class="form-label text-sm font-bold my-2.5">Year</label>
                  <input id="hasVINYear" v-model="form.hasVINYear" class="mt-2.5 input" name="hasVINYear" type="text" disabled />
                </div>

                <div class="col-span-12 md:col-span-4 lg:col-span-4">
                  <label class="form-label text-sm font-bold my-2.5">Make</label>
                  <input id="hasVINMake" v-model="form.hasVINMake" class="mt-2.5 input" name="hasVINMake" type="text" disabled />
                </div>

                <div class="col-span-12 md:col-span-4 lg:col-span-4">
                  <label class="form-label text-sm font-bold my-2.5">Model</label>
                  <input id="hasVINModel" v-model="form.hasVINModel" class="mt-2.5 input" name="hasVINModel" type="text" disabled />
                </div>

                <!-- The Blade labels the decoded trim "Model". -->
                <div class="col-span-12 md:col-span-4 lg:col-span-4">
                  <label class="form-label text-sm font-bold my-2.5">Model</label>
                  <input id="hasVINTrim" v-model="form.hasVINTrim" class="mt-2.5 input" name="hasVINTrim" type="text" disabled />
                </div>

                <div class="col-span-12 md:col-span-4 lg:col-span-4">
                  <label class="form-label text-sm font-bold my-2.5">Drivetrain</label>
                  <select id="hasVINDrivetrain" v-model="form.hasVINDrivetrain" required name="hasVINDrivetrain" class="mt-2.5 input">
                    <option value="" disabled selected>Select your Vehicle Drivetrain</option>
                    <option>AWD</option>
                    <option>4WD</option>
                    <option>FWD</option>
                    <option>RWD</option>
                  </select>
                </div>

                <div class="col-span-12 md:col-span-4 lg:col-span-4">
                  <label class="form-label text-sm font-bold my-2.5">Miles <span class="required-indicator">*</span></label>
                  <input
                    id="miles2"
                    :value="form.miles"
                    :class="{ 'input-error': error.miles }"
                    name="miles"
                    class="mt-2.5 input"
                    placeholder="Miles"
                    @input="onMilesInput"
                    @keyup="onchangeFunction(true)"
                  />
                  <div v-show="error.miles" class="text-xs text-red-500">{{ error.miles }}</div>
                </div>
              </div>
            </div>
          </section>

          <section class="svc-sec">
            <h2 class="svc-h">
              <span class="svc-ico"><Icon name="ion:person-outline" aria-hidden="true" /></span>Customer Information
            </h2>
            <div class="grid grid-cols-12 gap-3">
              <div class="col-span-12 md:col-span-6 lg:col-span-6">
                <label class="form-label text-sm font-bold my-2.5">First Name <span class="required-indicator">*</span></label>
                <input id="vehicle_id" v-model="form.vehicle_id" type="hidden" name="vehicle_id" />
                <input
                  id="firstname"
                  v-model="form.firstname"
                  :class="{ 'input-error': error.firstname }"
                  required
                  class="mt-2.5 input"
                  name="firstname"
                  placeholder="David"
                  aria-label="First Name..."
                  type="text"
                  maxlength="100"
                  @keyup="onchangeFunction(true)"
                />
                <div v-show="error.firstname" class="text-xs text-red-500">{{ error.firstname }}</div>
              </div>
              <div class="col-span-12 md:col-span-6 lg:col-span-6">
                <label class="form-label text-sm font-bold my-2.5">Last Name <span class="required-indicator">*</span></label>
                <input
                  id="lastname"
                  v-model="form.lastname"
                  type="text"
                  :class="{ 'input-error': error.lastname }"
                  required
                  class="mt-2.5 input"
                  name="lastname"
                  placeholder="Smith"
                  aria-label="Last Name..."
                  maxlength="100"
                  @keyup="onchangeFunction(true)"
                />
                <div v-show="error.lastname" class="text-xs text-red-500">{{ error.lastname }}</div>
              </div>

              <div class="col-span-12 md:col-span-6 lg:col-span-6">
                <label class="form-label text-sm font-bold my-2.5">Email Address <span class="required-indicator">*</span></label>
                <input
                  id="email"
                  v-model="form.email"
                  type="email"
                  :class="{ 'input-error': error.email }"
                  required
                  class="mt-2.5 input"
                  name="email"
                  placeholder="david.smith@email.com"
                  @keyup="onchangeFunction(true)"
                />
                <div v-show="error.email" class="text-xs text-red-500">{{ error.email }}</div>
              </div>

              <div class="col-span-12 md:col-span-6 lg:col-span-6">
                <label class="form-label text-sm font-bold my-2.5">Phone <span class="required-indicator">*</span></label>
                <input
                  id="phone"
                  :value="form.phone"
                  :class="{ 'input-error': error.phone }"
                  type="text"
                  maxlength="16"
                  placeholder="(xxx) xxx - xxxx"
                  name="phone"
                  required
                  class="mt-2.5 input"
                  @keydown="onPhoneKeydown"
                  @input="onPhoneInput"
                />
                <div v-show="error.phone" class="text-xs text-red-500">{{ error.phone }}</div>
              </div>
            </div>
          </section>

          <section class="svc-sec">
            <h2 class="svc-h">
              <span class="svc-ico"><Icon name="ion:document-text-outline" aria-hidden="true" /></span>Anything you would
              like us to know?
            </h2>
            <div class="grid grid-cols-12 gap-3">
              <div class="col-span-12 md:col-span-12 lg:col-span-12">
                <textarea
                  id="message"
                  v-model="form.message"
                  placeholder="Please describe your request or any details we should know."
                  name="message"
                  class="mt-2.5 input"
                  maxlength="500"
                  :class="{ 'border-red-500': error.message, 'focus:border-red-500': error.message }"
                  @keyup="onchangeFunction(true)"
                />
                <div class="flex justify-between items-center mt-1">
                  <div class="text-xs text-gray-500 text-left">
                    <span>{{ form.message.length }}</span>/500 characters
                  </div>
                  <div v-show="error.message" class="text-xs text-red-500">{{ error.message }}</div>
                </div>
              </div>
            </div>
          </section>

          <!-- SMS consent + Submit button (Submit enabled only once consent is checked) -->
          <div>
            <div class="pt-5">
              <UiSmsConsent v-model="smsConsent" />
            </div>

            <div class="mt-3 flex items-center justify-end">
              <button
                v-if="isSales"
                class="flex-1 lg:flex-none flex justify-center px-5 py-3 company-primary-base-background rounded-sm text-white focus:outline-hidden focus:ring-2 focus:ring-pink-300 disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="!smsConsent"
                @click.prevent="smsConsent && (demoNotice = true)"
              >
                <Icon name="ion:calendar-outline" aria-hidden="true" /> Request Appointment
              </button>
              <button
                v-else-if="!buttonDisabled"
                class="flex-1 lg:flex-none flex justify-center px-5 py-3 company-primary-base-background rounded-sm text-white focus:outline-hidden focus:ring-2 focus:ring-pink-300 disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="demo || !smsConsent"
                @click.prevent="smsConsent && !demo && submit()"
              >
                <Icon name="ion:calendar-outline" aria-hidden="true" /> Request Appointment
              </button>
              <button
                v-else
                disabled
                class="flex-1 lg:flex-none flex justify-center px-5 py-3 bg-gray-400 cursor-not-allowed rounded-sm text-white items-center gap-2 focus:outline-hidden focus:ring-2 focus:ring-pink-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Icon name="ion:reload-outline" class="animate-spin" /> Requesting...
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <UiAlertModal
      :show="showAlert"
      title="Thank You!"
      description="Book Service Has Been Submitted Successfully"
      :logo-path="logoUrl()"
      bottom-description="A representative from the dealership will contact you shortly"
    />
    <UiSwal v-model="swal" />
    <UiDemoNoticeModal v-if="isSales" v-model="demoNotice" />
  </div>
</template>

<style>
/* The Laravel page's body rules: the tinted page background, and on a tall window the page fills it with the footer
   at the bottom. The Laravel body holds the nav, the page and the footer; here the layout's wrapper does. */
body:has(.svc-page) {
  background: color-mix(in srgb, var(--company-primary-base, #6d28d9) 3%, #f6f6f8) !important;
}

[data-template]:has(> .svc-page) {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

[data-template]:has(> .svc-page) > .svc-page {
  width: 100%; /* auto side margins would shrink it in the flex column */
  margin-bottom: auto;
}

[data-template]:has(> .svc-page) > footer {
  flex-shrink: 0;
}
</style>

<style scoped>
.svc-page :invalid {
  color: rgba(107, 114, 128, 1);
}

/* frontend-tw.css (every Laravel page): the .input base and the service dropdown's error border. */
.input {
  appearance: none;
  border: 1px solid #6b7280;
  border-radius: 0.25rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  color: #374151;
  line-height: 1.25;
  font-size: 16px !important;
}

.input:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
}

.input.input-error {
  border-color: #ef4444;
}

.input:disabled {
  background-color: #d1d5db;
  cursor: not-allowed !important;
}

.error :deep(.seachable-dropdown .seachable-dropdown-button) {
  border-color: #ef4444;
}

/* The Laravel build's Tailwind 3 palette (hex) for the colour classes on this page; Tailwind 4's oklch shades differ. */
.svc-page .text-red-500 {
  color: #ef4444;
}

.svc-page .text-gray-500,
.svc-page :deep(.text-gray-500) {
  color: #6b7280;
}

.svc-page .text-blue-600 {
  color: #2563eb;
}

.svc-page .bg-gray-400 {
  background-color: #9ca3af;
}

.svc-page :deep(.bg-gray-50) {
  background-color: #f9fafb;
}

.svc-page :deep(.border-gray-500) {
  border-color: #6b7280;
}

.svc-page :deep(.ring-blue-400) {
  --tw-ring-color: #60a5fa;
}

.svc-page button:focus {
  --tw-ring-color: #f9a8d4;
}

.svc-page :deep(input[type='checkbox']) {
  color: #2563eb;
}

.svc-page :deep(input[type='checkbox']:focus) {
  --tw-ring-color: #2563eb;
}

/* ══ The Book Service mock-up (layout only): every colour derives from --company-primary-base. ══ */
.svc-page {
  --svc-p: var(--company-primary-base, #6d28d9);
  --svc-ink: #16131f;
  --svc-muted: #6b6880;
  --svc-line: #e7e7ec;
  max-width: none;
  margin: 0 auto;
  /* 36px over and 64px under, the content on the header's and footer's 1280px column, 16px each side on a phone. */
  padding: 36px max(16px, calc((100% - 1280px) / 2)) 64px;
  font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
  color: var(--svc-ink);
}

.svc-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

/* The pill itself is the page-pill component (UiPagePill): one class and look on every page. */

.svc-page .svc-title {
  margin: 0.75rem 0 1rem;
  font-family: 'Outfit', 'Inter', sans-serif;
  font-size: 3rem;
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.02em;
  color: var(--svc-ink);
}

.svc-page .svc-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 2rem;
  border-radius: 1.25rem;
  background: #fff;
  border: 1px solid var(--svc-line);
  box-shadow: 0 18px 40px -28px rgba(16, 12, 40, 0.35), 0 1px 2px rgba(16, 12, 40, 0.04);
}

.svc-page .svc-sec {
  padding: 1.25rem 1.5rem 1.5rem;
  border-radius: 1rem;
  border: 1px solid var(--svc-line);
  background: #fff;
}

.svc-page .svc-h {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0 0 0.5rem;
  font-family: 'Outfit', 'Inter', sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--svc-ink);
}

.svc-page .svc-ico {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  font-size: 1.1rem;
  /* The dealer's primary, as the Contact Us / About Us icon tiles (.lp-ico): the icon in it, on a pale tint. */
  color: var(--svc-p);
  background: color-mix(in srgb, var(--svc-p) 8%, #ffffff);
  border: 1px solid color-mix(in srgb, var(--svc-p) 16%, #ffffff);
}

.svc-page .form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--svc-ink);
}

.svc-page .required-indicator {
  color: #dc2626;
}

.svc-page .input,
.svc-page :deep(.seachable-dropdown-button) {
  width: 100%;
  height: 3rem;
  padding: 0 1rem;
  border-radius: 0.625rem;
  font-size: 0.9375rem;
  color: var(--svc-ink);
  background-color: #fff;
  border: 1.5px solid #d9d8e0 !important;
}

.svc-page textarea.input {
  height: 7rem;
  padding: 0.75rem 1rem;
}

.svc-page .input:focus {
  outline: none;
  border-color: var(--svc-p) !important;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--svc-p) 18%, transparent);
}

/* A locked select (Make until a Year…): grey, with a lock. */
.svc-page select.input:disabled {
  color: #9a98a8;
  cursor: not-allowed;
  border-color: var(--svc-line) !important;
  background: #f6f6f8
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239a98a8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='5' y='11' width='14' height='10' rx='2'/%3E%3Cpath d='M8 11V7a4 4 0 0 1 8 0v4'/%3E%3C/svg%3E")
    no-repeat right 1rem center / 1rem;
  appearance: none;
}

.svc-page .input.input-error {
  border-color: #dc2626 !important;
}

/* Request Appointment: the primary (pale until the SMS consent is ticked). */
.svc-page .svc-card button.company-primary-base-background {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  flex: none;
  padding: 0.85rem 1.75rem;
  border-radius: 0.875rem;
  font-size: 1rem;
  font-weight: 700;
  background: color-mix(in srgb, var(--svc-p) 75%, #ffffff);
  box-shadow: 0 12px 24px -14px color-mix(in srgb, var(--svc-p) 80%, transparent);
}

.svc-page .svc-card button.company-primary-base-background:disabled {
  opacity: 0.55;
}

@media (max-width: 640px) {
  .svc-page .svc-title {
    font-size: 2.25rem;
  }

  .svc-page .svc-card {
    padding: 1rem;
  }

  .svc-page .svc-sec {
    padding: 1rem;
  }
}
</style>
