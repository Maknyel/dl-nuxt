<script lang="ts">
import type { Ref } from 'vue'

/** What the credit application's parts share (provided as 'finCtx'). Everything is keyed by the Blade's element ids. */
export interface FinCtx {
  /** The fields' values (strings, as jQuery's .val() reads them). */
  form: Record<string, string>
  /** `input-error` on an element. */
  bad: Record<string, boolean>
  /** A validation line's text ({id}_vt / {id}_validation_text). */
  msg: Record<string, string>
  /** The stars the page sets and clears (Driver's License State, Monthly Payment, the previous address / employer). */
  ind: Record<string, string>
  /** Disabled fields (the co-applicant's "Same As Primary" copies). */
  dis: Record<string, boolean>
  /** resetValidation(this): the field's error goes. */
  reset: (id: string) => void
  /** resetValidationName(id): the same, only once the (hidden) field has a value; a birthdate clears its 3 selects. */
  resetName: (id: string) => void
  /** Individual / Joint. */
  creditType: Ref<'Individual' | 'Joint'>
  setCreditType: (type: 'Individual' | 'Joint') => void
  current: Ref<number>
  vehicleLocationId: Ref<number | null>
  staticmake: Ref<{ id: number | string; title: string }[]>
}

/** "Own ( Paid and Clear )": the residence status that needs no monthly payment. */
export const OWN = 'Own ( Paid and Clear )'
</script>

<script setup lang="ts">
/**
 * The credit application (/finance): Laravel global/finance/new_form.blade.php (the `new_finance` view), the same on
 * all 4 templates.
 *  - Two badges and the title over one card: the step header (its icons, labels, checks and the progress bar come
 *    from finance.css, as the Blade's fin-theme) and the steps: 1 Applicant, 2 Residence, 3 Employment, then for a
 *    Joint application 4-6 the co-applicant's, then 7 Trade-In and 8 Money Down. Individual = 5 steps, Joint = 8.
 *  - Back / Next with the Blade's per-step validation (every message and rule as there), the SMS consent and Submit
 *    Application on the last step (disabled until the consent is ticked).
 *  - Step 1 renders with the page (the Blade built the steps in its document-ready script and hid the page until then).
 *  - Prefill from the vehicle page's Get Pre-Approved card (sessionStorage 'vdpPreApproval', read once).
 *  - The Google Places address autocomplete, when the server has a Maps key (/api/site/google-maps-key); else off.
 *
 * Not sent yet (docs/PORTING.md "Forms are not ported yet"): Submit validates, builds the Blade's payload and stops at
 * the TODO(forms) below. So the Blade's confirm dialog (Swal), "Please Wait..." and the Thank You modal never show.
 */
import './finance.css'
import ContactStep from './ContactStep.vue'
import ResidenceStep from './ResidenceStep.vue'
import EmploymentStep from './EmploymentStep.vue'
import TradeInStep from './TradeInStep.vue'
import MoneyDownStep from './MoneyDownStep.vue'
import AlertModal from '~/components/ui/AlertModal.vue'
import SmsConsent from '~/components/ui/SmsConsent.vue'

const props = defineProps<{
  staticmake: { id: number | string; title: string }[]
  vehicleLocationId: number | null
}>()

const route = useRoute()
const { company, isMulti, mediaUrl, isSales } = useSite()
/** The sales site (:8003): validations() always passes, and Submit Application (with the SMS consent) opens the
 *  "Demo Only" notice instead of the confirm and the request. */
const demoNotice = ref(false)

/* ── State ── */
const FIELDS = [
  'store_location', 'vehicle_vin', 'vehicle_id',
  // Applicant
  'first_name', 'middle_name', 'last_name', 'suffix', 'contact_number', 'email', 'sss',
  'birth_month', 'birth_day', 'birth_year', 'birthdate', 'drivers_license_number', 'state',
  'street_address', 'city', 'applicant_state', 'zip_code', 'residence_status', 'monthly_payment', 'years_residence',
  'months_residence', 'prev_street_address', 'prev_city', 'prev_state', 'prev_zip_code', 'prev_residence_status',
  'prev_monthly_payment', 'prev_years_residence', 'prev_months_residence',
  'company_name', 'employer_phone', 'job_title', 'years_at_the_company', 'months_at_the_company',
  'gross_monthly_income', 'prev_company_name', 'prev_employer_phone', 'prev_job_title', 'prev_years_at_the_company',
  'prev_months_at_the_company', 'prev_gross_monthly_income',
  // Co-applicant
  'co_first_name', 'co_middle_name', 'co_last_name', 'co_suffix', 'co_contact_number', 'co_email', 'co_sss',
  'co_birth_month', 'co_birth_day', 'co_birth_year', 'co_birthdate', 'co_drivers_license_number', 'co_state',
  'co_street_address', 'co_city', 'application_co_state', 'co_zip_code', 'co_residence_status', 'co_monthly_payment',
  'co_years_residence', 'co_months_residence', 'co_prev_street_address', 'co_prev_city', 'co_prev_state',
  'co_prev_zip_code', 'co_prev_residence_status', 'co_prev_monthly_payment', 'co_prev_years_residence',
  'co_prev_months_residence',
  'co_company_name', 'co_employer_phone', 'co_job_title', 'co_years_at_the_company', 'co_months_at_the_company',
  'co_gross_monthly_income', 'co_prev_company_name', 'co_prev_employer_phone', 'co_prev_job_title',
  'co_years_prev_at_the_company', 'co_months_prev_at_the_company', 'co_prev_gross_monthly_income',
  // Trade-in and money down
  'trade-in', 'year', 'make', 'model', 'trim', 'drivetrain', 'manual_make', 'manual_model', 'manual_trim',
  'manual_mileage', 'manual_trade_payoff', 'manual_lien_holder', 'trade_ucgvehicleid',
  'has-downpayment', 'desired_downpayment',
]

const form = reactive<Record<string, string>>(Object.fromEntries(FIELDS.map((f) => [f, ''])))
for (const f of ['residence_status', 'prev_residence_status', 'co_residence_status', 'co_prev_residence_status']) form[f] = OWN
form['trade-in'] = 'No'
form['has-downpayment'] = 'No'
form.vehicle_vin = String(route.query.vehicle_vin ?? '')
form.vehicle_id = String(route.query.vehicle_id ?? '')
form.store_location = props.vehicleLocationId ? String(props.vehicleLocationId) : ''

const bad = reactive<Record<string, boolean>>({})
const msg = reactive<Record<string, string>>({})
const ind = reactive<Record<string, string>>({})
const dis = reactive<Record<string, boolean>>({})

function reset(id: string) {
  bad[id] = false
  msg[id] = ''
}
function resetName(id: string) {
  if (form[id] === '') return
  if (id === 'birthdate' || id === 'co_birthdate') {
    const p = id === 'co_birthdate' ? 'co_' : ''
    for (const s of ['birth_month', 'birth_day', 'birth_year']) bad[p + s] = false
  } else {
    bad[id] = false
  }
  msg[id] = ''
}
/** resetAllValidations(): every input-error and validation line goes. */
function resetAll() {
  for (const k of Object.keys(bad)) bad[k] = false
  for (const k of Object.keys(msg)) msg[k] = ''
}
function fail(id: string, text: string) {
  bad[id] = true
  msg[id] = text
}

/* ── Steps ── */
const current = ref(1)
const creditType = ref<'Individual' | 'Joint'>('Individual')
const maxStep = computed(() => (creditType.value === 'Individual' ? 5 : 8))
const skipped = (i: number) => creditType.value === 'Individual' && i >= 4 && i <= 6
const steps = computed(() => {
  const out: { index: number; display: number }[] = []
  for (let i = 1; i <= 8; i++) if (!skipped(i)) out.push({ index: i, display: out.length + 1 })
  return out
})
const displayStep = computed(() => steps.value.find((s) => s.index === current.value)?.display ?? steps.value.length + 1)

const CURRENT_PILL = 'rounded-full h-6 w-6 flex item-center justify-center text-white company-primary-base-background'
const OTHER_PILL = 'rounded-full h-6 w-6 bg-gray-300 flex item-center justify-center text-black'

const stepRow = ref<HTMLElement | null>(null)

/** checkCurrentStep()'s side effects: the page back to the top, and (the Blade's MutationObserver) a row that scrolls
 *  sideways brings the current step into the middle. */
function afterStepChange() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
  nextTick(scrollRowToCurrent)
}
function scrollRowToCurrent() {
  const row = stepRow.value
  const cur = row?.querySelector<HTMLElement>('.company-primary-base-background')
  if (!row || !cur || row.scrollWidth <= row.clientWidth) return
  const offset = cur.getBoundingClientRect().left - row.getBoundingClientRect().left + row.scrollLeft
  row.scrollTo({ left: Math.max(0, offset - (row.clientWidth - cur.offsetWidth) / 2), behavior: 'smooth' })
}

/** individualJoint(3 | 6). */
function setCreditType(type: 'Individual' | 'Joint') {
  creditType.value = type
  afterStepChange()
}

function nextStep() {
  resetAll()
  if (validate(current.value)) {
    let next = current.value + 1
    while (skipped(next) && next <= 8) next++
    current.value = next
    afterStepChange()
  }
}
function backStep() {
  let prev = current.value - 1
  while (skipped(prev) && prev >= 1) prev--
  current.value = prev
  afterStepChange()
  resetAll()
}

/* ── Validation (the Blade's step1Validation() ... step8Validation(), message for message) ── */
const ADULT_AGE = 18
const cutoff = new Date()
cutoff.setFullYear(cutoff.getFullYear() - ADULT_AGE)
const MAX_Y = cutoff.getFullYear()
const MAX_M = cutoff.getMonth() + 1
const MAX_D = cutoff.getDate()

/** isAdultBirthdate(): the YYYY-MM-DD is on or before today eighteen years ago. */
function isAdultBirthdate(iso: string): boolean {
  const parts = String(iso || '').split('-')
  if (parts.length !== 3) return false
  const yr = Number(parts[0])
  const mon = Number(parts[1])
  const day = Number(parts[2])
  if (!yr || !mon || !day) return false
  if (yr !== MAX_Y) return yr < MAX_Y
  if (mon !== MAX_M) return mon < MAX_M
  return day <= MAX_D
}

const EMAIL_RE =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
const validateEmail = (email: string) => EMAIL_RE.test(String(email).toLowerCase())

/** jQuery's `.val() <= 1` on a text value ('' counts as 0). */
const le1 = (v: string | undefined) => Number(v ?? '') <= 1

function need(id: string, text: string): number {
  if (form[id]) return 0
  fail(id, text)
  return 1
}
function requirePhone(id: string, label: string): number {
  if (!form[id]) {
    fail(id, `${label} is required`)
    return 1
  }
  if (form[id].length !== 14) {
    fail(id, `${label} is invalid format`)
    return 1
  }
  return 0
}

function step1(): number {
  let n = 0
  if (isMulti.value && !form.store_location) {
    fail('store_location', 'Store Location is required')
    n++
  }
  n += need('first_name', 'First Name is required')
  n += need('last_name', 'Last Name is required')
  n += requirePhone('contact_number', 'Contact Number')
  if (!form.email) n += (fail('email', 'Email is required'), 1)
  else if (!validateEmail(form.email)) n += (fail('email', 'Email is invalid'), 1)
  const sss = (form.sss ?? '').trim()
  if (!sss) n += (fail('sss', 'Social Security Number is required'), 1)
  else if (!/^(?:\d{9}|\d{3}-\d{2}-\d{4})$/.test(sss)) n += (fail('sss', 'Please enter a valid SSN (e.g., ***-**-****)'), 1)
  else reset('sss')
  n += birthdateCheck('', 'Applicant must be at least 18 years old')
  if (form.drivers_license_number && !form.state) n += (fail('state', 'State is required'), 1)
  return n
}

function birthdateCheck(p: '' | 'co_', underage: string): number {
  const iso = form[`${p}birthdate`] ?? ''
  if (iso && isAdultBirthdate(iso)) return 0
  for (const s of ['birth_month', 'birth_day', 'birth_year']) bad[p + s] = true
  msg[`${p}birthdate`] = iso ? underage : 'Birthdate is invalid'
  return 1
}

function step2(): number {
  let n = 0
  n += need('street_address', 'Street Address is required')
  n += need('city', 'City is required')
  n += need('applicant_state', 'State is required')
  n += need('zip_code', 'Zip Code is required')
  if (form.residence_status !== OWN) n += need('monthly_payment', 'Monthly Payment is required')
  n += need('years_residence', 'Years at Residence is required')
  n += need('months_residence', 'Months at Residence is required')
  if (form.years_residence !== '' && le1(form.years_residence) && Number(form.months_residence) <= 11) {
    n += need('prev_street_address', 'Street Address is required')
    n += need('prev_city', 'City is required')
    n += need('prev_state', 'State is required')
    n += need('prev_zip_code', 'Zip Code is required')
    if (form.prev_residence_status !== OWN) n += need('prev_monthly_payment', 'Monthly Payment is required')
    n += need('prev_years_residence', 'Years at Residence is required')
    n += need('prev_months_residence', 'Months at Residence is required')
  }
  return n
}

function step3(): number {
  let n = 0
  n += need('company_name', 'Company Name  is required')
  n += requirePhone('employer_phone', 'Employer Phone ')
  n += need('job_title', 'Job Title is required')
  n += need('years_at_the_company', 'Years at the Company is required')
  n += need('months_at_the_company', 'Months at the Company is required')
  n += need('gross_monthly_income', 'Gross Monthly Income is required')
  if (form.years_at_the_company !== '' && le1(form.years_at_the_company)) {
    n += need('prev_company_name', 'Company Name is required')
    n += requirePhone('prev_employer_phone', 'Employer Phone')
    n += need('prev_job_title', 'Job Title is required')
    n += need('prev_years_at_the_company', 'Years at the Company is required')
    n += need('prev_months_at_the_company', 'Months at the Company is required')
    n += need('prev_gross_monthly_income', 'Gross Monthly Income is required')
  }
  return n
}

function step4(): number {
  let n = 0
  n += need('co_first_name', 'First Name is required')
  n += need('co_last_name', 'Last Name is required')
  n += requirePhone('co_contact_number', 'Contact Number')
  if (!form.co_email) n += (fail('co_email', 'Email is required'), 1)
  else if (!validateEmail(form.co_email)) n += (fail('co_email', 'Email is invalid'), 1)
  const ssn = (form.co_sss ?? '').trim()
  if (!ssn) n += (fail('co_sss', 'Social Security Number is required'), 1)
  else if (!/^\d{3}-\d{2}-\d{4}$/.test(ssn)) n += (fail('co_sss', 'Please enter a valid SSN (e.g., ***-**-****)'), 1)
  else reset('co_sss')
  n += birthdateCheck('co_', 'Co-applicant must be at least 18 years old')
  if (form.co_drivers_license_number && !form.co_state) n += (fail('co_state', 'State is required'), 1)
  return n
}

function step5(): number {
  let n = 0
  n += need('co_street_address', 'Street Address is required')
  n += need('co_city', 'City is required')
  n += need('application_co_state', 'State is required')
  n += need('co_zip_code', 'Zip Code is required')
  n += need('co_residence_status', 'Residence Status is required')
  if (form.co_residence_status !== OWN) n += need('co_monthly_payment', 'Monthly Payment is required')
  n += need('co_years_residence', 'Years at Residence is required')
  n += need('co_months_residence', 'Months at Residence is required')
  if (form.co_years_residence !== '' && le1(form.co_years_residence) && Number(form.co_months_residence) <= 11) {
    n += need('co_prev_street_address', 'Street Address is required')
    n += need('co_prev_city', ' City is required')
    n += need('co_prev_state', ' State is required')
    n += need('co_prev_zip_code', 'Zip Code is required')
    n += need('co_prev_residence_status', 'Residence Status is required!')
    if (form.co_prev_residence_status !== OWN) n += need('co_prev_monthly_payment', 'Monthly Payment is required')
    n += need('co_prev_years_residence', 'Years at Residence is required')
    n += need('co_prev_months_residence', 'Months at Residence is required')
  }
  return n
}

function step6(): number {
  let n = 0
  n += need('co_company_name', 'Company Name is required')
  n += requirePhone('co_employer_phone', 'Employer Phone')
  n += need('co_job_title', 'Job Title is required')
  n += need('co_years_at_the_company', 'Years at the Company is required')
  n += need('co_months_at_the_company', 'Months at the Company is required')
  n += need('co_gross_monthly_income', 'Gross Monthly is required')
  if (form.co_years_at_the_company !== '' && le1(form.co_years_at_the_company)) {
    n += need('co_prev_company_name', 'Company Name is required')
    n += requirePhone('co_prev_employer_phone', 'Employer Phone')
    n += need('co_prev_job_title', 'Job Title is required')
    n += need('co_years_prev_at_the_company', 'Years at the Company is required')
    n += need('co_months_prev_at_the_company', 'Months at the Company is required')
    n += need('co_prev_gross_monthly_income', 'Gross Monthly Income is required')
  }
  return n
}

function step7(): number {
  if (form['trade-in'] !== 'Yes') return 0
  let n = 0
  n += need('year', 'Year is required')
  n += need('make', 'Make is required')
  n += need('model', 'Model is required')
  n += need('trim', 'Trim is required')
  return n
}

function step8(): number {
  if (form['has-downpayment'] !== 'Yes' || form.desired_downpayment !== '') return 0
  fail('desired_downpayment', 'Downpayment is required')
  return 1
}

const VALIDATORS = [step1, step2, step3, step4, step5, step6, step7, step8]
/** validations(step): true when the step passes. */
function validate(step: number): boolean {
  if (isSales.value) return true
  const fn = VALIDATORS[step - 1]
  return fn ? fn() === 0 : true
}

/* ── Submit ── */
const smsConsent = ref(false)

function buildPayload(): Record<string, unknown> {
  const f = form
  const data: Record<string, unknown> = {
    type: creditType.value,
    sms_consent: smsConsent.value ? 1 : 0,
  }
  const SAME = [
    'first_name', 'vehicle_vin', 'vehicle_id', 'middle_name', 'last_name', 'suffix', 'contact_number', 'email', 'sss',
    'birthdate', 'drivers_license_number', 'state', 'street_address', 'city', 'applicant_state', 'zip_code',
    'residence_status', 'monthly_payment', 'years_residence', 'months_residence', 'prev_street_address', 'prev_city',
    'prev_state', 'prev_zip_code', 'prev_residence_status', 'prev_monthly_payment', 'prev_years_residence',
    'prev_months_residence', 'company_name', 'employer_phone', 'job_title', 'years_at_the_company',
    'months_at_the_company', 'gross_monthly_income', 'prev_company_name', 'prev_employer_phone', 'prev_job_title',
    'prev_years_at_the_company', 'prev_months_at_the_company', 'prev_gross_monthly_income', 'co_first_name',
    'co_middle_name', 'co_last_name', 'co_suffix', 'co_contact_number', 'co_email', 'co_sss', 'co_birthdate',
    'co_drivers_license_number', 'co_state', 'co_street_address', 'co_city', 'application_co_state', 'co_zip_code',
    'co_residence_status', 'co_monthly_payment', 'co_years_residence', 'co_months_residence', 'co_prev_street_address',
    'co_prev_city', 'co_prev_state', 'co_prev_zip_code', 'co_prev_residence_status', 'co_prev_monthly_payment',
    'co_prev_years_residence', 'co_prev_months_residence', 'co_company_name', 'co_employer_phone', 'co_job_title',
    'co_years_at_the_company', 'co_months_at_the_company', 'co_gross_monthly_income', 'co_prev_company_name',
    'co_prev_employer_phone', 'co_prev_job_title', 'co_years_prev_at_the_company', 'co_months_prev_at_the_company',
    'co_prev_gross_monthly_income',
  ]
  for (const k of SAME) data[k] = f[k]
  Object.assign(data, {
    has_trade_in: f['trade-in'],
    trade_year: f.year,
    trade_make: f.make !== 'Other' ? f.make : f.manual_make,
    trade_model: f.model !== 'Other' ? f.model : f.manual_model,
    trade_trim: f.trim !== 'Other' ? f.trim : f.manual_trim,
    trade_drivetrain: f.drivetrain,
    trade_ucgvehicleid: f.trade_ucgvehicleid,
    trade_mileage: f.manual_mileage,
    trade_payoff: f.manual_trade_payoff,
    trade_lien_holder: f.manual_lien_holder,
    has_down_payment: f['has-downpayment'],
    cash_down: f.desired_downpayment,
  })
  if (isMulti.value) data.location_id = props.vehicleLocationId ? String(props.vehicleLocationId) : f.store_location
  return data
}

/** submitDataBefore(): only with the consent ticked and the last step valid. */
function submitDataBefore() {
  if (!smsConsent.value) return
  if (!validate(8)) return
  if (isSales.value) {
    // The sales site's submitData(): nothing is sent.
    demoNotice.value = true
    return
  }
  const payload = buildPayload()
  // TODO(forms): POST /credit_app/post-data → website/forms/credit-app (see data-map.md "Form endpoints"), after the
  // Blade's "Form Submission" confirm; on success hide the form, show #finish and the Thank You modal (showThanks).
  void payload
}
const showThanks = ref(false)

/* ── Prefill from the vehicle page, and the address autocomplete ── */
function prefillFromVehiclePage() {
  let pre: any
  try {
    pre = JSON.parse(sessionStorage.getItem('vdpPreApproval') || 'null')
    sessionStorage.removeItem('vdpPreApproval')
  } catch {
    return
  }
  if (!pre || typeof pre !== 'object') return
  for (const id of ['first_name', 'last_name', 'email', 'contact_number']) {
    if (typeof pre[id] === 'string' && pre[id] !== '' && form[id] === '') form[id] = pre[id]
  }
  const down = Number.parseInt(pre.down_payment, 10)
  if (down > 0 && form.desired_downpayment === '') {
    form['has-downpayment'] = 'Yes'
    form.desired_downpayment = down.toLocaleString('en-US')
  }
}

const AUTOCOMPLETE_SETS: [string, string, string, string][] = [
  ['street_address', 'city', 'applicant_state', 'zip_code'],
  ['prev_street_address', 'prev_city', 'prev_state', 'prev_zip_code'],
  ['co_prev_street_address', 'co_prev_city', 'co_prev_state', 'co_prev_zip_code'],
  ['co_street_address', 'co_city', 'application_co_state', 'co_zip_code'],
]

async function loadAddressAutocomplete() {
  let key = ''
  try {
    key = (await $fetch<{ key?: string }>('/api/site/google-maps-key'))?.key ?? ''
  } catch {
    return
  }
  if (!key) return
  const w = window as any
  const init = () => AUTOCOMPLETE_SETS.forEach((ids) => initAutocomplete(...ids))
  if (w.google?.maps?.places) return init()
  const script = document.createElement('script')
  script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places`
  script.async = true
  script.onload = init
  document.head.appendChild(script)
}

function initAutocomplete(streetId: string, cityId: string, stateId: string, zipId: string) {
  const g = (window as any).google
  const input = document.getElementById(streetId) as HTMLInputElement | null
  if (!input || !g?.maps?.places) return
  const ac = new g.maps.places.Autocomplete(input, { types: ['address'] })
  const pick = (components: any[], type: string) => components.find((c) => c.types.includes(type))?.short_name ?? ''
  ac.addListener('place_changed', () => {
    const place = ac.getPlace()
    const comps = place?.address_components
    if (!comps) return
    const street = [pick(comps, 'street_number'), pick(comps, 'route')].filter(Boolean).join(' ')
    const values: [string, string][] = [
      [streetId, street],
      [cityId, pick(comps, 'locality')],
      [stateId, pick(comps, 'administrative_area_level_1')],
      [zipId, pick(comps, 'postal_code')],
    ]
    for (const [id, value] of values) {
      // Google wrote its own text into the street field: set the element as well as the form.
      const el = document.getElementById(id) as HTMLInputElement | null
      if (el) el.value = value
      form[id] = value
      if (value !== '') resetName(id)
    }
  })
  input.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') e.stopPropagation()
  })
}

onMounted(() => {
  prefillFromVehiclePage()
  scrollRowToCurrent()
  loadAddressAutocomplete()
})

provide<FinCtx>('finCtx', {
  form,
  bad,
  msg,
  ind,
  dis,
  reset,
  resetName,
  creditType,
  setCreditType,
  current,
  vehicleLocationId: toRef(props, 'vehicleLocationId'),
  staticmake: toRef(props, 'staticmake'),
})

const logoPath = computed(() => (company.value.logo ? mediaUrl(company.value.logo) : ''))
</script>

<template>
  <div class="fin-page">
    <div class="fin-badges">
      <UiPagePill icon="checkmark-circle-outline">GET PRE-APPROVED IN MINUTES</UiPagePill>
      <UiPagePill icon="shield-checkmark-outline">NO IMPACT TO YOUR CREDIT SCORE</UiPagePill>
    </div>
    <h1 class="fin-title">Get Approved Now</h1>

    <div id="getApprovedForm" class="fin-card">
      <div id="creditapp-form" class="flex flex-col gap-4">
        <div id="button_step" ref="stepRow" class="fin-steps">
          <span
            v-for="s in steps"
            :id="`step-${s.index}`"
            :key="s.index"
            :class="s.index === current ? CURRENT_PILL : OTHER_PILL"
            >{{ s.display }}</span
          >
        </div>
        <div class="fin-progress">
          <span class="fin-progress-bar" aria-hidden="true"><span /></span>
          <h5 class="fin-progress-txt">
            Step
            <span id="current_step">{{ displayStep }}</span>
            of
            <span id="max_step">{{ maxStep }}</span><b class="fin-pct" />
          </h5>
        </div>

        <!-- Applicant -->
        <ContactStep :step="1" />
        <ResidenceStep :step="2" />
        <EmploymentStep :step="3" />
        <!-- Co-applicant -->
        <ContactStep :step="4" co />
        <ResidenceStep :step="5" co />
        <EmploymentStep :step="6" co />
        <!-- Trade-in and money down -->
        <TradeInStep :step="7" />
        <MoneyDownStep :step="8" />

        <div id="finance-sms-consent" class="pb-3" :class="{ hidden: current !== 8 }">
          <SmsConsent id="finance_sms_consent" v-model="smsConsent" />
        </div>

        <div class="flex gap-2">
          <button
            v-show="current !== 1"
            id="back-button"
            type="button"
            class="flex-1 lg:flex-none flex justify-center px-5 py-3 bg-red-600 rounded-sm text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-hidden focus:ring-2"
            @click="backStep"
          >
            Back
          </button>
          <div class="ml-auto flex gap-2">
            <button
              v-show="current !== 8"
              id="next-button"
              type="button"
              class="flex-1 lg:flex-none flex justify-center px-5 py-3 bg-red-600 rounded-sm text-white focus:outline-hidden focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
              @click="nextStep"
            >
              Next
            </button>

            <button
              v-show="current === 8"
              id="submit-button"
              type="button"
              :disabled="!smsConsent"
              class="flex-1 lg:flex-none flex justify-center px-5 py-3 bg-red-600 rounded-sm text-white focus:outline-hidden focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
              @click="submitDataBefore"
            >
              Submit Application
            </button>
          </div>
        </div>
      </div>
      <div id="laststep-loading" class="hidden flex-1 flex flex-col gap-10 items-center justify-center lg:h-40">
        <div class="text-center w-full">Please Wait...</div>
      </div>

      <div id="finish" class="hidden flex-1 flex flex-col gap-10 items-center justify-center lg:h-40">
        <div class="flex flex-col gap-3 items-center justify-center">
          <Icon name="ion:checkmark-circle-outline" class="text-[5rem] text-green-400" />
          <h1 class="text-center text-xl font-semibold w-full">Your Credit Application Has Been Submitted Successfully.</h1>
        </div>
      </div>
    </div>
    <AlertModal
      :show="showThanks"
      title="Thank You!"
      description="Credit Application Has Been Submitted Successfully"
      :logo-path="logoPath"
      bottom-description="A representative from the dealership will contact you shortly"
    />
    <UiDemoNoticeModal v-if="isSales" v-model="demoNotice" />
  </div>
</template>
