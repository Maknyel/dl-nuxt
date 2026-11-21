<script setup lang="ts">
/**
 * global/privacy-policy/index.blade.php: the Privacy Policy text with the dealer's name and contact details (Dealer
 * Lion's on the demo sites), beside the company card and the map.
 *
 * The Blade's text sits straight in the column with bare <li>s (no <ul>) and a stray </p>; the browser renders them
 * as list items with bullets outside the text, and the stray </p> as an empty paragraph, which is left out here.
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
        <div class="font-black text-center form-label text-4xl my-2 mb-3.5">Privacy Policy</div>
        <div class="h-3" />
        <template v-if="demo">
          Dealer Lion (“we,” “our,” “us”) is committed to protecting your privacy. This Privacy Policy explains how we
          collect, use, disclose, and safeguard your information when you visit our website, interact with our services,
          and engage with us via email, SMS, or live chat. By using our services, you agree to the practices described in
          this Privacy Policy.
        </template>
        <template v-else>
          {{ company.name }} (“we,” “our,” “us”) is committed to protecting your privacy. This Privacy
          Policy explains how we collect, use, disclose, and safeguard your information when you visit our website,
          interact with our services, and engage with us via email, SMS, or live chat. By using our services, you agree
          to the practices described in this Privacy Policy.
        </template>
        <br />
        <span class="pp-h"> 1. Information We Collect </span>
        <span class="pp-sub">We may collect personal information that you voluntarily provide to us when you: </span>
        <li>Visit our website or dealership.</li>
        <li>Fill out contact forms or request information.</li>
        <li>Communicate with us via email, SMS, or live chat.</li>
        <li>Make purchases or inquiries about vehicles or services.</li>
        <li>Participate in promotions or surveys.</li>
        <span class="pp-sub">The types of information we may collect include: </span>
        <li>Name, email address, phone number, mailing address.</li>
        <li>Vehicle information (make, model, year).</li>
        <li>Payment details when necessary for transactions.</li>
        <li>Any other information you choose to provide.</li>
        <span class="pp-h"> 2. How We Use Your Information </span>
        <span class="pp-sub">We use the information we collect for a variety of purposes, including: </span>
        <li>
          To Communicate with You: We may use your email address, phone number (for SMS), or live chat information to
          communicate regarding inquiries, promotions, and transactions. This includes but is not limited to sending you
          relevant updates, offers, and other communications that may assist in your decision-making process regarding
          our products and services.
        </li>
        <li>
          For Marketing and Promotions: We may use your contact information to send you promotional materials, including
          special offers and newsletters via email or SMS. You can opt out of these communications at any time (see
          Section 5 for more details).
        </li>
        <li>
          To Improve Our Services: We may use your feedback and other data to enhance our website, customer service, and
          overall customer experience.
        </li>
        <li>
          To Process Transactions: Your information may be used to process payments, vehicle financing, or other
          transactions.
        </li>
        <li>
          Legal Compliance: We may disclose your information to comply with applicable legal obligations, court orders,
          or governmental regulations.
        </li>
        <span class="pp-h"> 3. Communication via Email, SMS, and Live Chat </span>
        By providing your contact information, you consent to receive communications from us via email, SMS, and live
        chat. We utilize A2P 10DLC (Application-to-Person 10-Digit Long Code) for SMS communications, ensuring compliance
        with industry standards and regulations set forth by mobile network operators.
        <br /><br />
        <li>
          Email Communication: We may send you transactional and promotional emails. You can unsubscribe from promotional
          emails at any time by following the “unsubscribe” link in the email.
        </li>
        <li>
          SMS Communication: By providing your mobile number, you consent to receive SMS messages regarding your
          inquiries, orders, and promotions. Standard message and data rates may apply. To opt out of SMS messages, reply
          “STOP” to any message you receive from us.
        </li>
        <li>
          Live Chat Communication: When using our live chat feature, you consent to us collecting any information you
          voluntarily provide. Live chat may be used for customer service, sales inquiries, or promotional offers.
        </li>
        <span class="pp-h"> 4. Sharing of Your Information </span>
        We do not sell, rent, or trade your personal information to third parties. However, we may share your information
        with trusted third parties who assist us in operating our website, conducting our business, or servicing you, as
        long as those parties agree to keep your information confidential. We may also disclose your information when
        required by law or to protect our rights.
        <span class="pp-h"> 5. Your Choices Regarding Your Information </span>
        <span class="pp-sub">You have choices regarding the collection and use of your information: </span>
        <li>
          Opting Out of Emails and SMS: You may opt out of receiving promotional emails by following the instructions in
          each email or SMS message. For SMS messages, reply “STOP” to any message you receive. Please note that even
          after opting out, we may continue to send you transactional or relationship-related communications.
        </li>
        <li>
          Updating Your Information: You may update or correct your information by contacting us directly or through your
          account, if applicable.
        </li>
        <span class="pp-h"> 6. Data Security </span>
        We take reasonable steps to protect your information from unauthorized access, disclosure, alteration, or
        destruction. However, no transmission of data over the Internet or mobile networks can be guaranteed to be 100%
        secure, and we cannot guarantee the security of any information you transmit to us.
        <span class="pp-h"> 7. Cookies and Tracking Technologies </span>
        We may use cookies and similar tracking technologies to improve your experience on our website and gather
        analytics. You can control the use of cookies through your browser settings.
        <span class="pp-h"> 8. Children’s Privacy </span>
        Our services are not intended for individuals under the age of 13. We do not knowingly collect personal
        information from children under 13. If we become aware that we have inadvertently collected such information, we
        will take steps to delete it.
        <span class="pp-h"> 9. Changes to This Privacy Policy </span>
        We may update this Privacy Policy from time to time. When we make changes, we will update the "Effective Date" at
        the top of this page. We encourage you to review this Privacy Policy periodically to stay informed about how we
        are protecting your information.
        <span class="pp-h"> 10. Contact Us </span>
        If you have any questions about this Privacy Policy, or if you would like to update your information or opt-out
        of any communications, please contact us at:
        <br /><br />
        <template v-if="demo">
          <span class="pp-line"> Dealer Lion </span>
          <span class="pp-line"> 2501 Browncroft Blvd Rochester NY 14625 </span>
          <span class="pp-line"> (585) 505-5600 </span>
          <span class="pp-line"> support@dealerlion.com </span>
        </template>
        <template v-else>
          <span class="pp-line">{{ company.name }} </span>
          <span class="pp-line"
            >{{ company.street_address }} {{ company.city }} {{ state }} {{ company.zip_code }}
          </span>
          <span class="pp-line">{{ formatPhone(company.phone_number) }} </span>
          <span class="pp-line">{{ company.email }} </span>
        </template>
        <br />
        By using our website and services, you acknowledge that you have read and understood this Privacy Policy and
        agree to its terms.
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
.pp-h {
  display: block;
  font-weight: 700;
  margin: 10px 0;
  font-size: 20px;
}

.pp-sub {
  display: block;
  font-weight: 500;
  margin: 10px 0;
}

.pp-line {
  display: block;
  font-weight: 500;
}

.min-height-container {
  min-height: calc(100vh - 5rem);
}
</style>
