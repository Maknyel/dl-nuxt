<script setup lang="ts">
/**
 * global/home/about.blade.php (via template-{2,3,4}/about/layout-4): the dealer's About Us HTML next to the hours
 * card, plus the hidden "website details" blocks the Blade keeps for SEO (the company itself when Single, else
 * each location).
 */
import Schedule from './Schedule.vue'

const { company, mainCompany } = useSite()

/** Helper.php `format_phone_number()`. */
function formatPhone(phone?: string | null): string {
  if (!phone) return ''
  let digits = phone.replace(/\D/g, '')
  if (digits.length === 11 && digits[0] === '1') digits = digits.slice(1)
  if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  return phone
}

function details(c: Record<string, any>) {
  const schedule = c.times?.sales_schedule
  const hours = Array.isArray(schedule)
    ? schedule
        .filter((v: any) => v?.is_visible == true)
        .map((v: any) => `( ${String(v.date_of_the_week ?? '').slice(0, 3)} : ${v.time_in ?? ''} - ${v.time_out ?? ''} )`)
        .join(' ')
    : ''
  return {
    name: c.name ?? '',
    address: `${c.street_address ?? ''}, ${c.city ?? ''} ${c.state ? capsOnly(c.state) : ''} ${c.zip_code ?? ''}`,
    phone: formatPhone(c.phone_number ?? ''),
    email: c.email ?? '',
    hours,
  }
}

const seoBlocks = computed(() => {
  if (company.value.account_type === 'Single') return [details(company.value)]
  return mainCompany.value.map(details)
})
</script>

<template>
  <div class="flex">
    <div class="container my-10 flex flex-col gap-8">
      <div class="md:grid md:grid-cols-12 flex-1 flex flex-col gap-8">
        <!-- About Us Content Column -->
        <div class="xl:col-span-8 lg:col-span-7 md:col-span-12 col-span-12 flex flex-col col-span-full gap-8 text-left lg:text-left break-words">
          <span class="lg:text-4xl text-3xl font-semibold lg:text-left text-center">About Us</span>
          <div class="break-words" v-html="company.aboutus ?? ''" />
          <!-- WEBSITE DETAILS -->
          <div v-for="(d, i) in seoBlocks" :key="i" class="hidden">
            Company Name: {{ d.name }} <br />
            Company Address/Store Address: {{ d.address }} <br />
            Company Phone: {{ d.phone }} <br />
            Company Email: {{ d.email }} <br />
            Company Hours/Store Hours: {{ d.hours }}
          </div>
        </div>
        <!-- Schedule/Hours Of Operation Column -->
        <div class="xl:col-span-4 lg:col-span-5 md:col-span-12 col-span-12 flex flex-col justify-center">
          <div class="flex flex-col">
            <Schedule />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
