<script setup lang="ts">
/**
 * The sales site's (:8003) "I'm interested" form on the vehicle page: the contact fields and a "Dealer Info" section
 * (job title, a dealership-name typeahead, address with Google Places, city, state, zip) instead of the client
 * site's trade-in. The vehicle page uses it in place of InquiryForm when the site is sales.
 *  - variant 'panel': the form under the price (the sales global/cars/vdp-contact-form.blade.php, an inline Alpine
 *    form). Errors show on Submit and clear as the field is typed in.
 *  - variant 'modal': the I'm Interested pop-up's card (the sales global/show/form.blade.php: the bundle's
 *    `im_interested` and the page's jQuery dealer helpers). Contact errors show after the first Submit and update on
 *    keyup; the dealer errors show on Submit only. Closing clears the errors and the dealer fields.
 *
 * Both: Submit stays disabled until the SMS consent is ticked. The dealership list is /api/site/vehicle/dealership-list
 * (the sales `/frontend/dealership-list`), a picked address's zip asks /api/site/vehicle/zip-timezone; the address
 * autocomplete runs when the server has a Maps key.
 *
 * `isDemo` (the sales Laravel `AppConfig.isDemo`: COMPANY_INFO === 'Sales Template Live Demo'): Submit opens the
 * "Demo Only" notice (the pop-up checks the dealer fields first). Otherwise it validates and stops at the TODO(forms).
 */
const props = withDefaults(
  defineProps<{ vehicle: Record<string, any>; variant?: 'modal' | 'panel'; isDemo?: boolean }>(),
  { variant: 'modal', isDemo: false },
)
const emit = defineEmits<{ close: [] }>()

const { company, site } = useSite()

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
const demoNotice = ref(false)
/** The pop-up re-checks on every keyup once Submit was pressed (im_interested `alreadySubmit`). */
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

/** (xxx) xxx-xxxx from the first ten digits. The panel empties a box with no digits; the pop-up leaves it. */
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

function onModalKeyup() {
  if (alreadySubmit.value) validateContact()
}

/* ── Dealer Info ── */
const JOB_TITLES: [string, string][] = [
  ['Owner', 'Owner'],
  ['GM', 'General Manager'],
  ['GSM', 'General Sales Manager'],
  ['Sales Manager', 'Sales Manager'],
  ['Finance Manager', 'Finance Manager'],
  ['Internet Manager', 'Internet Manager'],
  ['BDC Manager', 'BDC Manager'],
  ['Service Manager', 'Service Manager'],
  ['Office Manager', 'Office Manager'],
]
const dealer = reactive({
  jobTitle: '',
  name: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  timezone: '',
  country: '',
  county: '',
  region: '',
})
const selectedDealershipId = ref<string | null>(null)
const dealerError = reactive({ jobTitle: '', name: '', address: '', city: '', state: '', zip: '' })
type DealerField = keyof typeof dealerError
const DEALER_MESSAGES: Record<DealerField, string> = {
  jobTitle: 'Job Title is required',
  name: 'Dealership Name is required',
  address: 'Address is required',
  city: 'City is required',
  state: 'State is required',
  zip: 'Zip is required',
}

/** validateDealer() / validateDealerStep(): every dealer field is required. */
function validateDealer(): boolean {
  let valid = true
  for (const k of Object.keys(dealerError) as DealerField[]) {
    const empty = !String(dealer[k] ?? '').trim()
    dealerError[k] = empty ? DEALER_MESSAGES[k] : ''
    if (empty) valid = false
  }
  return valid
}

/** resetDealerFields() / resetShowDealerForm(). */
function resetDealer() {
  for (const k of Object.keys(dealer) as (keyof typeof dealer)[]) dealer[k] = ''
  for (const k of Object.keys(dealerError) as DealerField[]) dealerError[k] = ''
  selectedDealershipId.value = null
}

/* The dealership typeahead: the list once per page, the first ten names containing the text. */
interface Dealership {
  dealership_id: string | number
  dealership_name: string
  dealership_address: string
  dealership_city: string
  dealership_state: string
  dealership_zip: string
}
function loadDealerships(): Promise<Dealership[]> {
  const w = window as any
  if (!w.__dlDealerships) {
    w.__dlDealerships = $fetch<Dealership[]>('/api/site/vehicle/dealership-list')
      .then((d) => (Array.isArray(d) ? d : []))
      .catch(() => [])
  }
  return w.__dlDealerships
}
const allDealerships = ref<Dealership[]>([])
const matches = ref<Dealership[]>([])
const dropdownOpen = ref(false)

function onDealerNameInput() {
  if (props.variant === 'panel') dealerError.name = ''
  selectedDealershipId.value = null
  const q = dealer.name.trim().toLowerCase()
  if (!q) {
    dropdownOpen.value = false
    matches.value = []
    return
  }
  matches.value = allDealerships.value
    .filter((d) => d.dealership_name && d.dealership_name.toLowerCase().includes(q))
    .slice(0, 10)
  dropdownOpen.value = matches.value.length > 0
}

function pickDealership(d: Dealership) {
  selectedDealershipId.value = d.dealership_id ? String(d.dealership_id) : null
  dealer.name = d.dealership_name || ''
  dealer.address = d.dealership_address || ''
  dealer.city = d.dealership_city || ''
  dealer.state = d.dealership_state || ''
  dealer.zip = d.dealership_zip || ''
  dropdownOpen.value = false
  matches.value = []
}

function onDealerNameBlur() {
  setTimeout(() => {
    dropdownOpen.value = false
  }, 150)
}

/* The address autocomplete (Google Places, US addresses), when the server has a Maps key. */
const STATE_TZ: Record<string, string> = {
  CT: 'EST', DE: 'EST', FL: 'EST', GA: 'EST', IN: 'EST', KY: 'EST', ME: 'EST', MD: 'EST', MA: 'EST', MI: 'EST',
  NH: 'EST', NJ: 'EST', NY: 'EST', NC: 'EST', OH: 'EST', PA: 'EST', RI: 'EST', SC: 'EST', TN: 'EST', VT: 'EST',
  VA: 'EST', WV: 'EST', DC: 'EST',
  AL: 'CST', AR: 'CST', IL: 'CST', IA: 'CST', KS: 'CST', LA: 'CST', MN: 'CST', MS: 'CST', MO: 'CST', NE: 'CST',
  ND: 'CST', OK: 'CST', SD: 'CST', TX: 'CST', WI: 'CST',
  AZ: 'MST', CO: 'MST', ID: 'MST', MT: 'MST', NM: 'MST', UT: 'MST', WY: 'MST',
  CA: 'PST', NV: 'PST', OR: 'PST', WA: 'PST',
  AK: 'AKST',
  HI: 'HST',
}
const addressInput = ref<HTMLInputElement | null>(null)

function loadPlaces(): Promise<boolean> {
  const w = window as any
  if (w.google?.maps?.places) return Promise.resolve(true)
  if (!w.__dlPlaces) {
    w.__dlPlaces = $fetch<{ key?: string }>('/api/site/google-maps-key')
      .then((r) => r?.key ?? '')
      .catch(() => '')
      .then(
        (key: string) =>
          new Promise<boolean>((resolve) => {
            if (!key) return resolve(false)
            if (w.google?.maps?.places) return resolve(true)
            const script = document.createElement('script')
            script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places`
            script.async = true
            script.onload = () => resolve(!!w.google?.maps?.places)
            script.onerror = () => resolve(false)
            document.head.appendChild(script)
          }),
      )
  }
  return w.__dlPlaces
}

async function initAutocomplete() {
  if (!(await loadPlaces())) return
  const g = (window as any).google
  const input = addressInput.value
  if (!input || !g?.maps?.places) return
  const ac = new g.maps.places.Autocomplete(input, {
    types: ['address'],
    componentRestrictions: { country: 'us' },
    fields: ['address_components', 'formatted_address'],
  })
  ac.addListener('place_changed', () => {
    const place = ac.getPlace()
    if (!place?.address_components) return
    let streetNumber = ''
    let route = ''
    let city = ''
    let stateShort = ''
    let stateLong = ''
    let zip = ''
    let country = ''
    let county = ''
    for (const c of place.address_components as any[]) {
      if (c.types.includes('street_number')) streetNumber = c.long_name
      if (c.types.includes('route')) route = c.long_name
      if (c.types.includes('locality')) city = c.long_name
      if (c.types.includes('administrative_area_level_1')) {
        stateShort = c.short_name
        stateLong = c.long_name
      }
      if (c.types.includes('postal_code')) zip = c.long_name
      if (c.types.includes('country')) country = c.long_name
      if (c.types.includes('administrative_area_level_2')) county = c.long_name
    }
    const street = `${streetNumber ? `${streetNumber} ` : ''}${route}`
    dealer.address = street.trim() || place.formatted_address
    input.value = dealer.address
    dealer.city = city
    dealer.state = stateShort
    dealer.zip = zip
    dealer.country = country
    dealer.county = county
    dealer.region = stateLong
    dealer.timezone = STATE_TZ[stateShort] ?? ''
    if (zip) {
      $fetch<{ timezone?: string | null; city?: string | null; state?: string | null; region?: string | null }>(
        '/api/site/vehicle/zip-timezone',
        { query: { zip } },
      )
        .then((data) => {
          if (data?.timezone) dealer.timezone = data.timezone
          if (data?.city) dealer.city = data.city
          if (data?.state) dealer.state = data.state
          if (data?.region) dealer.region = data.region
        })
        .catch(() => {})
    }
  })
}

onMounted(async () => {
  initAutocomplete()
  allDealerships.value = await loadDealerships()
})

/* ── Submit ── */
function payload(): Record<string, unknown> {
  return {
    company_id: String(company.value.id),
    vehicle_id: String(v.value.id ?? ''),
    ...(company.value.account_type === 'Multi' ? { location_id: String(v.value.company_id ?? '') } : {}),
    firstname: firstname.value,
    lastname: lastname.value,
    phone: phone.value,
    email: email.value,
    message: props.variant === 'panel' ? `Vehicle Inquiry: ${contactMessage.value}` : '',
    is_dealer: 1,
    dealer_job_title: dealer.jobTitle,
    dealer_name: dealer.name,
    dealer_address: dealer.address,
    dealer_city: dealer.city,
    dealer_state: dealer.state,
    dealer_zip: dealer.zip,
    dealer_timezone: dealer.timezone,
    dealer_country: dealer.country,
    dealer_county: dealer.county,
    dealer_region: dealer.region,
    selected_dealership: selectedDealershipId.value,
    sms_consent: smsConsent.value ? 1 : 0,
  }
}

function send(data: Record<string, unknown>) {
  // TODO(forms): POST the sales site's /frontend/interested (HomeController@interested → FormSubmissionService::
  // submitInterested → {API}/api/v2/websitetemplate/sales-interested-api) with `data` + source (the request's host).
  // The server adds company_name, lead_type / reason 'Vehicle Inquiry', company_info (COMPANY_INFO) and maps
  // dealer_* to jobTitle, dealershipName, dealershipAddress, dealershipCity, dealershipState, dealershipZip,
  // dealership_timezone / _country / _county / _region. On is_success == '1' clear the fields (and the dealer fields),
  // untick the consent, close the pop-up and show the Thank You alert; else an "Error!" pop-up with the message.
  void data
}

/** The panel's submit(). */
function submitPanel() {
  if (props.isDemo) {
    demoNotice.value = true
    return
  }
  if (!smsConsent.value) return
  const contactValid = validateContact()
  const dealerValid = validateDealer()
  if (!contactValid || !dealerValid) return
  send(payload())
}

/** The pop-up's handleShowFormMainBtnClick() → submitShowFormData(). */
function submitModal() {
  if (!props.isDemo) {
    if (!smsConsent.value) return
    alreadySubmit.value = true
    const contactValid = validateContact()
    const dealerValid = validateDealer()
    if (!contactValid || !dealerValid) return
  }
  if (!validateDealer()) return
  const data = payload()
  if (props.isDemo) {
    demoNotice.value = true
    return
  }
  send(data)
}

/** The pop-up's closeModal(): errors and the dealer fields reset, then the parent closes it. */
function closeModal() {
  error.firstName = ''
  error.lastName = ''
  error.email = ''
  error.phoneNumber = ''
  alreadySubmit.value = false
  resetDealer()
  emit('close')
}
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
            required
            placeholder="(xxx) xxx - xxxx"
            :class="{ 'border-red-500': error.phoneNumber }"
            class="appearance-none border rounded-lg w-full py-2.5 px-3 text-gray-700 leading-tight focus:outline-hidden"
            @input="formatPhoneInput(); error.phoneNumber = ''"
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

    <!-- Dealer Info -->
    <div class="mt-1 pt-4 border-t border-zinc-400">
      <div class="text-sm font-bold text-gray-900 mb-2">Dealer Info</div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="text-left">
          <label class="text-sm font-bold text-gray-700">Job Title <span class="text-red-500">*</span></label>
          <select
            v-model="dealer.jobTitle"
            :class="{ 'border-red-500': dealerError.jobTitle }"
            class="appearance-none border rounded-lg w-full py-2.5 px-3 mt-1 text-gray-700 leading-tight focus:outline-hidden"
            @change="dealerError.jobTitle = ''"
          >
            <option value="" disabled>Select Job Title</option>
            <option v-for="[value, label] in JOB_TITLES" :key="value" :value="value">{{ label }}</option>
          </select>
          <div v-show="dealerError.jobTitle" class="vdp-contact-error">{{ dealerError.jobTitle }}</div>
        </div>
        <div class="text-left">
          <label class="text-sm font-bold text-gray-700">Dealership Name <span class="text-red-500">*</span></label>
          <div class="relative mt-1">
            <input
              id="vdp_dealer_name"
              v-model="dealer.name"
              type="text"
              placeholder="Search Dealership..."
              autocomplete="off"
              :class="{ 'border-red-500': dealerError.name }"
              class="appearance-none border rounded-lg w-full py-2.5 px-3 text-gray-700 leading-tight focus:outline-hidden"
              @input="onDealerNameInput"
              @blur="onDealerNameBlur"
            />
            <div
              id="vdp_dealer_name_dropdown"
              class="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
              :class="{ hidden: !dropdownOpen }"
              style="top: 100%; left: 0"
            >
              <button
                v-for="d in matches"
                :key="String(d.dealership_id) + d.dealership_name"
                type="button"
                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-b border-gray-100 last:border-0"
                @mousedown.prevent="pickDealership(d)"
              >
                {{ d.dealership_name }}
              </button>
            </div>
          </div>
          <div v-show="dealerError.name" class="vdp-contact-error">{{ dealerError.name }}</div>
        </div>
        <div class="text-left">
          <label class="text-sm font-bold text-gray-700">Address <span class="text-red-500">*</span></label>
          <input
            id="vdp_dealer_address"
            ref="addressInput"
            v-model="dealer.address"
            type="text"
            placeholder="Dealership Address"
            :class="{ 'border-red-500': dealerError.address }"
            class="appearance-none border rounded-lg w-full py-2.5 px-3 mt-1 text-gray-700 leading-tight focus:outline-hidden"
            @input="dealerError.address = ''"
          />
          <div v-show="dealerError.address" class="vdp-contact-error">{{ dealerError.address }}</div>
        </div>
        <div class="text-left">
          <label class="text-sm font-bold text-gray-700">City <span class="text-red-500">*</span></label>
          <input
            v-model="dealer.city"
            type="text"
            placeholder="Dealership City"
            :class="{ 'border-red-500': dealerError.city }"
            class="appearance-none border rounded-lg w-full py-2.5 px-3 mt-1 text-gray-700 leading-tight focus:outline-hidden"
            @input="dealerError.city = ''"
          />
          <div v-show="dealerError.city" class="vdp-contact-error">{{ dealerError.city }}</div>
        </div>
        <div class="text-left">
          <label class="text-sm font-bold text-gray-700">State <span class="text-red-500">*</span></label>
          <input
            v-model="dealer.state"
            type="text"
            placeholder="Dealership State"
            :class="{ 'border-red-500': dealerError.state }"
            class="appearance-none border rounded-lg w-full py-2.5 px-3 mt-1 text-gray-700 leading-tight focus:outline-hidden"
            @input="dealerError.state = ''"
          />
          <div v-show="dealerError.state" class="vdp-contact-error">{{ dealerError.state }}</div>
        </div>
        <div class="text-left">
          <label class="text-sm font-bold text-gray-700">Zip <span class="text-red-500">*</span></label>
          <input
            v-model="dealer.zip"
            type="text"
            placeholder="Dealership Zip"
            :class="{ 'border-red-500': dealerError.zip }"
            class="appearance-none border rounded-lg w-full py-2.5 px-3 mt-1 text-gray-700 leading-tight focus:outline-hidden"
            @input="dealerError.zip = ''"
          />
          <div v-show="dealerError.zip" class="vdp-contact-error">{{ dealerError.zip }}</div>
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
        @click="submitPanel"
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

    <UiDemoNoticeModal v-model="demoNotice" />
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

      <div class="overflow-y-auto flex-1 pb-2">
        <div class="px-6">
          <div id="show-inquiry-step-contact">
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

          <!-- Dealer Info -->
          <div id="show-inquiry-step-dealer" class="mt-4 pt-4 border-t border-zinc-400">
            <div class="text-sm font-bold text-gray-900 mb-2">Dealer Info</div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="text-left">
                <label class="form-label text-sm font-bold text-gray-700 my-2.5">Job Title <span class="text-red-500">*</span></label>
                <select
                  id="dealer_job_title"
                  v-model="dealer.jobTitle"
                  :class="{ 'border-red-500': dealerError.jobTitle }"
                  class="appearance-none border rounded-lg w-full py-2.5 px-3 mt-1 text-gray-700 leading-tight focus:outline-hidden"
                >
                  <option value="" disabled>Select Job Title</option>
                  <option v-for="[value, label] in JOB_TITLES" :key="value" :value="value">{{ label }}</option>
                </select>
                <div v-show="dealerError.jobTitle" id="dealer_job_title_error" class="text-xs text-red-500 mt-1">{{ dealerError.jobTitle }}</div>
              </div>
              <div class="text-left">
                <label class="form-label text-sm font-bold text-gray-700 my-2.5">Dealership Name <span class="text-red-500">*</span></label>
                <div class="relative mt-1">
                  <input
                    id="dealer_name"
                    v-model="dealer.name"
                    type="text"
                    placeholder="Search Dealership..."
                    autocomplete="off"
                    :class="{ 'border-red-500': dealerError.name }"
                    class="appearance-none border rounded-lg w-full py-2.5 px-3 text-gray-700 leading-tight focus:outline-hidden"
                    @input="onDealerNameInput"
                    @blur="onDealerNameBlur"
                  />
                  <div
                    id="dealer_name_dropdown"
                    class="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                    :class="{ hidden: !dropdownOpen }"
                    style="top: 100%; left: 0"
                  >
                    <button
                      v-for="d in matches"
                      :key="String(d.dealership_id) + d.dealership_name"
                      type="button"
                      class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-b border-gray-100 last:border-0"
                      @mousedown.prevent="pickDealership(d)"
                    >
                      {{ d.dealership_name }}
                    </button>
                  </div>
                </div>
                <div v-show="dealerError.name" id="dealer_name_error" class="text-xs text-red-500 mt-1">{{ dealerError.name }}</div>
              </div>
              <div class="text-left">
                <label class="form-label text-sm font-bold text-gray-700 my-2.5">Address <span class="text-red-500">*</span></label>
                <input
                  id="dealer_address"
                  ref="addressInput"
                  v-model="dealer.address"
                  type="text"
                  placeholder="Dealership Address"
                  :class="{ 'border-red-500': dealerError.address }"
                  class="appearance-none border rounded-lg w-full py-2.5 px-3 mt-1 text-gray-700 leading-tight focus:outline-hidden"
                />
                <div v-show="dealerError.address" id="dealer_address_error" class="text-xs text-red-500 mt-1">{{ dealerError.address }}</div>
              </div>
              <div class="text-left">
                <label class="form-label text-sm font-bold text-gray-700 my-2.5">City <span class="text-red-500">*</span></label>
                <input
                  id="dealer_city"
                  v-model="dealer.city"
                  type="text"
                  placeholder="Dealership City"
                  :class="{ 'border-red-500': dealerError.city }"
                  class="appearance-none border rounded-lg w-full py-2.5 px-3 mt-1 text-gray-700 leading-tight focus:outline-hidden"
                />
                <div v-show="dealerError.city" id="dealer_city_error" class="text-xs text-red-500 mt-1">{{ dealerError.city }}</div>
              </div>
              <div class="text-left">
                <label class="form-label text-sm font-bold text-gray-700 my-2.5">State <span class="text-red-500">*</span></label>
                <input
                  id="dealer_state"
                  v-model="dealer.state"
                  type="text"
                  placeholder="Dealership State"
                  :class="{ 'border-red-500': dealerError.state }"
                  class="appearance-none border rounded-lg w-full py-2.5 px-3 mt-1 text-gray-700 leading-tight focus:outline-hidden"
                />
                <div v-show="dealerError.state" id="dealer_state_error" class="text-xs text-red-500 mt-1">{{ dealerError.state }}</div>
              </div>
              <div class="text-left">
                <label class="form-label text-sm font-bold text-gray-700 my-2.5">Zip <span class="text-red-500">*</span></label>
                <input
                  id="dealer_zip"
                  v-model="dealer.zip"
                  type="text"
                  placeholder="Dealership Zip"
                  :class="{ 'border-red-500': dealerError.zip }"
                  class="appearance-none border rounded-lg w-full py-2.5 px-3 mt-1 text-gray-700 leading-tight focus:outline-hidden"
                />
                <div v-show="dealerError.zip" id="dealer_zip_error" class="text-xs text-red-500 mt-1">{{ dealerError.zip }}</div>
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
          id="showSubmitBtn"
          class="w-full submit-button company-primary-base-background text-white font-bold text-sm tracking-wide py-2.5 px-4 rounded-sm focus:outline-hidden"
          :class="{ 'opacity-50 cursor-not-allowed': !smsConsent }"
          :disabled="!smsConsent"
          @click="submitModal"
        >
          I'M INTERESTED IN THIS VEHICLE
        </button>
      </div>
      <UiDemoNoticeModal v-model="demoNotice" />
    </div>
  </div>
</template>

<style>
/* The sales vdp-contact-form.blade.php block (the same as the client site's InquiryForm keeps). */
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

/* Tailwind 4's preflight sets `opacity: 1` on form controls; Tailwind 3's didn't. */
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

/* The pop-up has the Laravel <body>'s font (frontend-tw's Poppins stack). */
.iminterested-popup {
  font-family: Poppins, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
}
.iminterested-popup input.box-shadow-none {
  box-shadow: 0 0 #0000 !important;
}
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
