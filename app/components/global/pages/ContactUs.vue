<script setup lang="ts">
/**
 * global/contact-us/contactus.blade.php (the Contact Us mock-up): two badges and the title; the form beside Company
 * Information; Hours of Operation beside Visit Our Showroom. A group (main_company) gets a store select in the form and,
 * under it, each location's three cards instead of the company's.
 *
 * The form is the Alpine `contactus` component (resources/js/template-builder-data/contactus.js): phone formatting,
 * the character counter, the SMS consent enabling Send Message, and the validation messages after a first submit.
 * It doesn't send anything yet (docs/PORTING.md "Forms are not ported yet").
 */
const { company, mainCompany, logoUrl, isSales } = useSite()
const demo = isDemoHost(useRequestURL().hostname)
/** The sales site (:8003): the store select comes after the phone row with names only, and Send Message opens the
 *  "Demo Only" notice instead of sending. */
const demoNotice = ref(false)

const isMulti = computed(() => company.value.account_type === 'Multi')
const noLocations = computed(() => mainCompany.value.length === 0)

const locationLabel = (loc: Record<string, any>) => {
  const address = `${loc.street_address ?? ''}, ${loc.city ?? ''} ${String(loc.state ?? '').toUpperCase()} ${loc.zip_code ?? ''}`.trim()
  return `${loc.name ?? ''}${address !== '' ? ` - ${address}` : ''}`
}

// ── The Alpine `contactus` data ──────────────────────────────────────────────────────────────────────────────────
const form = reactive({
  firstname: '',
  lastname: '',
  email: '',
  phone: '',
  other_instructions: '',
  vehicle_id: '0',
  store_location: '',
})
const error = reactive({ firstName: '', lastName: '', email: '', store_location: '', phoneNumber: '', message: '' })
const alreadySubmit = ref(false)
const buttonDisabled = ref(false)
const smsConsent = ref(false)
const showAlert = ref(false)

function formatPhoneInput(event: Event) {
  const input = (event.target as HTMLInputElement).value.replace(/\D/g, '').substring(0, 10)
  const zip = input.substring(0, 3)
  const middle = input.substring(3, 6)
  const last = input.substring(6, 10)
  if (input.length > 6) form.phone = `(${zip}) ${middle}-${last}`
  else if (input.length > 3) form.phone = `(${zip}) ${middle}`
  else if (input.length > 0) form.phone = `(${zip}`
  else form.phone = ''
}

/** Validates once a submit was tried; returns 1 when something is wrong, 0 when the form can be sent. */
function onchangeFunction(disableAlert: boolean): number | undefined {
  if (!alreadySubmit.value) return undefined
  error.firstName = form.firstname === '' ? 'Please Enter Your First Name' : ''
  error.lastName = form.lastname === '' ? 'Please Enter Your Last Name' : ''
  if (form.email === '') error.email = 'Please Enter Your Email Address'
  else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(form.email)) error.email = 'The Email Address Is Not Valid'
  else error.email = ''
  if (form.phone === '') error.phoneNumber = 'Please Enter Your Phone Number'
  else if (form.phone.length < 14) error.phoneNumber = 'Phone Number Must Be 10 digits'
  else error.phoneNumber = ''
  error.store_location = isMulti.value && form.store_location === '' ? 'Please select store location' : ''

  if (disableAlert) return undefined
  if (error.firstName || error.lastName || error.phoneNumber || error.email) return 1
  if (isMulti.value && error.store_location) return 1
  return 0
}

function submit() {
  alreadySubmit.value = true
  if (onchangeFunction(false) !== 0) return
  // TODO(forms): POST /frontend/contact_us → website/forms/contact-us (see data-map.md "Form endpoints"), with
  // location_id = store_location for a Multi dealer; on success set showAlert, else show the API's message.
}
</script>

<template>
  <div class="ct-page">
    <div class="ct-badges">
      <span class="ct-badge"><Icon name="ion:checkmark-circle-outline" aria-hidden="true" /> WE'RE HERE TO HELP</span>
      <span class="ct-badge"><Icon name="ion:shield-checkmark-outline" aria-hidden="true" /> REAL PEOPLE. REAL HELP.</span>
    </div>
    <h1 class="ct-title">Contact Us</h1>
    <div class="grid grid-cols-12 gap-4">
      <!-- LEFT: Contact Form -->
      <div class="col-span-12 lg:col-span-7">
        <div class="lp-card ct-form">
          <div class="lp-h">
            <span class="lp-ico"><Icon name="ion:chatbox-ellipses-outline" aria-hidden="true" /></span>Contact Us Form
          </div>

          <div id="contactus">
            <input id="vehicle_id" v-model="form.vehicle_id" type="hidden" name="vehicle_id" />
            <div class="p-3">
              <!-- Store Location (Multi only) -->
              <div v-if="isMulti && !isSales" class="mb-4">
                <label class="form-label text-sm font-bold">Store Location *</label>
                <select
                  id="store_location"
                  v-model="form.store_location"
                  :class="{ 'input-error': error.store_location }"
                  required
                  name="store_location"
                  class="appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-hidden"
                  @change="onchangeFunction(true)"
                >
                  <option value="" disabled selected>Select Store Location</option>
                  <option v-for="loc in mainCompany" :key="loc.id" :value="String(loc.id)">{{ locationLabel(loc) }}</option>
                </select>
                <div v-show="error.store_location" class="text-xs text-red-500">{{ error.store_location }}</div>
              </div>

              <!-- Row 1: First Name / Last Name -->
              <div class="grid grid-cols-12 gap-4">
                <div class="col-span-12 md:col-span-6">
                  <label class="form-label text-sm font-bold">First Name *</label>
                  <div>
                    <input
                      id="firstname"
                      v-model="form.firstname"
                      :class="{
                        'border-red-500': error.firstName,
                        'focus:border-red-500': error.firstName,
                        'box-shadow-none': error.firstName,
                      }"
                      class="appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-hidden"
                      required
                      name="firstname"
                      placeholder="David"
                      aria-label="First Name..."
                      type="text"
                      maxlength="100"
                      @keyup="onchangeFunction(true)"
                    />
                    <div v-show="error.firstName" class="text-xs text-red-500">{{ error.firstName }}</div>
                  </div>
                </div>
                <div class="col-span-12 md:col-span-6">
                  <label class="form-label text-sm font-bold">Last Name *</label>
                  <div>
                    <input
                      id="lastname"
                      v-model="form.lastname"
                      :class="{
                        'border-red-500': error.lastName,
                        'focus:border-red-500': error.lastName,
                        'box-shadow-none': error.lastName,
                      }"
                      type="text"
                      class="appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-hidden"
                      required
                      name="lastname"
                      placeholder="Smith"
                      aria-label="Last Name..."
                      maxlength="100"
                      @keyup="onchangeFunction(true)"
                    />
                    <div v-show="error.lastName" class="text-xs text-red-500">{{ error.lastName }}</div>
                  </div>
                </div>

                <!-- Row 2: Email Address / Phone -->
                <div class="col-span-12 md:col-span-6">
                  <label class="form-label text-sm font-bold">Email Address *</label>
                  <div>
                    <input
                      id="email"
                      v-model="form.email"
                      :class="{
                        'border-red-500': error.email,
                        'focus:border-red-500': error.email,
                        'box-shadow-none': error.email,
                      }"
                      type="email"
                      class="appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-hidden"
                      required
                      name="email"
                      placeholder="david.smith@email.com"
                      @keyup="onchangeFunction(true)"
                    />
                    <div v-show="error.email" class="text-xs text-red-500">{{ error.email }}</div>
                  </div>
                </div>
                <div class="col-span-12 md:col-span-6">
                  <label class="form-label text-sm font-bold">Phone *</label>
                  <div>
                    <input
                      id="phone"
                      :value="form.phone"
                      :class="{
                        'border-red-500': error.phoneNumber,
                        'focus:border-red-500': error.phoneNumber,
                        'box-shadow-none': error.phoneNumber,
                      }"
                      type="text"
                      maxlength="16"
                      placeholder="(xxx) xxx-xxxx"
                      name="phone"
                      class="appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-hidden"
                      required
                      @input="
                        formatPhoneInput($event);
                        ($event.target as HTMLInputElement).value = form.phone;
                        onchangeFunction(true)
                      "
                    />
                    <div v-show="error.phoneNumber" class="text-xs text-red-500">{{ error.phoneNumber }}</div>
                  </div>
                </div>
              </div>

              <!-- Store Location (Multi only), the sales site's place for it -->
              <div v-if="isMulti && isSales" class="mb-4">
                <label class="form-label text-sm font-bold">Store Location *</label>
                <select
                  id="store_location"
                  v-model="form.store_location"
                  :class="{ 'input-error': error.store_location }"
                  required
                  name="store_location"
                  class="appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-hidden"
                  @change="onchangeFunction(true)"
                >
                  <option value="" disabled selected>Select Store Location</option>
                  <option v-for="loc in mainCompany" :key="loc.id" :value="String(loc.id)">{{ loc.name }}</option>
                </select>
                <div v-show="error.store_location" class="text-xs text-red-500">{{ error.store_location }}</div>
              </div>

              <!-- Hidden address fields (used by form submission) -->
              <div style="display: none">
                <input type="text" name="address" placeholder="Address" />
                <input type="text" name="city" placeholder="City" />
                <input type="text" name="state" placeholder="State" />
                <input type="text" name="zip" placeholder="Zip Code" />
              </div>

              <!-- Row 3: How can we help you? -->
              <div class="mb-4 mt-4">
                <label class="form-label text-sm font-bold">How can we help you?</label>
                <textarea
                  id="other_instructions"
                  v-model="form.other_instructions"
                  name="other_instructions"
                  :class="{
                    'border-red-500': error.message,
                    'focus:border-red-500': error.message,
                    'box-shadow-none': error.message,
                  }"
                  class="appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-hidden"
                  required
                  rows="5"
                  placeholder="Tell us how we can help you?"
                  maxlength="500"
                  @keyup="onchangeFunction(true)"
                />
                <div class="flex justify-between items-center mt-1">
                  <div class="text-xs text-gray-500">
                    <span>{{ form.other_instructions.length }}</span>/500 characters
                  </div>
                  <div v-show="error.message" class="text-xs text-red-500">{{ error.message }}</div>
                </div>
              </div>

              <!-- SMS consent + Submit button (Submit enabled only once consent is checked) -->
              <div class="w-full">
                <div class="pt-1">
                  <UiSmsConsent v-model="smsConsent" />
                </div>

                <div v-if="isSales" class="w-full flex gap-2 justify-end mt-2">
                  <button
                    type="button"
                    :disabled="!smsConsent"
                    :class="{ 'opacity-50 cursor-not-allowed': !smsConsent }"
                    class="flex-1 md:flex-none flex justify-center px-5 py-3 company-primary-base-background rounded-sm text-white focus:outline-hidden focus:ring-2 focus:ring-pink-300"
                    @click.prevent="smsConsent && (demoNotice = true)"
                  >
                    Send Message <Icon name="ion:paper-plane-outline" aria-hidden="true" />
                  </button>
                </div>
                <div v-else class="w-full flex gap-2 justify-end mt-2" style="min-height: 51px">
                  <button
                    v-if="!buttonDisabled"
                    :disabled="demo || !smsConsent"
                    class="flex-1 md:flex-none flex justify-center px-5 py-3 company-primary-base-background rounded-sm text-white focus:outline-hidden focus:ring-2 focus:ring-pink-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    @click.prevent="smsConsent && !demo && submit()"
                  >
                    Send Message <Icon name="ion:paper-plane-outline" aria-hidden="true" />
                  </button>
                  <button
                    v-else
                    disabled
                    class="flex-1 md:flex-none flex justify-center px-5 py-3 company-primary-base-background rounded-sm text-white focus:outline-hidden focus:ring-2 focus:ring-pink-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Icon name="ion:reload-outline" class="animate-spin" /> Sending...
                  </button>
                </div>
              </div>

              <UiDemoNoticeModal v-if="isSales" v-model="demoNotice" />
            </div>
          </div>
        </div>

        <UiAlertModal
          :show="showAlert"
          title="Thank You!"
          description="Contact Us Form Has Been Submitted Successfully"
          :logo-path="logoUrl()"
          bottom-description="A representative from the dealership will contact you shortly"
        />
      </div>

      <!-- RIGHT: Contact Info -->
      <div v-if="noLocations" class="col-span-12 lg:col-span-5">
        <UiCompanyInformation :valuearray="company" />
      </div>

      <!-- BOTTOM LEFT: Hours of Operation -->
      <div v-if="noLocations" class="col-span-12 lg:col-span-6">
        <UiHoursOfOperation :valuearray="company" />
      </div>

      <!-- BOTTOM RIGHT: Map -->
      <div class="col-span-12 lg:col-span-6">
        <UiCompanyMap :valuearray="company" />
      </div>
    </div>

    <!-- Multi-location listings -->
    <template v-for="(location, k) in mainCompany" :key="`loc-${k}`">
      <div class="w-full">
        <h4
          :class="isSales ? 'mb-3.5' : 'my-2'"
          class="font-semibold form-label text-xl lg:text-left text-center"
        >
          {{ location.name }}
        </h4>
      </div>
      <div class="grid grid-cols-12 gap-4 py-6 w-full">
        <div class="col-span-12 xl:col-span-4 lg:col-span-4 md:col-span-6">
          <UiCompanyInformation :valuearray="location" />
        </div>
        <div class="col-span-12 xl:col-span-4 lg:col-span-4 md:col-span-6">
          <UiHoursOfOperation :valuearray="location" />
        </div>
        <div class="col-span-12 xl:col-span-4 lg:col-span-4 md:col-span-6">
          <UiCompanyMap :valuearray="location" />
        </div>
      </div>
    </template>
  </div>
</template>

<style>
/* The Laravel page's body rules: the tinted page background, and on a tall window the page fills it with the footer
   at the bottom. The Laravel body holds the nav, the page and the footer; here the layout's wrapper does. */
body:has(.ct-page) {
  background: color-mix(in srgb, var(--company-primary-base, #6d28d9) 3%, #f6f6f8) !important;
}

[data-template]:has(> .ct-page) {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

[data-template]:has(> .ct-page) > .ct-page {
  width: 100%;
  margin-bottom: auto;
}

[data-template]:has(> .ct-page) > footer {
  flex-shrink: 0;
}
</style>

<style scoped>
.ct-page {
  --ct-p: var(--company-primary-base, #6d28d9);
  max-width: none;
  margin: 0 auto;
  /* 36px over and 48px under, the content on the header's and footer's 1280px column, 16px each side on a phone. */
  padding: 36px max(16px, calc((100% - 1280px) / 2)) 48px;
  font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
  color: #16131f;
}

.ct-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.ct-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.9rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: color-mix(in srgb, var(--ct-p) 80%, #000000);
  background: color-mix(in srgb, var(--ct-p) 9%, #ffffff);
  border: 1px solid color-mix(in srgb, var(--ct-p) 18%, #ffffff);
}

.ct-page .ct-title {
  margin: 0.75rem 0 1rem;
  font-family: 'Outfit', 'Inter', sans-serif;
  font-size: 3rem;
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.02em;
}

/* The form card: the same fields, restyled. */
.ct-form #contactus > .p-3 {
  padding: 0;
}

.ct-form .form-label {
  display: block;
  margin-bottom: 0.4rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #16131f;
}

.ct-form input[type='text'],
.ct-form input[type='email'],
.ct-form select,
.ct-form textarea {
  width: 100%;
  height: 3rem;
  padding: 0 1rem;
  border-radius: 0.625rem;
  font-size: 0.9375rem;
  color: #16131f;
  background: #fff;
  border: 1.5px solid #d9d8e0;
}

.ct-form textarea {
  height: auto;
  min-height: 7rem;
  padding: 0.75rem 1rem;
}

.ct-form input:focus,
.ct-form select:focus,
.ct-form textarea:focus {
  outline: none;
  border-color: var(--ct-p);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ct-p) 18%, transparent);
}

.ct-form .border-red-500 {
  border-color: #dc2626 !important;
}

.ct-form button.company-primary-base-background,
/* The sales site's Demo Only notice sits inside the form card there, so its Close button takes this style too. */
.ct-form :deep(.demo-notice button.company-primary-base-background) {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  flex: none;
  padding: 0.85rem 1.75rem;
  border-radius: 0.875rem;
  font-size: 1rem;
  font-weight: 700;
  background: color-mix(in srgb, var(--ct-p) 75%, #ffffff);
  box-shadow: 0 12px 24px -14px color-mix(in srgb, var(--ct-p) 80%, transparent);
}

/* Get Directions lives on the showroom card here; the company card doesn't repeat it. */
.ct-page :deep(.lp-company .lp-directions) {
  display: none;
}

@media (max-width: 640px) {
  .ct-page .ct-title {
    font-size: 2.25rem;
  }
}
</style>
