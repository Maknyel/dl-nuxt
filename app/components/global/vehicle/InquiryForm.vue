<script setup lang="ts">
/**
 * The "I'm interested" form with its trade-in step, shared by the inventory list's pop-up and the vehicle page.
 *  - variant 'panel': the vehicle page's form under the price (Laravel global/cars/vdp-contact-form.blade.php: an
 *    inline Alpine form + the bundle's `tradeIn`). Errors show on Submit and clear as the field is typed in.
 *  - variant 'modal' (default): the pop-up's white card (Laravel global/show/form.blade.php: the bundle's
 *    `im_interested` + its jQuery trade-in helpers): the vehicle's photo with a close button (emits `close`), title,
 *    price and miles, the fields, the trade-in, the SMS consent and the submit button. The parent supplies the dimmed
 *    full-screen backdrop around it. Errors show after the first Submit and update as the fields are typed in.
 *
 * Both: Submit stays disabled until the SMS consent is ticked; the phone formats as (xxx) xxx-xxxx; the trade-in's
 * makes come from the API (/api/site/trade/makes), its models / trims / VIN decode from JD Power
 * (/api/site/trade/*); miles format with thousands separators.
 *
 * Not sent yet (docs/PORTING.md "Forms are not ported yet"): Submit validates, then stops at the TODO(forms) below.
 */
const props = withDefaults(defineProps<{ vehicle: Record<string, any>; variant?: 'modal' | 'panel' }>(), {
  variant: 'modal',
})
const emit = defineEmits<{ close: [] }>()

const { company, site } = useSite()
const host = useRequestURL().host

const FALLBACK_IMG = '/media/images/company/exv3.jpg'
const v = computed(() => props.vehicle)
const isNum = (x: unknown) => x !== null && x !== undefined && String(x).trim() !== '' && !Number.isNaN(Number(x))
const priceNum = computed(() => (isNum(v.value.internet_price) ? Number(v.value.internet_price) : 0))
const fmt = (x: number, decimals = 0) =>
  x.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

/** The Laravel `check_string($trim, $drivetrain)`: the trim, plus the drive unless the trim already names it. */
function checkString(long: unknown, short: unknown): string {
  const l = String(long ?? '')
  const s = String(short ?? '')
  let tail = s
  try {
    if (new RegExp(`\\b(${s})\\b`, 'i').test(l)) tail = ''
  } catch {
    // A drive name that isn't a valid pattern: kept, as PHP's failed match keeps it.
  }
  return `${l} ${tail}`
}

/* ── Display ── */
const dispPrice = computed(() => (priceNum.value > 0 ? `$${fmt(priceNum.value)}` : 'CALL FOR PRICE'))
const modalPrice = computed(() => (priceNum.value > 0 ? `$${fmt(priceNum.value, 2)}` : 'CALL FOR PRICE'))
const modalMiles = computed(() =>
  v.value.mileage && isNum(v.value.mileage) && Number(v.value.mileage) !== 0
    ? `Miles: ${fmt(Math.round(Number(v.value.mileage)))}`
    : 'CALL FOR MILEAGE',
)
const modalTitle = computed(
  () => `${v.value.year ?? ''} ${v.value.make ?? ''} ${v.value.model ?? ''} ${checkString(v.value.trim, v.value.drivetrain)}`,
)
const modalImage = computed(() => {
  if (v.value.features != null) return String(v.value.features?.image_urls ?? '').split('|')[0] ?? ''
  if (v.value.vehicle_logo) return `${String(site.value?.mediaBase ?? '/').replace(/\/?$/, '/')}media/vehicle/${v.value.vehicle_logo}`
  return FALLBACK_IMG
})
const otherLocation = computed(() =>
  company.value.account_type === 'Multi' && String(company.value.id) !== String(v.value.company_id ?? '')
    ? v.value.company?.name ?? ''
    : '',
)
const showCarfax = computed(() => {
  const status = v.value.vin_number ? company.value.show_carfax_status ?? 0 : 0
  return !(status === 0 || status === '0' || status === '' || status === null || status === false)
})
const demo = computed(() => isDemoHost(host))

function onImgError(e: Event) {
  const img = e.target as HTMLImageElement
  if (!img.src.endsWith(FALLBACK_IMG)) img.src = FALLBACK_IMG
}

/* ── Contact fields ── */
const firstname = ref('')
const lastname = ref('')
const email = ref('')
const phone = ref('')
const smsConsent = ref(false)
const submitting = ref(false)
/** The modal re-checks on every keyup once Submit was pressed (im_interested `alreadySubmit`). */
const alreadySubmit = ref(false)
const error = reactive({ firstName: '', lastName: '', email: '', phoneNumber: '' })
const contactMessage = computed(
  () =>
    `Is your ${`${v.value.year ?? ''} ${v.value.make ?? ''} ${v.value.model ?? ''} ${v.value.trim ?? ''}`.trim()} listed for ${dispPrice.value} still available?`,
)

const EMAIL_RE = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/

function validateContact(): boolean {
  error.firstName = firstname.value ? '' : 'Please Enter Your First Name'
  error.lastName = lastname.value ? '' : 'Please Enter Your Last Name'
  if (!email.value) error.email = 'Please Enter Your Email Address'
  else if (!EMAIL_RE.test(email.value)) error.email = 'The Email Address Is Not Valid'
  else error.email = ''
  if (!phone.value) error.phoneNumber = 'Please Enter Your Phone Number'
  else if (phone.value.length < 14) error.phoneNumber = 'Phone Number Must Be 10 digits'
  else error.phoneNumber = ''
  return !(error.firstName || error.lastName || error.email || error.phoneNumber)
}

/** (xxx) xxx-xxxx from the first ten digits. */
function formatPhoneInput() {
  const input = phone.value.replace(/\D/g, '').substring(0, 10)
  const area = input.substring(0, 3)
  const middle = input.substring(3, 6)
  const last = input.substring(6, 10)
  if (input.length > 6) phone.value = `(${area}) ${middle}-${last}`
  else if (input.length > 3) phone.value = `(${area}) ${middle}`
  else if (input.length > 0) phone.value = `(${area}`
  else if (props.variant === 'panel') phone.value = ''
}

/** The panel's phone field takes digits only (and editing keys). */
function blockNonDigitKey(event: KeyboardEvent) {
  const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Home', 'End']
  if (allowed.includes(event.key) || event.ctrlKey || event.metaKey) return
  if (!/^[0-9]$/.test(event.key)) event.preventDefault()
}

function onModalKeyup() {
  if (alreadySubmit.value) validateContact()
}

/* ── Trade-in (the bundle's `tradeIn`, and the pop-up's jQuery copy of it) ── */
const THIS_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: THIS_YEAR - 1990 + 1 }, (_, i) => THIS_YEAR - i)
const CONDITIONS = ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor', 'Very Bad']

const hasTrade = ref(false)
const tradeOption = ref<'vin' | 'manual'>('vin')
const tradeVin = ref('')
const tradeVinYear = ref('')
const tradeVinMake = ref('')
const tradeVinModel = ref('')
const tradeVinTrim = ref('')
const tradeVinDrivetrain = ref('')
const tradeVinDecoded = ref(false)
const tradeVinDecoding = ref(false)
const tradeVinError = ref('')
const tradeYear = ref('')
const tradeMake = ref('')
const tradeModel = ref('')
const tradeTrim = ref('')
const tradeDrivetrain = ref('')
const tradeUcgvehicleid = ref('')
const tradeMakes = ref<{ id: number | string; title: string }[]>([])
const tradeModels = ref<{ model: string }[]>([])
const tradeTrims = ref<{ label?: string; body?: string; ucgvehicleid?: string; drivetype?: string }[]>([])
const tradeMiles = ref('')
const tradeCondition = ref('')
const tradeNotes = ref('')
const tradeErrors = reactive({
  tradeVin: '',
  tradeYear: '',
  tradeMake: '',
  tradeModel: '',
  tradeTrim: '',
  tradeDrivetrain: '',
  tradeMiles: '',
  tradeCondition: '',
})

// The pop-up's selects show their loading / empty / failed states in the placeholder (its jQuery did).
const makeState = ref<'idle' | 'ok' | 'error'>('idle')
const modelState = ref<'initial' | 'reset' | 'loading' | 'ok' | 'error'>('initial')
const trimState = ref<'initial' | 'reset' | 'loading' | 'ok' | 'error'>('initial')
const dtState = ref<'initial' | 'reset' | 'none' | 'ok'>('initial')

function clearTradeErrors() {
  for (const k of Object.keys(tradeErrors) as (keyof typeof tradeErrors)[]) tradeErrors[k] = ''
}

function validateTrade(): boolean {
  clearTradeErrors()
  if (!hasTrade.value) return true
  if (tradeOption.value === 'vin') {
    if (!tradeVin.value.trim()) tradeErrors.tradeVin = 'Please Enter Your VIN'
  } else {
    if (!tradeYear.value) tradeErrors.tradeYear = 'Please Select Your Vehicle Year'
    if (!tradeMake.value) tradeErrors.tradeMake = 'Please Select Your Vehicle Make'
    if (!tradeModel.value) tradeErrors.tradeModel = 'Please Select Your Vehicle Model'
    if (!tradeTrim.value) tradeErrors.tradeTrim = 'Please Select Your Vehicle Trim'
    if (!tradeDrivetrain.value) tradeErrors.tradeDrivetrain = 'Please Select Your Vehicle Drivetrain'
  }
  if (!tradeMiles.value) tradeErrors.tradeMiles = 'Please Enter Your Trade-In Miles'
  if (!tradeCondition.value) tradeErrors.tradeCondition = 'Please Select Your Trade-In Condition'
  return !Object.values(tradeErrors).some(Boolean)
}

function toggleTrade() {
  if (!hasTrade.value) {
    clearTradeErrors()
    tradeVinError.value = ''
  } else if (tradeOption.value === 'manual') {
    loadTradeMakes()
  }
}

function changeTradeOption() {
  clearTradeErrors()
  if (tradeOption.value === 'manual') loadTradeMakes()
}

async function loadTradeMakes() {
  if (tradeMakes.value.length) return
  try {
    const res = await $fetch<{ saleableMakes?: any[] }>('/api/site/trade/makes')
    tradeMakes.value = res?.saleableMakes ?? []
    makeState.value = 'ok'
  } catch {
    tradeMakes.value = []
    makeState.value = 'error'
  }
}

function resetModelAndTrim() {
  tradeModel.value = ''
  tradeTrim.value = ''
  tradeModels.value = []
  tradeTrims.value = []
  modelState.value = 'reset'
  trimState.value = 'reset'
}

function onTradeYearChange() {
  tradeErrors.tradeYear = ''
  resetModelAndTrim()
  fetchTradeModels()
}
function onTradeMakeChange() {
  tradeErrors.tradeMake = ''
  resetModelAndTrim()
  fetchTradeModels()
}

async function fetchTradeModels() {
  if (!tradeYear.value || !tradeMake.value) return
  modelState.value = 'loading'
  try {
    const res = await $fetch<{ result?: any[] }>('/api/site/trade/models', {
      query: { make: tradeMake.value, modelyear: tradeYear.value, period: 0, vehicletype: 'UsedCar' },
    })
    tradeModels.value = res?.result ?? []
    modelState.value = 'ok'
  } catch {
    tradeModels.value = []
    modelState.value = 'error'
  }
}

async function onTradeModelChange() {
  tradeErrors.tradeModel = ''
  tradeTrim.value = ''
  tradeDrivetrain.value = ''
  tradeUcgvehicleid.value = ''
  tradeTrims.value = []
  trimState.value = 'reset'
  dtState.value = 'reset'
  if (!tradeYear.value || !tradeMake.value || !tradeModel.value) return
  trimState.value = 'loading'
  try {
    const res = await $fetch<{ status?: string; result?: any[] }>('/api/site/trade/trims', {
      query: { period: 0, vehicletype: 'UsedCar', modelyear: tradeYear.value, make: tradeMake.value, model: tradeModel.value },
    })
    tradeTrims.value = res?.status === 'success' && Array.isArray(res.result) ? res.result : []
    trimState.value = 'ok'
  } catch {
    tradeTrims.value = []
    trimState.value = 'error'
  }
}

const trimLabel = (item: { label?: string; body?: string }) => item.label || (item.body ? item.body.trim() : 'Base')
const uniqueTradeTrims = computed(() => {
  const seen = new Set<string>()
  return tradeTrims.value.filter((item) => {
    const label = trimLabel(item)
    if (seen.has(label)) return false
    seen.add(label)
    return true
  })
})

function onTradeTrimChange() {
  tradeErrors.tradeTrim = ''
  tradeDrivetrain.value = ''
  tradeUcgvehicleid.value = ''
  const trimObj = tradeTrims.value.find((item) => trimLabel(item) === tradeTrim.value)
  if (!trimObj) {
    dtState.value = 'none'
    return
  }
  if (trimObj.ucgvehicleid) tradeUcgvehicleid.value = trimObj.ucgvehicleid
  if (trimObj.drivetype) {
    tradeDrivetrain.value = trimObj.drivetype
    tradeErrors.tradeDrivetrain = ''
    dtState.value = 'ok'
  } else {
    dtState.value = 'none'
  }
}

async function decodeTradeVin() {
  const vin = tradeVin.value.trim()
  if (!vin || vin.length !== 17) {
    tradeVinError.value = 'VIN must be exactly 17 characters'
    return
  }
  tradeVinError.value = ''
  tradeVinDecoded.value = false
  tradeVinDecoding.value = true
  try {
    const d = await $fetch<{ status?: string; data?: Record<string, any> }>('/api/site/trade/decode-vin', { query: { vin } })
    if (d?.status === 'success' && d.data) {
      tradeVinYear.value = String(d.data.modelyear ?? '')
      tradeVinMake.value = d.data.make || ''
      tradeVinModel.value = d.data.model || ''
      tradeVinTrim.value = d.data.trim || ''
      tradeVinDrivetrain.value = d.data.drivetype || ''
      tradeVinDecoded.value = true
    } else {
      tradeVinError.value = 'Invalid VIN. Please try again.'
    }
  } catch {
    // An unknown VIN answers 404 (as the Laravel endpoint does): the failed-call message, as there.
    tradeVinError.value = 'Failed to decode VIN. Please try again.'
  } finally {
    tradeVinDecoding.value = false
  }
}

function formatTradeMiles(e: Event) {
  const input = e.target as HTMLInputElement
  const val = input.value.replace(/,/g, '')
  tradeMiles.value = val !== '' && !Number.isNaN(Number(val)) ? Number(val).toLocaleString('en-US') : ''
  input.value = tradeMiles.value
  tradeErrors.tradeMiles = ''
}

function resetTrade() {
  hasTrade.value = false
  tradeOption.value = 'vin'
  tradeVin.value = ''
  tradeVinYear.value = ''
  tradeVinMake.value = ''
  tradeVinModel.value = ''
  tradeVinTrim.value = ''
  tradeVinDrivetrain.value = ''
  tradeVinDecoded.value = false
  tradeVinError.value = ''
  tradeYear.value = ''
  tradeMake.value = ''
  tradeModel.value = ''
  tradeTrim.value = ''
  tradeDrivetrain.value = ''
  tradeUcgvehicleid.value = ''
  tradeModels.value = []
  tradeTrims.value = []
  modelState.value = 'reset'
  trimState.value = 'reset'
  dtState.value = 'reset'
  tradeMiles.value = ''
  tradeCondition.value = ''
  tradeNotes.value = ''
  clearTradeErrors()
}

/** The trade-in fields as the Laravel forms post them. */
function tradeData(): Record<string, unknown> {
  if (!hasTrade.value) return {}
  const data: Record<string, unknown> = {
    has_trade: 1,
    trade_option: tradeOption.value,
    trade_miles: tradeMiles.value,
    trade_condition: tradeCondition.value,
    trade_notes: tradeNotes.value,
  }
  if (tradeOption.value === 'vin') {
    Object.assign(data, {
      trade_vin: tradeVin.value,
      trade_year: tradeVinYear.value,
      trade_make: tradeVinMake.value,
      trade_model: tradeVinModel.value,
      trade_trim: tradeVinTrim.value,
      trade_drivetrain: tradeVinDrivetrain.value,
    })
  } else {
    Object.assign(data, {
      trade_year: tradeYear.value,
      trade_make: tradeMake.value,
      trade_model: tradeModel.value,
      trade_trim: tradeTrim.value,
      trade_drivetrain: tradeDrivetrain.value,
      trade_ucgvehicleid: tradeUcgvehicleid.value,
    })
  }
  return data
}

/* ── Submit ── */
function submit() {
  if (!smsConsent.value || demo.value) return
  alreadySubmit.value = true
  const validBase = validateContact()
  const validTrade = validateTrade()
  if (!validBase || !validTrade) return

  const payload: Record<string, unknown> = {
    company_id: String(company.value.id),
    vehicle_id: String(v.value.id ?? ''),
    ...(company.value.account_type === 'Multi' ? { location_id: String(v.value.company_id ?? '') } : {}),
    firstname: firstname.value,
    lastname: lastname.value,
    phone: phone.value,
    email: email.value,
    message: props.variant === 'panel' ? `Vehicle Inquiry: ${contactMessage.value}` : '',
    sms_consent: smsConsent.value ? 1 : 0,
    ...tradeData(),
  }
  // TODO(forms): POST website/forms/interested (see data-map.md "Form endpoints") with `payload` + source; on success
  // clear the fields, resetTrade(), untick the consent and show the Thank You alert (alert-component).
  // On the sales site (where this form is only the inventory list's pop-up, vehicle-lists.blade.php) it posts to the
  // site's own /frontend/interested instead (FormSubmissionService::submitInterested → API
  // websitetemplate/sales-interested-api, answer has is_sales), and after a success re-runs syncInquirySmsConsent()
  // so the submit button is disabled again with the consent cleared.
  void payload
}

/** The pop-up's close: errors and the trade-in reset, then the parent closes it. */
function closeModal() {
  error.firstName = ''
  error.lastName = ''
  error.email = ''
  error.phoneNumber = ''
  alreadySubmit.value = false
  resetTrade()
  emit('close')
}

// Placeholders of the pop-up's selects, as its jQuery wrote them.
const modalMakePh = computed(() =>
  makeState.value === 'ok' ? 'Select Make' : makeState.value === 'error' ? 'Failed to load makes' : 'Select your Vehicle Make',
)
const MODEL_PH = { initial: 'Select your Vehicle Model', reset: 'Select Model', loading: 'Loading...', ok: 'Select Model', error: 'Failed to load models' }
const TRIM_PH = { initial: 'Select your Vehicle Trim', reset: 'Select Trim', loading: 'Loading...', ok: 'Select Trim', error: 'Failed to load trims' }
const DT_PH = { initial: 'Select your Vehicle Drivetrain', reset: 'Select Drivetrain', none: 'No drivetrain data', ok: 'Select Drivetrain' }
</script>

<template>
  <!-- ══ Panel: the vehicle page's form under the price ══ -->
  <div v-if="variant === 'panel'" class="vdp-contact-form">
    <div class="vdp-contact-form-title">I'M INTERESTED IN THIS VEHICLE</div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
      <div class="text-left">
        <label class="text-sm font-bold text-gray-700">First Name <span class="text-red-500">*</span></label>
        <div class="mt-1">
          <input
            v-model="firstname"
            type="text"
            required
            placeholder="Enter your first name"
            aria-label="First Name..."
            :class="{ 'border-red-500': error.firstName }"
            class="appearance-none border rounded-lg w-full py-2.5 px-3 text-gray-700 leading-tight focus:outline-hidden"
            @input="error.firstName = ''"
          />
          <div v-show="error.firstName" class="vdp-contact-error">{{ error.firstName }}</div>
        </div>
      </div>
      <div class="text-left">
        <label class="text-sm font-bold text-gray-700">Last Name <span class="text-red-500">*</span></label>
        <div class="mt-1">
          <input
            v-model="lastname"
            type="text"
            required
            placeholder="Enter your last name"
            aria-label="Last Name..."
            :class="{ 'border-red-500': error.lastName }"
            class="appearance-none border rounded-lg w-full py-2.5 px-3 text-gray-700 leading-tight focus:outline-hidden"
            @input="error.lastName = ''"
          />
          <div v-show="error.lastName" class="vdp-contact-error">{{ error.lastName }}</div>
        </div>
      </div>
      <div class="text-left">
        <label class="text-sm font-bold text-gray-700">Mobile Phone <span class="text-red-500">*</span></label>
        <div class="mt-1">
          <input
            id="vdpContactPhoneInput"
            v-model="phone"
            type="text"
            inputmode="numeric"
            required
            placeholder="(xxx) xxx - xxxx"
            :class="{ 'border-red-500': error.phoneNumber }"
            class="appearance-none border rounded-lg w-full py-2.5 px-3 text-gray-700 leading-tight focus:outline-hidden"
            @keydown="blockNonDigitKey"
            @input="error.phoneNumber = ''; formatPhoneInput()"
          />
          <div v-show="error.phoneNumber" class="vdp-contact-error">{{ error.phoneNumber }}</div>
        </div>
      </div>
      <div class="text-left">
        <label class="text-sm font-bold text-gray-700">Email Address <span class="text-red-500">*</span></label>
        <div class="mt-1">
          <input
            v-model="email"
            type="email"
            required
            placeholder="Enter your email"
            :class="{ 'border-red-500': error.email }"
            class="appearance-none border rounded-lg w-full py-2.5 px-3 text-gray-700 leading-tight focus:outline-hidden"
            @input="error.email = ''"
          />
          <div v-show="error.email" class="vdp-contact-error">{{ error.email }}</div>
        </div>
      </div>
    </div>

    <div id="vdp-trade-in">
      <div class="flex items-center gap-2 border-y border-zinc-300 py-3">
        <input id="vdpHasTradeCheckbox" v-model="hasTrade" type="checkbox" class="w-4 h-4 cursor-pointer" @change="toggleTrade" />
        <label for="vdpHasTradeCheckbox" class="cursor-pointer text-sm font-medium text-gray-700 select-none">I have a trade-in</label>
      </div>

      <div v-show="hasTrade" class="mt-4 pb-2 border-b border-zinc-300">
        <div class="vdp-trade-title">Trade-In Details</div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <div class="text-left md:col-span-2">
            <label class="text-sm font-bold text-gray-700">Options</label>
            <div class="mt-1">
              <select v-model="tradeOption" class="vdp-trade-input" @change="changeTradeOption">
                <option value="vin">Add Using VIN</option>
                <option value="manual">Add Manually</option>
              </select>
            </div>
          </div>

          <template v-if="tradeOption === 'vin'">
            <div class="text-left md:col-span-2">
              <label class="text-sm font-bold text-gray-700">VIN Number <span class="text-red-500">*</span></label>
              <div class="relative mt-1">
                <input
                  v-model="tradeVin"
                  type="text"
                  placeholder="VIN"
                  :class="{ 'border-red-500': tradeErrors.tradeVin || tradeVinError }"
                  class="vdp-trade-input uppercase pr-20"
                  @input="tradeErrors.tradeVin = ''; tradeVinError = ''"
                />
                <div
                  class="vdp-trade-decode-btn absolute px-3 right-0 top-0 h-full flex items-center justify-center company-primary-base-text"
                  @click="decodeTradeVin"
                >
                  <span v-show="!tradeVinDecoding">DECODE</span>
                  <span v-show="tradeVinDecoding">DECODING...</span>
                </div>
              </div>
              <div v-show="tradeVinError" class="vdp-contact-error">{{ tradeVinError }}</div>
              <div v-show="tradeErrors.tradeVin" class="vdp-contact-error">{{ tradeErrors.tradeVin }}</div>

              <div v-show="tradeVinDecoded" class="grid grid-cols-2 md:grid-cols-2 gap-3 mt-3">
                <div class="text-left">
                  <label class="text-sm font-bold text-gray-700">Year</label>
                  <input v-model="tradeVinYear" type="text" disabled class="vdp-trade-input mt-1" />
                </div>
                <div class="text-left">
                  <label class="text-sm font-bold text-gray-700">Make</label>
                  <input v-model="tradeVinMake" type="text" disabled class="vdp-trade-input mt-1" />
                </div>
                <div class="text-left">
                  <label class="text-sm font-bold text-gray-700">Model</label>
                  <input v-model="tradeVinModel" type="text" disabled class="vdp-trade-input mt-1" />
                </div>
                <div class="text-left">
                  <label class="text-sm font-bold text-gray-700">Trim</label>
                  <input v-model="tradeVinTrim" type="text" disabled class="vdp-trade-input mt-1" />
                </div>
              </div>
            </div>
            <div v-show="tradeVinDecoded" class="text-left">
              <label class="text-sm font-bold text-gray-700">Drivetrain</label>
              <div class="mt-1">
                <select v-model="tradeVinDrivetrain" class="vdp-trade-input">
                  <option value="" disabled>Select Drivetrain</option>
                  <option>AWD</option>
                  <option>4WD</option>
                  <option>FWD</option>
                  <option>RWD</option>
                </select>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="text-left">
              <label class="text-sm font-bold text-gray-700">Year <span class="text-red-500">*</span></label>
              <div class="mt-1">
                <select v-model="tradeYear" :class="{ 'border-red-500': tradeErrors.tradeYear }" class="vdp-trade-input" @change="onTradeYearChange">
                  <option value="" disabled>Select your Vehicle Year</option>
                  <option v-for="ty in YEARS" :key="ty" :value="String(ty)">{{ ty }}</option>
                </select>
              </div>
              <div v-show="tradeErrors.tradeYear" class="vdp-contact-error">{{ tradeErrors.tradeYear }}</div>
            </div>
            <div class="text-left">
              <label class="text-sm font-bold text-gray-700">Make <span class="text-red-500">*</span></label>
              <div class="mt-1">
                <select
                  v-model="tradeMake"
                  :disabled="!tradeMakes.length"
                  :class="{ 'border-red-500': tradeErrors.tradeMake }"
                  class="vdp-trade-input"
                  @change="onTradeMakeChange"
                >
                  <option value="" disabled>Select your Vehicle Make</option>
                  <option v-for="m in tradeMakes" :key="m.id" :value="m.title">{{ m.title }}</option>
                </select>
              </div>
              <div v-show="tradeErrors.tradeMake" class="vdp-contact-error">{{ tradeErrors.tradeMake }}</div>
            </div>
            <div class="text-left">
              <label class="text-sm font-bold text-gray-700">Model <span class="text-red-500">*</span></label>
              <div class="mt-1">
                <select
                  v-model="tradeModel"
                  :disabled="!tradeModels.length"
                  :class="{ 'border-red-500': tradeErrors.tradeModel }"
                  class="vdp-trade-input"
                  @change="onTradeModelChange"
                >
                  <option value="" disabled>Select your Vehicle Model</option>
                  <option v-for="m in tradeModels" :key="m.model" :value="m.model">{{ m.model }}</option>
                </select>
              </div>
              <div v-show="tradeErrors.tradeModel" class="vdp-contact-error">{{ tradeErrors.tradeModel }}</div>
            </div>
            <div class="text-left">
              <label class="text-sm font-bold text-gray-700">Trim <span class="text-red-500">*</span></label>
              <div class="mt-1">
                <select
                  v-model="tradeTrim"
                  :disabled="!tradeTrims.length"
                  :class="{ 'border-red-500': tradeErrors.tradeTrim }"
                  class="vdp-trade-input"
                  @change="onTradeTrimChange"
                >
                  <option value="" disabled>Select your Vehicle Trim</option>
                  <option v-for="t in uniqueTradeTrims" :key="trimLabel(t)" :value="trimLabel(t)">{{ trimLabel(t) }}</option>
                </select>
              </div>
              <div v-show="tradeErrors.tradeTrim" class="vdp-contact-error">{{ tradeErrors.tradeTrim }}</div>
            </div>
            <div class="text-left">
              <label class="text-sm font-bold text-gray-700">Drivetrain <span class="text-red-500">*</span></label>
              <div class="mt-1">
                <select
                  v-model="tradeDrivetrain"
                  :disabled="!tradeDrivetrain"
                  :class="{ 'border-red-500': tradeErrors.tradeDrivetrain }"
                  class="vdp-trade-input"
                >
                  <option value="" disabled>Select your Vehicle Drivetrain</option>
                  <option v-if="tradeDrivetrain" :value="tradeDrivetrain">{{ tradeDrivetrain }}</option>
                </select>
              </div>
              <div v-show="tradeErrors.tradeDrivetrain" class="vdp-contact-error">{{ tradeErrors.tradeDrivetrain }}</div>
            </div>
          </template>

          <div class="text-left">
            <label class="text-sm font-bold text-gray-700">Miles <span class="text-red-500">*</span></label>
            <div class="mt-1">
              <input
                :value="tradeMiles"
                type="text"
                placeholder="Miles"
                :class="{ 'border-red-500': tradeErrors.tradeMiles }"
                class="vdp-trade-input"
                @input="formatTradeMiles"
              />
            </div>
            <div v-show="tradeErrors.tradeMiles" class="vdp-contact-error">{{ tradeErrors.tradeMiles }}</div>
          </div>

          <div class="text-left" :class="{ 'md:col-span-2': tradeOption === 'manual' || (tradeOption === 'vin' && tradeVinDecoded) }">
            <label class="text-sm font-bold text-gray-700">Condition <span class="text-red-500">*</span></label>
            <div class="mt-1">
              <select
                v-model="tradeCondition"
                :class="{ 'border-red-500': tradeErrors.tradeCondition }"
                class="vdp-trade-input"
                @change="tradeErrors.tradeCondition = ''"
              >
                <option value="" disabled>Select Condition</option>
                <option v-for="c in CONDITIONS" :key="c">{{ c }}</option>
              </select>
            </div>
            <div v-show="tradeErrors.tradeCondition" class="vdp-contact-error">{{ tradeErrors.tradeCondition }}</div>
          </div>

          <div class="text-left md:col-span-2">
            <label class="text-sm font-bold text-gray-700">Notes</label>
            <div class="mt-1">
              <textarea
                v-model="tradeNotes"
                rows="3"
                placeholder="Please describe your trade or any details we should know."
                class="vdp-trade-input"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <label class="sms-consent w-full flex items-start gap-2 text-left cursor-pointer text-black" style="font-size: 11px; line-height: 1.4">
      <input v-model="smsConsent" type="checkbox" class="mt-0.5 shrink-0" />
      <span>
        I consent to receive SMS messages from Dealer Lion at the number above. Msg &amp; data rates may apply. Reply STOP to
        opt-out. See our
        <NuxtLink to="/privacy_policy" target="_blank" class="underline">Privacy Policy</NuxtLink>
        and SMS Terms.
      </span>
    </label>

    <div class="vdp-submit-row" :class="{ 'has-carfax': showCarfax }">
      <button
        type="button"
        :disabled="submitting || !smsConsent"
        :class="{ 'opacity-50 cursor-not-allowed': !smsConsent }"
        class="vdp-action-btn primary vdp-panel-btn w-full"
        @click="submit"
      >
        <span v-show="!submitting">Submit</span>
        <span v-show="submitting">Sending...</span>
      </button>
      <a
        v-if="showCarfax"
        target="_blank"
        rel="noopener"
        class="vdp-carfax"
        :href="`http://www.carfax.com/VehicleHistory/p/Report.cfx?vin=${vehicle.vin_number}`"
        aria-label="Show me the Carfax report"
      >
        <img src="https://partnerstatic.carfax.com/img/valuebadge/showme.svg" alt="Show me the Carfax" />
      </a>
    </div>
  </div>

  <!-- ══ Modal: the I'm Interested pop-up's card ══ -->
  <div
    v-else
    class="w-[90%] h-auto max-h-[95dvh] mx-auto rounded-xl md:w-auto md:max-w-xl lg:max-w-2xl xl:max-w-2xl md:h-auto md:mx-2 text-left bg-white shadow-xl md:max-h-[120vh] flex flex-1 flex-col overflow-hidden iminterested-popup md:[transform:scale(0.8)]"
  >
    <div class="flex flex-1 flex-col overflow-hidden [zoom:0.75] md:[zoom:1]">
      <div class="relative w-full shrink-0 md:px-10 px-2 pt-5 h-[24.25rem] flex items-center justify-center overflow-hidden bg-white">
        <a
          class="absolute right-4 top-4 z-10 cursor-pointer close-modal-iam-interested flex items-center justify-center w-9 h-9 rounded-full bg-black/60 text-white text-xl shadow-md transition hover:bg-black/80"
          @click.prevent="closeModal"
        >
          <Icon name="ion:close-outline" />
        </a>
        <img id="vehicle_image_logo" class="w-full h-full object-cover" :src="modalImage" alt="" @error="onImgError" />
      </div>

      <div class="px-6 pt-2 md:pt-3 pb-1 text-center shrink-0">
        <h2 class="car_title justify-center text-lg md:text-2xl font-bold text-gray-900">{{ modalTitle }}</h2>

        <div v-if="otherLocation" class="flex items-center justify-center gap-1 mt-1 text-sm text-gray-700">
          <Icon name="ion:location" class="company-primary-base-text" />
          <b class="company-primary-base-text">Location:</b>
          {{ otherLocation }}
        </div>

        <div class="flex items-center justify-center gap-2 mt-2">
          <span class="text-xl font-bold company-primary-base-text">{{ modalPrice }}</span>
          <span class="text-gray-300">|</span>
          <span class="text-xl font-bold text-gray-900">{{ modalMiles }}</span>
        </div>
      </div>

      <div class="overflow-y-auto flex-1">
        <div id="show-inquiry-step-contact" class="px-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="text-left">
              <label class="text-sm font-bold text-gray-700">First Name <span class="text-red-500">*</span></label>
              <div class="relative mt-1">
                <Icon name="ion:person-outline" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="firstname"
                  v-model="firstname"
                  :class="{ 'border-red-500': error.firstName, 'focus:border-red-500': error.firstName, 'box-shadow-none': error.firstName }"
                  class="appearance-none border rounded-lg w-full py-2.5 pl-9 pr-3 text-gray-700 leading-tight focus:outline-hidden"
                  required
                  name="firstname"
                  placeholder="Enter your first name"
                  aria-label="First Name..."
                  type="text"
                  @keyup="onModalKeyup"
                />
                <div v-show="error.firstName" class="text-xs text-red-500">{{ error.firstName }}</div>
              </div>
            </div>
            <div class="text-left">
              <label class="text-sm font-bold text-gray-700">Last Name <span class="text-red-500">*</span></label>
              <div class="relative mt-1">
                <Icon name="ion:person-outline" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="lastname"
                  v-model="lastname"
                  type="text"
                  :class="{ 'border-red-500': error.lastName, 'focus:border-red-500': error.lastName, 'box-shadow-none': error.lastName }"
                  class="appearance-none border rounded-lg w-full py-2.5 pl-9 pr-3 text-gray-700 leading-tight focus:outline-hidden"
                  required
                  name="lastname"
                  placeholder="Enter your last name"
                  aria-label="Last Name..."
                  @keyup="onModalKeyup"
                />
                <div v-show="error.lastName" class="text-xs text-red-500">{{ error.lastName }}</div>
              </div>
            </div>
            <div class="text-left">
              <label class="text-sm font-bold text-gray-700">Mobile Phone <span class="text-red-500">*</span></label>
              <div class="relative mt-1">
                <Icon name="ion:call-outline" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="phone_interested"
                  v-model="phone"
                  type="text"
                  placeholder="(xxx) xxx - xxxx"
                  name="phone"
                  :class="{ 'border-red-500': error.phoneNumber, 'focus:border-red-500': error.phoneNumber, 'box-shadow-none': error.phoneNumber }"
                  class="appearance-none border rounded-lg w-full py-2.5 pl-9 pr-3 text-gray-700 leading-tight focus:outline-hidden"
                  required
                  @input="formatPhoneInput"
                  @keyup="onModalKeyup"
                />
                <div v-show="error.phoneNumber" class="text-xs text-red-500">{{ error.phoneNumber }}</div>
              </div>
            </div>
            <div class="text-left">
              <label class="text-sm font-bold text-gray-700">Email Address <span class="text-red-500">*</span></label>
              <div class="relative mt-1">
                <Icon name="ion:mail-outline" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="email"
                  v-model="email"
                  type="email"
                  :class="{ 'border-red-500': error.email, 'focus:border-red-500': error.email, 'box-shadow-none': error.email }"
                  class="appearance-none border rounded-lg w-full py-2.5 pl-9 pr-3 text-gray-700 leading-tight focus:outline-hidden"
                  required
                  name="email"
                  placeholder="Enter your email"
                  @keyup="onModalKeyup"
                />
                <div v-show="error.email" class="text-xs text-red-500">{{ error.email }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4">
          <div class="px-6 py-4 border-t border-b border-zinc-400 flex items-center gap-2">
            <input id="showHasTradeCheckbox" v-model="hasTrade" type="checkbox" class="w-4 h-4 cursor-pointer" @change="toggleTrade" />
            <label for="showHasTradeCheckbox" class="cursor-pointer text-sm font-medium text-gray-700 select-none">I have a trade-in</label>
          </div>

          <div v-show="hasTrade" id="show-inquiry-step-trade" class="px-6 py-2">
            <div class="text-sm font-bold text-gray-900 mb-2">Trade-In Details</div>
            <div class="grid grid-cols-12 gap-3">
              <div class="col-span-12">
                <label class="form-label text-sm font-bold text-gray-700 my-2.5">Options</label>
                <select id="trade_option" v-model="tradeOption" class="mt-2.5 input" @change="changeTradeOption">
                  <option value="vin">Add Using VIN</option>
                  <option value="manual">Add Manually</option>
                </select>
              </div>

              <div v-show="tradeOption === 'vin'" id="trade-vin-section" class="col-span-12">
                <label class="form-label text-sm font-bold text-gray-700 my-2.5">VIN Number <span class="required-indicator">*</span></label>
                <div class="w-full relative mt-2.5">
                  <input
                    id="trade_vin"
                    v-model="tradeVin"
                    type="text"
                    placeholder="VIN"
                    :class="{ 'input-error': tradeErrors.tradeVin }"
                    class="input uppercase"
                    @input="tradeErrors.tradeVin = ''"
                  />
                  <div
                    id="trade-decode-btn"
                    class="select-none absolute px-3 right-0 top-0 cursor-pointer h-full flex items-center justify-center company-primary-base-text font-bold text-sm"
                    @click="decodeTradeVin"
                  >
                    {{ tradeVinDecoding ? 'DECODING...' : 'DECODE' }}
                  </div>
                </div>
                <div v-show="tradeVinError" id="trade_vin_error" class="text-xs text-red-500">{{ tradeVinError }}</div>
                <div v-show="tradeErrors.tradeVin" class="text-xs text-red-500">{{ tradeErrors.tradeVin }}</div>

                <div v-show="tradeVinDecoded" id="trade-vin-decoded" class="mt-3 grid grid-cols-12 gap-3">
                  <div class="col-span-12 md:col-span-6">
                    <label class="form-label text-sm font-bold text-gray-700 my-2.5">Year</label>
                    <input id="trade_vin_year" v-model="tradeVinYear" type="text" class="mt-2.5 input" disabled />
                  </div>
                  <div class="col-span-12 md:col-span-6">
                    <label class="form-label text-sm font-bold text-gray-700 my-2.5">Make</label>
                    <input id="trade_vin_make" v-model="tradeVinMake" type="text" class="mt-2.5 input" disabled />
                  </div>
                  <div class="col-span-12 md:col-span-6">
                    <label class="form-label text-sm font-bold text-gray-700 my-2.5">Model</label>
                    <input id="trade_vin_model" v-model="tradeVinModel" type="text" class="mt-2.5 input" disabled />
                  </div>
                  <div class="col-span-12 md:col-span-6">
                    <label class="form-label text-sm font-bold text-gray-700 my-2.5">Trim</label>
                    <input id="trade_vin_trim" v-model="tradeVinTrim" type="text" class="mt-2.5 input" disabled />
                  </div>
                </div>
              </div>

              <div v-show="tradeOption === 'manual'" id="trade-manual-section" class="col-span-12">
                <div class="grid grid-cols-12 gap-3">
                  <div class="col-span-12 md:col-span-6">
                    <label class="form-label text-sm font-bold text-gray-700 my-2.5">Year <span class="required-indicator">*</span></label>
                    <select
                      id="trade_year"
                      v-model="tradeYear"
                      :class="{ 'input-error': tradeErrors.tradeYear }"
                      class="mt-2.5 input"
                      @change="onTradeYearChange"
                    >
                      <option value="" disabled>Select your Vehicle Year</option>
                      <option v-for="ty in YEARS" :key="ty" :value="String(ty)">{{ ty }}</option>
                    </select>
                    <div v-show="tradeErrors.tradeYear" class="text-xs text-red-500">{{ tradeErrors.tradeYear }}</div>
                  </div>
                  <div class="col-span-12 md:col-span-6">
                    <label class="form-label text-sm font-bold text-gray-700 my-2.5">Make <span class="required-indicator">*</span></label>
                    <select
                      id="trade_make"
                      v-model="tradeMake"
                      :disabled="makeState === 'idle'"
                      :class="{ 'input-error': tradeErrors.tradeMake }"
                      class="mt-2.5 input"
                      @change="onTradeMakeChange"
                    >
                      <option value="" disabled>{{ modalMakePh }}</option>
                      <option v-for="m in tradeMakes" :key="m.id" :value="m.title">{{ m.title }}</option>
                    </select>
                    <div v-show="tradeErrors.tradeMake" class="text-xs text-red-500">{{ tradeErrors.tradeMake }}</div>
                  </div>
                  <div class="col-span-12 md:col-span-6">
                    <label class="form-label text-sm font-bold text-gray-700 my-2.5">Model <span class="required-indicator">*</span></label>
                    <select
                      id="trade_model"
                      v-model="tradeModel"
                      :disabled="modelState !== 'ok' && modelState !== 'error'"
                      :class="{ 'input-error': tradeErrors.tradeModel }"
                      class="mt-2.5 input"
                      @change="onTradeModelChange"
                    >
                      <option value="" disabled>{{ MODEL_PH[modelState] }}</option>
                      <option v-for="m in tradeModels" :key="m.model" :value="m.model">{{ m.model }}</option>
                    </select>
                    <div v-show="tradeErrors.tradeModel" class="text-xs text-red-500">{{ tradeErrors.tradeModel }}</div>
                  </div>
                  <div class="col-span-12 md:col-span-6">
                    <label class="form-label text-sm font-bold text-gray-700 my-2.5">Trim <span class="required-indicator">*</span></label>
                    <select
                      id="trade_trim"
                      v-model="tradeTrim"
                      :disabled="trimState !== 'ok' && trimState !== 'error'"
                      :class="{ 'input-error': tradeErrors.tradeTrim }"
                      class="mt-2.5 input"
                      @change="onTradeTrimChange"
                    >
                      <option value="" disabled>{{ TRIM_PH[trimState] }}</option>
                      <option v-for="t in uniqueTradeTrims" :key="trimLabel(t)" :value="trimLabel(t)">{{ trimLabel(t) }}</option>
                    </select>
                    <div v-show="tradeErrors.tradeTrim" class="text-xs text-red-500">{{ tradeErrors.tradeTrim }}</div>
                  </div>
                </div>
              </div>

              <div v-show="tradeOption === 'vin' && tradeVinDecoded" id="trade-vin-drivetrain-wrap" class="col-span-12 md:col-span-6">
                <label class="form-label text-sm font-bold text-gray-700 my-2.5">Drivetrain</label>
                <select id="trade_vin_drivetrain" v-model="tradeVinDrivetrain" class="mt-2.5 input">
                  <option value="" disabled>Select Drivetrain</option>
                  <option>AWD</option>
                  <option>4WD</option>
                  <option>FWD</option>
                  <option>RWD</option>
                </select>
              </div>

              <div v-show="tradeOption === 'manual'" id="trade-manual-drivetrain-wrap" class="col-span-12 md:col-span-6">
                <label class="form-label text-sm font-bold text-gray-700 my-2.5">Drivetrain <span class="required-indicator">*</span></label>
                <select
                  id="trade_drivetrain"
                  v-model="tradeDrivetrain"
                  :disabled="dtState !== 'ok'"
                  :class="{ 'input-error': tradeErrors.tradeDrivetrain }"
                  class="mt-2.5 input"
                  @change="tradeErrors.tradeDrivetrain = ''"
                >
                  <option value="" disabled>{{ DT_PH[dtState] }}</option>
                  <option v-if="tradeDrivetrain" :value="tradeDrivetrain">{{ tradeDrivetrain }}</option>
                </select>
                <div v-show="tradeErrors.tradeDrivetrain" class="text-xs text-red-500">{{ tradeErrors.tradeDrivetrain }}</div>
              </div>

              <div class="col-span-12 md:col-span-6">
                <label class="form-label text-sm font-bold text-gray-700 my-2.5">Miles <span class="required-indicator">*</span></label>
                <input
                  id="trade_miles"
                  :value="tradeMiles"
                  type="text"
                  placeholder="Miles"
                  :class="{ 'input-error': tradeErrors.tradeMiles }"
                  class="mt-2.5 input"
                  @input="formatTradeMiles"
                />
                <div v-show="tradeErrors.tradeMiles" class="text-xs text-red-500">{{ tradeErrors.tradeMiles }}</div>
              </div>

              <div
                id="trade-condition-wrap"
                class="col-span-12"
                :class="tradeOption === 'manual' || tradeVinDecoded ? 'md:col-span-12' : 'md:col-span-6'"
              >
                <label class="form-label text-sm font-bold text-gray-700 my-2.5">Condition <span class="required-indicator">*</span></label>
                <select
                  id="trade_condition"
                  v-model="tradeCondition"
                  :class="{ 'input-error': tradeErrors.tradeCondition }"
                  class="mt-2.5 input"
                  @change="tradeErrors.tradeCondition = ''"
                >
                  <option value="" disabled>Select Condition</option>
                  <option v-for="c in CONDITIONS" :key="c">{{ c }}</option>
                </select>
                <div v-show="tradeErrors.tradeCondition" class="text-xs text-red-500">{{ tradeErrors.tradeCondition }}</div>
              </div>

              <div class="col-span-12">
                <label class="form-label text-sm font-bold text-gray-700 my-2.5">Notes</label>
                <textarea
                  id="trade_notes"
                  v-model="tradeNotes"
                  rows="3"
                  placeholder="Please describe your trade or any details we should know."
                  class="mt-2.5 input"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="show-contact-step-footer" class="shrink-0 px-6 pb-3 pt-3 flex flex-col items-center gap-2 border-t border-zinc-400">
        <label class="sms-consent w-full flex items-start gap-2 text-left cursor-pointer text-black" style="font-size: 14px; line-height: 1.4">
          <input id="show_sms_consent" v-model="smsConsent" type="checkbox" class="mt-0.5 shrink-0" />
          <span>
            I consent to receive SMS messages from Dealer Lion at the number above. Msg &amp; data rates may apply. Reply STOP
            to opt-out. See our
            <NuxtLink to="/privacy_policy" target="_blank" class="underline">Privacy Policy</NuxtLink>
            and SMS Terms.
          </span>
        </label>
        <button
          v-if="demo"
          id="showSubmitBtn"
          class="w-full submit-button bg-gray-400 cursor-not-allowed text-white font-bold text-sm tracking-wide py-2.5 px-4 rounded-sm focus:outline-hidden"
          disabled
        >
          I'M INTERESTED IN THIS VEHICLE
        </button>
        <button
          v-else
          id="showSubmitBtn"
          class="w-full submit-button company-primary-base-background text-white font-bold text-sm tracking-wide py-2.5 px-4 rounded-sm focus:outline-hidden"
          :class="{ 'opacity-50 cursor-not-allowed': !smsConsent }"
          :disabled="!smsConsent"
          @click="submit"
        >
          I'M INTERESTED IN THIS VEHICLE
        </button>
      </div>
    </div>
  </div>
</template>

<style>
/* The Laravel vdp-contact-form.blade.php block (global there too; every class is vdp-*). */
.vdp-contact-form {
  border-bottom: 1px solid #e5e7eb;
  background: white;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.vdp-contact-form-title {
  font-size: 1rem;
  font-weight: 800;
  color: #111827;
}
.vdp-contact-error {
  font-size: 0.8rem;
  font-weight: 600;
  color: #dc2626;
}
.vdp-trade-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
}
.vdp-trade-input {
  appearance: none;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  width: 100%;
  padding: 0.625rem 0.75rem;
  color: #374151;
  line-height: 1.25;
}
.vdp-trade-input.border-red-500 {
  border-color: #ef4444;
}
.vdp-trade-input:focus {
  outline: none;
  box-shadow: none;
}
.vdp-trade-input[disabled] {
  background-color: #f3f4f6;
  cursor: not-allowed;
}
.vdp-trade-decode-btn {
  user-select: none;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.8rem;
}

/* Tailwind 4's preflight sets `opacity: 1` on form controls; Tailwind 3's didn't, so a disabled select kept the
   browser's 0.7 there. */
.vdp-contact-form select:disabled,
.iminterested-popup select:disabled {
  opacity: 0.7;
}

/* <x-sms-consent>: a plain checkbox whatever the form's input styles. */
.sms-consent input[type='checkbox'] {
  padding: 0 !important;
  width: 1rem !important;
  height: 1rem !important;
  min-width: 1rem;
  font-size: inherit !important;
  border: 1px solid #6b7280;
  cursor: pointer;
}

/* The pop-up sits outside the page's sections on the Laravel site, so it has the <body>'s font: frontend-tw's
   Poppins stack (Poppins isn't loaded there, so Segoe UI on Windows). The Nuxt <body> has Inter. */
.iminterested-popup {
  font-family: Poppins, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
}

/* The pop-up: frontend-tw's .input (the Laravel site's shared input), scoped to the pop-up here. */
.iminterested-popup .input {
  appearance: none;
  border: 1px solid #6b7280;
  border-radius: 0.25rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  color: #374151;
  line-height: 1.25;
  font-size: 16px !important;
}
.iminterested-popup .input:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
}
.iminterested-popup .input.input-error {
  border-color: #ef4444;
}
.iminterested-popup .input:disabled {
  background-color: #d1d5db;
  cursor: not-allowed !important;
}
.iminterested-popup input.box-shadow-none {
  box-shadow: 0 0 #0000 !important;
}
/* show.blade.php's .car_title, and custom-design.css's pop-up rules. */
.iminterested-popup .car_title {
  font-style: normal;
  font-weight: 700;
  font-size: 26px;
  line-height: 33px;
  display: flex;
  align-items: center;
}
@media (max-width: 991px) {
  .iminterested-popup .car_title {
    font-size: 22px !important;
  }
}
@media (max-height: 617px) and (max-width: 991px) {
  .iminterested-popup {
    height: 95vh;
    max-height: 95vh !important;
  }
  .close-modal-iam-interested {
    position: absolute;
    right: 0;
    top: 0;
  }
}
</style>
