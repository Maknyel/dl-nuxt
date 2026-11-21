<script setup lang="ts">
/**
 * global/terms-service/index.blade.php: the Terms of Service text with the dealer's name and contact details (Dealer
 * Lion's on the demo sites), beside the company card and the map.
 *
 * The Blade wraps the text in a <p> that holds bare <li>s (no <ul>); the browser closes that <p> at the first <li>
 * and turns its closing tag into an empty paragraph. Here the text sits straight in the column (the <p> has no style,
 * so it lays out the same), which keeps the server HTML and the browser's DOM identical for hydration.
 * The page keeps the site's old body font (Poppins, not loaded, so the system UI font), as on :8002.
 */
import PolicyCompanyInfo from './PolicyCompanyInfo.vue'
import PolicyMap from './PolicyMap.vue'

const { company } = useSite()
const demo = isDemoHost(useRequestURL().hostname)
const state = computed(() => capsOnly(company.value.state ?? ''))
</script>

<template>
  <div class="container min-height-container pt-2 lg:pb-4 pb-10 font-poppins">
    <div class="grid grid-cols-12 gap-4">
      <div class="col-span-12 sm:col-span-12 md:col-span-8 lg:col-span-8 xl:col-span-8 p-4">
        <div class="font-black text-center form-label text-4xl my-2 mb-3.5">Terms Of Service</div>
        <div class="h-3" />
        <template v-if="demo">
          Welcome to Dealer Lion ("we," "us," or "our"). These Terms of Service ("Terms") govern your use of our
          services, including purchasing, financing, and maintaining used vehicles from us. By engaging with our services,
          you agree to these Terms.
        </template>
        <template v-else>
          Welcome to {{ company.name }} ("we," "us," or "our"). These Terms of Service ("Terms") govern your
          use of our services, including purchasing, financing, and maintaining used vehicles from us. By engaging with
          our services, you agree to these Terms.
        </template>
        <br />
        <span class="ts-h"> 1. Acceptance of Terms </span>
        By accessing our website, visiting our dealership, or using any of our services, you confirm that you have read,
        understood, and agreed to these Terms. If you do not agree, you must refrain from using our services.

        <span class="ts-h"> 2. Eligibility </span>
        You must be at least 18 years old or the legal age of majority in your jurisdiction to enter into a contract with
        us. By using our services, you represent and warrant that you meet this requirement.

        <span class="ts-h"> 3. Vehicle Sales and Purchase Agreement </span>
        <span class="ts-sub">
          All vehicle sales are subject to the terms outlined in the purchase agreement you sign at the time of sale. This
          agreement includes details such as:
        </span>
        <li>Vehicle Description</li>
        <li>Purchase Price</li>
        <li>Payment Terms</li>
        <li>Warranties (if applicable)</li>
        <li>Additional terms specific to your transaction</li>

        <span class="ts-h"> 4. Financing </span>
        If you choose to finance your vehicle, financing terms will be governed by the finance agreement provided by us or
        a third-party lender. We do not guarantee approval for financing.

        <span class="ts-h"> 5. As-Is Vehicle Sales </span>
        Unless otherwise specified in writing, all vehicles are sold "as-is," meaning no warranties, either express or
        implied, are provided. It is your responsibility to inspect the vehicle and ensure it meets your expectations
        before purchase.

        <span class="ts-h"> 6. Warranties </span>
        If a warranty is included with your vehicle, the terms will be outlined in a separate warranty document. Any
        third-party warranties or service contracts are subject to their respective terms and conditions.

        <span class="ts-h"> 7. Returns and Refunds </span>
        All vehicle sales are final unless explicitly stated in your purchase agreement. If a return or refund is
        permitted, it will be subject to the terms outlined in the agreement and may include restocking or administrative
        fees.

        <span class="ts-h"> 8. Maintenance and Repairs </span>
        We may offer maintenance and repair services for your vehicle. These services are subject to separate terms and
        pricing provided at the time of service.

        <span class="ts-h"> 9. Pricing and Availability </span>
        All prices are subject to change without notice. While we strive to ensure accurate pricing and availability,
        errors may occur. We reserve the right to correct any errors and adjust pricing accordingly.

        <span class="ts-h"> 10. Limitation of Liability </span>
        To the fullest extent permitted by law, we are not liable for any indirect, incidental, special, consequential, or
        punitive damages arising from your use of our services or your purchase of a vehicle from us.

        <span class="ts-h"> 11. Dispute Resolution </span>
        Any disputes arising from or relating to these Terms or your interactions with us will be resolved through binding
        arbitration under [Insert Arbitration Rules], unless prohibited by applicable law.

        <span class="ts-h"> 12. Governing Law </span>
        These Terms are governed by and construed under the laws of the state where our dealership is located, without
        regard to its conflict of law principles.

        <span class="ts-h"> 13. Modifications to Terms </span>
        We may update these Terms from time to time. The updated Terms will be effective as of the date specified.
        Continued use of our services after changes constitute acceptance of the updated Terms.

        <span class="ts-h"> 14. Contact Information </span>
        If you have any questions or concerns regarding these Terms, please contact us at:
        <br />
        <template v-if="demo">
          <span class="ts-line"> Dealer Lion </span>
          <span class="ts-line"> 2501 Browncroft Blvd Rochester NY 14625 </span>
          <span class="ts-line"> (585) 505-5600 </span>
          <span class="ts-line"> support@dealerlion.com </span>
          <br />
          By engaging with Dealer Lion, you acknowledge and agree to these Terms of Service.
        </template>
        <template v-else>
          <span class="ts-line">{{ company.name }} </span>
          <span class="ts-line"
            >{{ company.street_address }} {{ company.city }} {{ state }} {{ company.zip_code }}
          </span>
          <span class="ts-line">{{ formatPhone(company.phone_number) }} </span>
          <span class="ts-line">{{ company.email }} </span>
          <br />
          By engaging with {{ company.name }}, you acknowledge and agree to these Terms of Service.
        </template>
      </div>
      <div class="col-span-12 sm:col-span-12 md:col-span-4 lg:col-span-4 xl:col-span-4 flex flex-col gap-2">
        <div class="flex lg:mt-20">
          <PolicyCompanyInfo />
        </div>

        <div class="flex">
          <PolicyMap />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* The Blade's inline styles on its headings and lines. */
.ts-h {
  display: block;
  font-weight: 700;
  margin: 10px 0;
  font-size: 20px;
}

.ts-sub {
  display: block;
  margin: 10px 0;
}

.ts-line {
  display: block;
  font-weight: 500;
}

.min-height-container {
  min-height: calc(100vh - 5rem);
}
</style>
