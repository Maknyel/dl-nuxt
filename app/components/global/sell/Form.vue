<script setup lang="ts">
/**
 * The Sell Us Your Car form (global/sell/form.blade.php `.sell-form-col`, its jQuery script ported to Vue state):
 *  - the two-step header with the progress bar (Step 1 "Your Vehicle", Step 2 "Your Contact Info");
 *  - step 1: the store picker (Multi dealers, from the locations), the VIN yes / no cards, then either the VIN (Next
 *    decodes it, then a "Success!" pop-up continues to step 2) or year → make → model → trim → drivetrain, mileage and
 *    condition. Make unlocks with a year, model with a make, trim with a model (the Blade's inputChecker()); makes come
 *    from the API (/api/site/trade/makes, cached in localStorage under `makes` as the Blade does), models and trims from
 *    JD Power (/api/site/trade/models, /trims), the drivetrain from the chosen trim (/api/site/trade/drivetrain). The
 *    "Other" make / model / trim boxes are kept, though no list offers "Other" today (the Blade's are commented out);
 *  - step 2: name, email, phone ((xxx) xxx-xxxx, digits only), zip (5 digits), the SMS consent (Submit stays disabled
 *    until it is ticked);
 *  - the validation messages of the Blade's formValidation() / resetValidation(), with their exact texts.
 *
 * Not sent yet (docs/PORTING.md "Forms are not ported yet"): Submit validates and builds the payload, then stops at the
 * TODO(forms). The hidden image-upload form is kept as in the Blade (nothing on the page opens it: the Blade's upload
 * button and preview image are gone from its markup).
 */
import UiSwal, { type SwalOptions } from '~/components/ui/Swal.vue'

interface Opt {
  value: string
  label: string
  disabled?: boolean
  makeid?: number | string
}

const { company, mainCompany, mediaUrl, isSales } = useSite()
const isMulti = computed(() => company.value.account_type === 'Multi')
/**
 * The sales site (:8003) is a demo: its Next goes to step 2 without checking anything, its VIN Next opens the
 * "Demo Only" notice and goes to step 2 without decoding, and Submit (still only with the SMS consent) opens the notice.
 * Its store select sits under the vehicle fields, names only, hidden until a VIN answer is picked.
 */
const demoNotice = ref(false)
const storeShown = ref(false)

const locationLabel = (loc: Record<string, any>) => {
  const address = `${loc.street_address ?? ''}, ${loc.city ?? ''} ${String(loc.state ?? '').toUpperCase()} ${loc.zip_code ?? ''}`.trim()
  return `${loc.name ?? ''}${address !== '' ? ` - ${address}` : ''}`
}

const ph = (label: string): Opt => ({ value: '', label, disabled: true })
/** The value a select takes when its options are replaced (jQuery .html()): its first option, unless disabled. */
const firstValue = (opts: Opt[]) => (opts[0] && !opts[0].disabled ? opts[0].value : '')

const THIS_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: THIS_YEAR - 2007 + 1 }, (_, i) => String(THIS_YEAR - i))
const CONDITIONS = ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor', 'Very Bad']
const DRIVETRAIN_OPTS: Opt[] = [ph('Select your Vehicle Drivetrain'), ...['AWD', '4WD', 'FWD', 'RWD'].map((d) => ({ value: d, label: d }))]

/* ── State ── */
type Field =
  | 'store_location' | 'vin_number' | 'year' | 'make' | 'manual_make' | 'model' | 'manual_model' | 'trim'
  | 'manual_trim' | 'drivetrain' | 'mileage' | 'condition' | 'firstname' | 'lastname' | 'email' | 'mobile_number'
  | 'zipcode'

const FIELDS: Field[] = [
  'store_location', 'vin_number', 'year', 'make', 'manual_make', 'model', 'manual_model', 'trim', 'manual_trim',
  'drivetrain', 'mileage', 'condition', 'firstname', 'lastname', 'email', 'mobile_number', 'zipcode',
]
const f = reactive(Object.fromEntries(FIELDS.map((k) => [k, ''])) as Record<Field, string>)
const err = reactive(Object.fromEntries(FIELDS.map((k) => [k, ''])) as Record<Field, string>)
const dis = reactive({ make: true, model: true, trim: true })
const manualShown = reactive({ make: false, model: false, trim: false })

const makeOpts = ref<Opt[]>([ph('Select your Vehicle Make')])
const modelOpts = ref<Opt[]>([ph('Select your Vehicle Model')])
const trimOpts = ref<Opt[]>([ph('Select your Vehicle Trim')])
const drivetrainOpts = ref<Opt[]>(DRIVETRAIN_OPTS)

/** '' until a VIN card is picked; the Blade compares it loosely, so '' counts as "no VIN" (0). */
const hasVin = ref<'' | 0 | 1>('')
const noVin = computed(() => hasVin.value !== 1)
const vinDivShown = ref(false)
const noVinShown = ref(false)

const step = ref(1)
const decodeShown = ref(false)
const stepsShown = ref(false)
const decoding = ref(false)
const smsConsent = ref(false)

/** The decoded vehicle (true_year, true_make, ... in the Blade). */
const decoded = reactive({ year: '', make: '', model: '', trim: '', drivetrain: '', mileage: '', condition: '', vin: '' })
let allMakes: { id: number | string; title: string }[] = []
let currentTrims: any = ''
let currentVehicleId: string | number = ''
const carFeaturesImage = ref('')
const imagePreview = ref('')

const swal = ref<SwalOptions | null>(null)

/* ── Makes (cached in localStorage, as the Blade's fetchAndStoreMakes) ── */
function populateMakes(makes: any[]) {
  allMakes = Array.isArray(makes) ? makes : []
  makeOpts.value = [ph('Select your Vehicle Make'), ...allMakes.map((m) => ({ value: m.title, label: m.title, makeid: m.id }))]
  f.make = ''
}

onMounted(async () => {
  let cached: string | null = null
  try {
    cached = localStorage.getItem('makes')
  } catch {
    cached = null
  }
  if (cached) {
    try {
      populateMakes(JSON.parse(cached))
      return
    } catch {
      // A broken cache: fetch again.
    }
  }
  try {
    const res = await $fetch<{ saleableMakes?: any[] }>('/api/site/trade/makes')
    if (res && res.saleableMakes) {
      try {
        localStorage.setItem('makes', JSON.stringify(res.saleableMakes))
      } catch {
        // Storage unavailable: the list still shows.
      }
      populateMakes(res.saleableMakes)
    }
  } catch (e) {
    console.error('Error fetching saleable makes:', e)
  }
})

/* ── Validation (the Blade's resetValidation / resetAllValidations / inputChecker) ── */
const EMAIL_RE = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/

function inputChecker() {
  if (f.year) dis.make = false
  if (f.make) dis.model = false
  if (f.model) dis.trim = false
}

function resetAllValidations() {
  for (const k of FIELDS) err[k] = ''
}

function resetValidation(id: Field) {
  err[id] = ''
  inputChecker()
  const value = f[id]
  if (id === 'mobile_number') {
    if (value === '') err.mobile_number = 'The Mobile/Primary Number is required'
    else if (value.replace(/\D/g, '').length < 10) err.mobile_number = 'Phone Number must be 10 digits'
  }
  if (id === 'vin_number' && value === '') err.vin_number = 'Please Enter your Vehicle Vin'

  if (noVin.value) {
    if (id === 'year' && !f.year) err.year = 'The Year is required'
    if (id === 'make') {
      if (!f.make) err.make = 'The Make is required'
      else if (f.make === 'Other' && !f.manual_make) err.manual_make = 'The Make is required'
    }
    if (id === 'model') {
      if (!f.model) err.model = 'The Model is required'
      else if (f.model === 'Other' && !f.manual_model) err.manual_model = 'The Model is required'
    }
    if (id === 'trim') {
      if (!f.trim) err.trim = 'The Trim is required'
      else if (f.trim === 'Other' && !f.manual_trim) err.manual_trim = 'The Trim is required'
    }
    if (id === 'mileage' && !f.mileage) err.mileage = 'The Mileage is required'
    if (id === 'condition' && !f.condition) err.condition = 'The Condition is required'
  }

  if (id === 'firstname' && !f.firstname) err.firstname = 'The First Name is required'
  if (id === 'lastname' && !f.lastname) err.lastname = 'The Last Name is required'
  if (id === 'email') {
    if (!f.email) err.email = 'The Email Address is required'
    else if (!EMAIL_RE.test(f.email)) err.email = 'The Email Address is invalid'
  }
}

/* ── VIN yes / no ── */
function onchangeHasVin(value: 0 | 1) {
  resetAllValidations()
  hasVin.value = value
  storeShown.value = true
  if (value === 1) {
    decodeShown.value = true
    stepsShown.value = false
    vinDivShown.value = true
    noVinShown.value = false
  } else {
    decodeShown.value = false
    stepsShown.value = true
    vinDivShown.value = false
    noVinShown.value = true
  }
  f.vin_number = ''
  f.year = ''
  f.make = ''
  dis.make = true
  f.model = ''
  dis.model = true
  f.trim = ''
  dis.trim = true
  f.drivetrain = ''
  f.mileage = ''
  f.condition = ''
  f.manual_make = ''
  f.manual_model = ''
  f.manual_trim = ''
  manualShown.make = false
  manualShown.model = false
  manualShown.trim = false
}

/* ── The cascade ── */
function onYearChange() {
  resetValidation('year')
  f.make = ''
  err.make = ''
  f.model = ''
  dis.model = true
  err.model = ''
  f.trim = ''
  dis.trim = true
  err.trim = ''
  // The Blade then fetches models only if a make is chosen, but it has just cleared the make: nothing more.
}

async function onMakeChange() {
  resetValidation('make')
  f.manual_make = ''
  f.manual_model = ''
  f.manual_trim = ''
  manualShown.make = f.make === 'Other'
  manualShown.model = false
  manualShown.trim = false
  err.manual_make = ''
  err.manual_model = ''
  err.manual_trim = ''
  f.model = ''
  err.model = ''
  f.trim = ''
  dis.trim = true
  err.trim = ''

  const makeid = makeOpts.value.find((o) => o.value === f.make && !o.disabled)?.makeid
  const selected = allMakes.find((m) => m.id === makeid)
  const modelPh = ph('Select your Vehicle Model')
  const trimPh = ph('Select your Vehicle Trim')
  if (!selected) {
    modelOpts.value = [modelPh]
    trimOpts.value = [trimPh]
    f.model = ''
    f.trim = ''
    return
  }
  if (!selected.title) return
  try {
    const res = await $fetch<{ result?: any[] }>('/api/site/trade/models', {
      query: { make: selected.title, modelyear: String(parseInt(f.year)), period: 0, vehicletype: 'UsedCar' },
    })
    modelOpts.value = [modelPh, ...(res?.result ?? []).map((m: any) => ({ value: String(m?.model ?? ''), label: String(m?.model ?? '') }))]
    trimOpts.value = [trimPh]
    f.model = ''
    f.trim = ''
  } catch {
    // The Blade's call has no error handler: the lists stay as they were.
  }
}

/** The Blade's parseTrimFromBody (a trim name from a JD Power body, when the row has no label). */
function parseTrimFromBody(body: string): string {
  const prefixRegex = /^(Sedan|Coupe|Convertible|Utility|Hatchback|Truck|Van|Wagon)\s+\dD\s+/i
  const drivetrainRegex = /\b(AWD|FWD|RWD|4WD)\b/gi
  const engineRegex = /\d+(\.\d+)?L\s+[A-Z0-9]+\s*(Turbo|Supercharged|Hybrid)?(\s*(Auto|Manual|CVT|Hybrid))?/gi
  let b = body.replace(prefixRegex, '')
  b = b.replace(drivetrainRegex, '')
  b = b.replace(engineRegex, '')
  b = b.replace(/\s+/g, ' ')
  return b.trim() || 'Base'
}

async function onModelChange() {
  resetValidation('model')
  f.manual_model = ''
  f.manual_trim = ''
  manualShown.model = f.model === 'Other'
  manualShown.trim = false
  err.manual_model = ''
  err.manual_trim = ''

  const loading: Opt[] = [{ value: 'Loading trims...', label: 'Loading trims...' }]
  trimOpts.value = loading
  f.trim = firstValue(loading)
  try {
    const res = await $fetch<{ status?: string; result?: any[] }>('/api/site/trade/trims', {
      query: { period: 0, vehicletype: 'UsedCar', modelyear: String(parseInt(f.year)), make: f.make, model: f.model },
    })
    const opts: Opt[] = [ph('Select your Vehicle Trim')]
    if (res?.status === 'success' && Array.isArray(res.result)) {
      currentTrims = res.result
      const seen = new Set<string>()
      for (const item of res.result) {
        const parsed = item?.label || parseTrimFromBody(item?.body || 'Unknown Trim')
        if (!seen.has(parsed)) {
          seen.add(parsed)
          opts.push({ value: parsed, label: parsed })
        }
      }
    } else {
      opts.push({ value: '', label: 'No trims found' })
    }
    trimOpts.value = opts
    f.trim = firstValue(opts)
  } catch {
    // No error handler in the Blade: "Loading trims..." stays.
  }
}

async function onTrimChange() {
  resetValidation('trim')
  f.manual_trim = ''
  manualShown.trim = f.trim === 'Other'
  err.manual_trim = ''

  // The Blade's currenttrims.find() throws (and stops) until a trim list has loaded.
  if (!Array.isArray(currentTrims)) return
  const vehicleObj = currentTrims.find((item: any) => item?.label === f.trim)
  if (vehicleObj) currentVehicleId = vehicleObj.ucgvehicleid

  const loading: Opt[] = [{ value: 'Loading...', label: 'Loading...' }]
  drivetrainOpts.value = loading
  f.drivetrain = firstValue(loading)
  try {
    const res = await $fetch<{ status?: string; data?: { drivetype?: string | null }[] }>('/api/site/trade/drivetrain', {
      query: { vehicleID: String(currentVehicleId), period: 0, region: 8 },
    })
    if (res?.status === 'success' && Array.isArray(res.data) && res.data.length > 0) {
      const opts: Opt[] = [ph('Select Drive Train'), ...res.data.map((v) => ({ value: v.drivetype ?? 'Unknown', label: v.drivetype ?? 'Unknown' }))]
      drivetrainOpts.value = opts
      f.drivetrain = res.data[0]?.drivetype ? String(res.data[0].drivetype) : firstValue(opts)
    } else {
      const opts: Opt[] = [{ value: '', label: 'No drivetrain data found' }]
      drivetrainOpts.value = opts
      f.drivetrain = ''
    }
  } catch (e) {
    console.error('Error fetching drivetrain data:', e)
    drivetrainOpts.value = [{ value: '', label: 'Error loading data' }]
    f.drivetrain = ''
  }
}

/* ── Field formatting ── */
/** helpers.js mileageInputEvent: thousands separators; anything not a number empties the box. */
function onMileageInput(e: Event) {
  const input = e.target as HTMLInputElement
  const val = input.value.replace(/,/g, '')
  input.value = !Number.isNaN(Number(val)) && val !== '' ? Number(val).toLocaleString() : ''
  f.mileage = input.value
}

/** Keys that edit or navigate rather than insert a character. */
function isEditingKey(event: KeyboardEvent) {
  const editing = ['Backspace', 'Delete', 'Tab', 'Enter', 'Escape', 'Home', 'End', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']
  return editing.includes(event.key) || event.ctrlKey || event.metaKey || !event.key || event.key.length > 1
}

function enforceFormat(event: KeyboardEvent) {
  if (isEditingKey(event)) return
  if (event.key < '0' || event.key > '9') event.preventDefault()
}

/** (xxx) xxx-xxxx from the first ten digits; no digits empties the box. */
function formatToPhone(e: Event) {
  const target = e.target as HTMLInputElement
  const input = target.value.replace(/\D/g, '').substring(0, 10)
  const zip = input.substring(0, 3)
  const middle = input.substring(3, 6)
  const last = input.substring(6, 10)
  if (input.length > 6) target.value = `(${zip}) ${middle}-${last}`
  else if (input.length > 3) target.value = `(${zip}) ${middle}`
  else if (input.length > 0) target.value = `(${zip}`
  else target.value = ''
  f.mobile_number = target.value
}

function onZipInput(e: Event) {
  const target = e.target as HTMLInputElement
  target.value = target.value.replace(/\D/g, '').slice(0, 5)
  f.zipcode = target.value
}

/* ── Steps ── */
function scrollTop() {
  window.scrollTo(0, 0)
}

function currentStepChecker(s: number) {
  step.value = s
  if (s === 1) {
    decodeShown.value = hasVin.value === 1
    stepsShown.value = hasVin.value !== 1
  }
  if (s === 2) {
    decodeShown.value = false
    stepsShown.value = true
  }
}

function previousStep() {
  scrollTop()
  currentStepChecker(step.value - 1)
}

function nextStep() {
  formValidation()
}

/** The sales site's formValidation(): step 1 always moves on; step 2 (with the SMS consent) "submits". */
function salesFormValidation() {
  let s = step.value
  if (s === 1) {
    s++
    scrollTop()
  } else if (s === 2) {
    if (!smsConsent.value) return
    salesFormSubmit()
  }
  currentStepChecker(s)
}

function formValidation() {
  if (isSales.value) return salesFormValidation()
  let counter = 0
  let s = step.value
  if (s === 2 && !smsConsent.value) return
  if (s === 1) {
    if (noVin.value) {
      if (!f.year) {
        err.year = 'The Year is required'
        counter++
      }
      if (!f.make) {
        err.make = 'The Make is required'
        counter++
      } else if (f.make === 'Other' && !f.manual_make) {
        err.manual_make = 'The Make is required'
        counter++
      }
      if (!f.model) {
        err.model = 'The Model is required'
        counter++
      } else if (f.model === 'Other' && !f.manual_model) {
        err.manual_model = 'The Model is required'
        counter++
      }
      if (!f.trim) {
        err.trim = 'The Trim is required'
        counter++
      } else if (f.trim === 'Other' && !f.manual_trim) {
        err.manual_trim = 'The Trim is required'
        counter++
      }
      if (!f.mileage) {
        err.mileage = 'The Mileage is required'
        counter++
      }
      if (!f.condition) {
        err.condition = 'The Condition is required'
        counter++
      }
      if (isMulti.value && !f.store_location) {
        err.store_location = 'The Store Location is required'
        counter++
      }
      if (counter <= 0) {
        s++
        scrollTop()
      }
    }
  } else if (s === 2) {
    if (!f.firstname) {
      err.firstname = 'The First Name is required'
      counter++
    }
    if (!f.lastname) {
      err.lastname = 'The Last Name is required'
      counter++
    }
    if (!f.email) {
      err.email = 'The Email Address is required'
      counter++
    } else if (!EMAIL_RE.test(f.email)) {
      err.email = 'The Email Address is invalid'
      counter++
    }
    if (!f.mobile_number) {
      err.mobile_number = 'The Mobile/Primary Number is required'
      counter++
    } else if (f.mobile_number.replace(/\D/g, '').length < 10) {
      err.mobile_number = 'Phone Number Must Be 10 digits'
      counter++
    }
    const zipcode = f.zipcode.trim()
    err.zipcode = ''
    if (zipcode !== '') {
      if (!/^\d+$/.test(zipcode)) {
        err.zipcode = 'Zipcode must contain only numbers'
        counter++
      } else if (zipcode.length < 5) {
        err.zipcode = 'Zipcode must be at least 5 digits'
        counter++
      }
    }
    if (counter <= 0) formSubmit()
  }
  currentStepChecker(s)
}

/* ── VIN decode (the Blade's decodeVin) ── */
async function decodeVin() {
  if (isSales.value) {
    // The sales site's decodeVin(): no decode, the demo notice, then step 2.
    demoNotice.value = true
    scrollTop()
    currentStepChecker(step.value + 1)
    return
  }
  decoding.value = true
  if (hasVin.value !== 1) return
  let counter = 0
  if (f.vin_number === '') {
    err.vin_number = 'Please Enter your Vehicle Vin'
    counter++
  }
  if (isMulti.value && !f.store_location) {
    err.store_location = 'The Store Location is required'
    counter++
  }
  if (counter > 0) {
    decoding.value = false
    return
  }
  try {
    const res = await $fetch<{ status?: string; data?: Record<string, any> }>('/api/site/sell/vin-decode', {
      query: { vin: f.vin_number },
    })
    if (res?.status === 'success' && res.data) {
      const d = res.data
      if (d.modelyear) decoded.year = String(d.modelyear)
      if (d.make) decoded.make = d.make
      if (d.model) decoded.model = d.model
      if (d.body) decoded.trim = d.body
      if (d.drivetype) decoded.drivetrain = d.drivetype
      decoded.mileage = ''
      decoded.condition = ''
      decoding.value = false
      err.vin_number = ''
      swal.value = { icon: 'success', title: 'Success!', text: 'Vin Successfully Decoded', confirmButtonText: 'Continue' }
    } else {
      decoding.value = false
      err.vin_number = 'Please Enter a valid VIN'
    }
  } catch {
    decoding.value = false
    err.vin_number = 'Failed to decode VIN. Please try again.'
  }
}

/** "Continue" on the pop-up: the Blade clicks Next (step 1 with a VIN: nothing to check), then goes to step 2. */
function onDecodeConfirmed() {
  nextStep()
  scrollTop()
  currentStepChecker(step.value + 1)
}

/* ── Image upload (the hidden #upload_sellcar_image form) ── */
function onUploadChange(e: Event) {
  if (isSales.value) {
    // The sales site uploads nothing: a sample photo and the demo notice.
    carFeaturesImage.value = 'demo'
    imagePreview.value = '/media/images/company/exv3.jpg'
    demoNotice.value = true
    return
  }
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (imagePreview.value) URL.revokeObjectURL(imagePreview.value)
  imagePreview.value = URL.createObjectURL(file)
  // TODO(forms): POST {API}/api/uploadsellcar_image (multipart `file` + `company_name`; see data-map.md "Form
  // endpoints"), then set carFeaturesImage to the returned file name; the preview is then
  // {media}/media/company/{company.id}/sell_car/{name}.
}
onBeforeUnmount(() => {
  if (imagePreview.value) URL.revokeObjectURL(imagePreview.value)
})

/* ── Submit ── */
function formSubmit() {
  const vin = hasVin.value === 1
  const pick = (sel: string, manual: string) => (sel !== 'Other' ? sel : manual)
  const data: Record<string, unknown> = {
    company_id: String(company.value.id),
    has_vin_number: hasVin.value,
    vin_number: f.vin_number,
    has_license_plate: 0,
    license_plate: '',
    state: '',
    year: vin ? decoded.year : f.year,
    make: vin ? decoded.make : pick(f.make, f.manual_make),
    model: vin ? decoded.model : pick(f.model, f.manual_model),
    trim: vin ? decoded.trim : pick(f.trim, f.manual_trim),
    style: '',
    mileage: vin ? decoded.mileage : f.mileage,
    transmission: '',
    exterior_color: '',
    vin: vin ? f.vin_number : decoded.vin,
    interior_color: '',
    drivetrain: vin ? decoded.drivetrain : f.drivetrain,
    condition: vin ? decoded.condition : f.condition,
    car_features_image: carFeaturesImage.value || undefined,
    firstname: f.firstname,
    lastname: f.lastname,
    email: f.email,
    mobile_number: f.mobile_number,
    zipcode: f.zipcode,
    currentvehicleid: currentVehicleId,
    source: window.location.hostname,
    sms_consent: smsConsent.value ? 1 : 0,
  }
  if (isMulti.value) data.location_id = f.store_location
  // TODO(forms): POST {API}/api/v2/website/forms/sell-my-car with `data` as JSON (see data-map.md "Form endpoints").
  // The Blade then shows "Submitting..." on the button; on `is_success == '1'` it hides the form, shows #submit-message
  // and the Thank You modal (UiAlertModal below: exv3.jpg, "{year} {make} {model} {trim drivetrain}", Year / Make /
  // Model / Trim / VIN / Mileage); otherwise an "Error!" pop-up with the API's message.
  void data
}

/** Previous / Next: the client site's classes, and the sales site's (the page's CSS restyles both alike). */
const CLIENT_STEP_BTN =
  'flex-1 lg:flex-none flex justify-center px-5 py-3 company-primary-base-background rounded-sm text-white focus:outline-hidden focus:ring-2 focus:ring-pink-300 disabled:opacity-50 disabled:cursor-not-allowed'
const SALES_STEP_BTN =
  'flex-1 lg:flex-none disabled:opacity-50 disabled:cursor-not-allowed md:flex-none flex justify-center company-primary-base-background text-white font-bold py-2 px-4 rounded-sm focus:outline-hidden'

/** The sales site's formSubmit(): nothing is sent (its Blade has no request at all), the demo notice opens. */
function salesFormSubmit() {
  demoNotice.value = true
}

const alertVehicle = { image: '', title: '', vin: '', mileage: '', year: '', make: '', model: '', trim: '' }
</script>

<template>
  <div class="sell-form-col">
    <form id="sellusyourcarform" class="sell-card" @submit.prevent>
      <div class="sell-steps">
        <div class="sell-step sell-step--1">
          <span id="step-bubble-1" class="step" :class="{ active: step === 1 }">1</span>
          <div><small>STEP 1</small><strong>Your Vehicle</strong></div>
        </div>
        <span class="sell-steps-line" aria-hidden="true" />
        <div class="sell-step sell-step--2">
          <span id="step-bubble-2" class="step" :class="{ active: step === 2 }">2</span>
          <div><small>STEP 2</small><strong>Your Contact Info</strong></div>
        </div>
      </div>
      <div class="sell-progress">
        <span class="sell-progress-bar" aria-hidden="true"><span /></span>
        <span class="sell-progress-txt"><span class="sell-sr">Step <span id="step-count">{{ step }}</span> of 2, </span><b class="sell-pct" /> complete</span>
      </div>

      <!-- Step 1: Your Vehicle -->
      <div class="taboption" :class="{ 'is-shown': step === 1 }">
        <div v-if="isMulti && !isSales" id="store_location_div" class="input-container mt-2.5">
          <label class="form-label text-sm font-bold">Store Location <span class="required-indicator">*</span></label>
          <select
            id="store_location"
            v-model="f.store_location"
            name="store_location"
            class="mt-2.5 input"
            :class="{ 'input-error': err.store_location }"
            @change="resetValidation('store_location')"
          >
            <option value="" disabled>Select Store Location</option>
            <option v-for="loc in mainCompany" :key="String(loc.id)" :value="String(loc.id)">{{ locationLabel(loc) }}</option>
          </select>
          <span id="store_location_validation_text" class="validation-text">{{ err.store_location }}</span>
        </div>
        <div class="input-container">
          <label class="sell-q">Do you know the Vehicle Identification Number (VIN) of your vehicle?</label>
          <div class="sell-opts">
            <label class="sell-opt">
              <input id="has_vin_number" type="radio" value="1" name="has_vin_number" :checked="hasVin === 1" @change="onchangeHasVin(1)" />
              <span><strong>Yes</strong><small>I have my VIN handy</small></span>
            </label>
            <label class="sell-opt">
              <input id="has_vin_number" type="radio" value="0" name="has_vin_number" :checked="hasVin === 0" @change="onchangeHasVin(0)" />
              <span><strong>No</strong><small>I'll enter year, make &amp; model</small></span>
            </label>
          </div>
          <p class="sell-vin-note">
            <Icon name="ion:information-circle-outline" aria-hidden="true" />
            Your VIN is on the driver-side dashboard, door jamb, registration, or insurance card.
          </p>
        </div>

        <div id="vin_div" class="input-container mt-2.5" :class="{ nodisplay: !vinDivShown }">
          <label class="form-label text-sm font-bold">Vehicle Identification Number (VIN) <span class="required-indicator">*</span></label>
          <input
            id="vin_number"
            v-model="f.vin_number"
            type="text"
            class="mt-2.5 input"
            :class="{ 'input-error': err.vin_number }"
            name="vin_number"
            placeholder="Enter your Vehicle VIN"
            :required="hasVin === 1"
            @keyup="resetValidation('vin_number')"
          />
          <span id="vin_number_validation_text" class="validation-text">{{ err.vin_number }}</span>
        </div>
        <div id="no_vin_no_platenumber" :class="{ nodisplay: !noVinShown }">
          <div class="input-container mt-2.5">
            <label class="form-label text-sm font-bold">Year <span class="required-indicator">*</span></label>
            <select id="year" v-model="f.year" name="year" class="mt-2.5 input" :class="{ 'input-error': err.year }" @change="onYearChange">
              <option value="" disabled>Select your Vehicle Year</option>
              <option v-for="y in YEARS" :key="y" :value="y">{{ y }}</option>
            </select>
            <span id="year_validation_text" class="validation-text">{{ err.year }}</span>
          </div>

          <div class="input-container mt-2.5">
            <label class="form-label text-sm font-bold">Make <span class="required-indicator">*</span></label>
            <select
              id="make"
              v-model="f.make"
              name="make"
              class="mt-2.5 input"
              :class="{ 'input-error': err.make }"
              :disabled="dis.make"
              @change="onMakeChange"
            >
              <option v-for="(o, i) in makeOpts" :key="i" :value="o.value" :disabled="o.disabled" :data-makeid="o.makeid">{{ o.label }}</option>
            </select>
            <span id="make_validation_text" class="validation-text">{{ err.make }}</span>
            <input
              id="manual_make"
              v-model="f.manual_make"
              type="text"
              class="mt-2.5 input"
              :class="{ hidden: !manualShown.make, 'input-error': err.manual_make }"
              name="manual_make"
              placeholder="Enter Your Vehicle Make"
              @keyup="resetValidation('manual_make')"
            />
            <span id="manual_make_validation_text" class="validation-text">{{ err.manual_make }}</span>
          </div>

          <div class="input-container mt-2.5">
            <label class="form-label text-sm font-bold">Model <span class="required-indicator">*</span></label>
            <select
              id="model"
              v-model="f.model"
              name="model"
              class="mt-2.5 input"
              :class="{ 'input-error': err.model }"
              :disabled="dis.model"
              @change="onModelChange"
            >
              <option v-for="(o, i) in modelOpts" :key="i" :value="o.value" :disabled="o.disabled">{{ o.label }}</option>
            </select>
            <span id="model_validation_text" class="validation-text">{{ err.model }}</span>
            <input
              id="manual_model"
              v-model="f.manual_model"
              type="text"
              class="mt-2.5 input"
              :class="{ hidden: !manualShown.model, 'input-error': err.manual_model }"
              name="manual_model"
              placeholder="Enter Your Vehicle Model"
              @keyup="resetValidation('manual_model')"
            />
            <span id="manual_model_validation_text" class="validation-text">{{ err.manual_model }}</span>
          </div>

          <div class="input-container mt-2.5">
            <label class="form-label text-sm font-bold">Trim <span class="required-indicator">*</span></label>
            <select
              id="trim"
              v-model="f.trim"
              name="trim"
              class="mt-2.5 input"
              :class="{ 'input-error': err.trim }"
              placeholder="Enter your Vehicle Trim"
              :disabled="dis.trim"
              @change="onTrimChange"
            >
              <option v-for="(o, i) in trimOpts" :key="i" :value="o.value" :disabled="o.disabled">{{ o.label }}</option>
            </select>
            <span id="trim_validation_text" class="validation-text">{{ err.trim }}</span>
            <input
              id="manual_trim"
              v-model="f.manual_trim"
              type="text"
              class="mt-2.5 input"
              :class="{ hidden: !manualShown.trim, 'input-error': err.manual_trim }"
              name="manual_trim"
              placeholder="Enter Your Vehicle Trim"
              @keyup="resetValidation('manual_trim')"
            />
            <span id="manual_trim_validation_text" class="validation-text">{{ err.manual_trim }}</span>
          </div>

          <div class="input-container mt-2.5">
            <label class="form-label text-sm font-bold">Drivetrain</label>
            <select
              id="drivetrain"
              v-model="f.drivetrain"
              name="drivetrain"
              class="mt-2.5 input"
              :class="{ 'input-error': err.drivetrain }"
              @change="resetValidation('drivetrain')"
            >
              <option v-for="(o, i) in drivetrainOpts" :key="i" :value="o.value" :disabled="o.disabled">{{ o.label }}</option>
            </select>
            <span id="drivetrain_validation_text" class="validation-text">{{ err.drivetrain }}</span>
          </div>

          <div class="input-container mt-2.5">
            <label class="form-label text-sm font-bold">Mileage <span class="required-indicator">*</span></label>
            <input
              id="mileage"
              type="text"
              name="mileage"
              class="mt-2.5 input"
              :class="{ 'input-error': err.mileage }"
              :value="f.mileage"
              placeholder="Enter your Vehicle Mileage"
              @input="onMileageInput"
              @keyup="resetValidation('mileage')"
            />
            <span id="mileage_validation_text" class="validation-text">{{ err.mileage }}</span>
          </div>

          <div class="input-container mt-2.5">
            <label class="form-label text-sm font-bold">Condition <span class="required-indicator">*</span></label>
            <select
              id="condition"
              v-model="f.condition"
              name="condition"
              class="mt-2.5 input"
              :class="{ 'input-error': err.condition }"
              @change="resetValidation('condition')"
            >
              <option value="" disabled>Select your Vehicle Condition</option>
              <option v-for="c in CONDITIONS" :key="c" :value="c">{{ c }}</option>
            </select>
            <span id="condition_validation_text" class="validation-text">{{ err.condition }}</span>
          </div>
        </div>
        <div
          v-if="isMulti && isSales"
          id="store_location_div"
          class="input-container mt-2.5"
          :class="{ nodisplay: !storeShown }"
        >
          <label class="form-label text-sm font-bold">Store Location <span class="required-indicator">*</span></label>
          <select
            id="store_location"
            v-model="f.store_location"
            name="store_location"
            class="mt-2.5 input"
            :class="{ 'input-error': err.store_location }"
            @change="resetValidation('store_location')"
          >
            <option value="" disabled>Select Store Location</option>
            <option v-for="loc in mainCompany" :key="String(loc.id)" :value="String(loc.id)">{{ loc.name }}</option>
          </select>
          <span id="store_location_validation_text" class="validation-text">{{ err.store_location }}</span>
        </div>
      </div>

      <!-- Step 2: Your Contact Info -->
      <div class="taboption" :class="{ 'is-shown': step === 2 }">
        <div class="input-container">
          <label class="sell-q">How may we contact you with your appraisal?</label>
        </div>

        <div class="sell-grid">
          <div class="input-container mt-2.5">
            <label class="form-label text-sm font-bold">First Name <span class="required-indicator">*</span></label>
            <input
              id="firstname"
              v-model="f.firstname"
              type="text"
              class="mt-2.5 input"
              :class="{ 'input-error': err.firstname }"
              name="firstname"
              placeholder="Enter your First Name"
              @keyup="resetValidation('firstname')"
            />
            <span id="firstname_validation_text" class="validation-text">{{ err.firstname }}</span>
          </div>
          <div class="input-container mt-2.5">
            <label class="form-label text-sm font-bold">Last Name <span class="required-indicator">*</span></label>
            <input
              id="lastname"
              v-model="f.lastname"
              type="text"
              class="mt-2.5 input"
              :class="{ 'input-error': err.lastname }"
              name="lastname"
              placeholder="Enter your Last Name"
              @keyup="resetValidation('lastname')"
            />
            <span id="lastname_validation_text" class="validation-text">{{ err.lastname }}</span>
          </div>
          <div class="input-container mt-2.5">
            <label class="form-label text-sm font-bold">Email <span class="required-indicator">*</span></label>
            <input
              id="email"
              v-model="f.email"
              type="text"
              class="mt-2.5 input"
              :class="{ 'input-error': err.email }"
              name="email"
              placeholder="Enter your Email Address"
              autocorrect="off"
              autocapitalize="none"
              @keyup="resetValidation('email')"
            />
            <span id="email_validation_text" class="validation-text">{{ err.email }}</span>
          </div>
          <div class="input-container mt-2.5">
            <label class="form-label text-sm font-bold">Mobile/Primary Number <span class="required-indicator">*</span></label>
            <input
              id="mobile_number"
              type="text"
              maxlength="16"
              class="mt-2.5 input"
              :class="{ 'input-error': err.mobile_number }"
              name="mobile_number"
              inputmode="numeric"
              :value="f.mobile_number"
              placeholder="Enter your Mobile Number"
              @keydown="enforceFormat"
              @input="formatToPhone"
              @keyup="resetValidation('mobile_number')"
            />
            <span id="mobile_number_validation_text" class="validation-text">{{ err.mobile_number }}</span>
          </div>
          <div class="input-container mt-2.5">
            <label class="form-label text-sm font-bold">Zipcode</label>
            <input
              id="zipcode"
              type="text"
              class="mt-2.5 input"
              :class="{ 'input-error': err.zipcode }"
              name="zipcode"
              :value="f.zipcode"
              placeholder="Enter your Zip Code"
              @input="onZipInput"
              @keyup="resetValidation('zipcode')"
            />
            <span id="zipcode_validation_text" class="validation-text">{{ err.zipcode }}</span>
          </div>
        </div>
      </div>

      <div id="nextprevious" style="overflow: auto">
        <div v-show="decodeShown" id="button_for_decode">
          <div class="w-full flex gap-2 justify-end" style="margin-top: 20px">
            <button
              id="button_for_decode_function"
              class="flex-1 lg:flex-none flex justify-center px-5 py-3 company-primary-base-background rounded-sm text-white focus:outline-hidden focus:ring-2 focus:ring-pink-300 disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
              :disabled="decoding"
              @click="decodeVin"
            >
              {{ decoding ? 'Decoding...' : 'Next' }}
            </button>
          </div>
        </div>
        <div id="sell-sms-consent" class="pt-3" :class="{ hidden: step !== 2 }">
          <UiSmsConsent id="sell_sms_consent" v-model="smsConsent" />
        </div>
        <div v-show="stepsShown" id="buttons_for_step">
          <div class="w-full flex gap-2 justify-between">
            <button
              id="prevBtn"
              :class="isSales ? SALES_STEP_BTN : CLIENT_STEP_BTN"
              type="button"
              :style="{ display: step === 1 ? 'none' : 'inline' }"
              @click="previousStep"
            >
              Previous
            </button>
            <button
              id="nextBtn"
              :class="isSales ? SALES_STEP_BTN : CLIENT_STEP_BTN"
              class="ml-auto"
              type="button"
              :disabled="step === 2 && !smsConsent"
              @click="nextStep"
            >
              {{ step === 2 ? 'Submit' : 'Next' }}
            </button>
          </div>
        </div>
      </div>
    </form>

    <div id="submit-message" class="hidden sell-card">
      <h3 class="flex items-center justify-center h-28">Thank You!</h3>
    </div>

    <!-- <x-alert-component>: shown after a successful submit (not sent yet). -->
    <UiAlertModal
      :show="false"
      title="Thank You!"
      description="Your appraisal request has been submitted successfully."
      :vehicle="alertVehicle"
      :logo-path="mediaUrl(company.logo)"
      bottom-description="A representative from the dealership will contact you shortly"
    />

    <form id="upload_sellcar_image" enctype="multipart/form-data" method="post" style="display: none" @submit.prevent>
      <div class="form-group">
        <input type="hidden" name="company_name" :value="company.name" />
        <input
          id="file"
          type="file"
          name="file"
          class="appearance-none border border-gray-200 rounded-sm w-full py-2 px-3 text-gray-700 leading-tight focus:outline-hidden"
          @change="onUploadChange"
        />
      </div>
    </form>

    <UiSwal v-model="swal" @confirm="onDecodeConfirmed" />
    <UiDemoNoticeModal v-if="isSales" v-model="demoNotice" body-font />
  </div>
</template>
