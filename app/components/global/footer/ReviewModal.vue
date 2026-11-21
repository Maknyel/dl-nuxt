<script setup lang="ts">
// The global footer's "Write a Review" modal (global/footer/index.blade.php, Alpine `add_review`). Shown while
// v-model is true; its × closes it. The form is rendered but doesn't send yet.
const open = defineModel<boolean>({ default: false })

const firstname = ref('')
const lastname = ref('')
const email = ref('')
const description = ref('')
const rating = ref(0)

function submit() {
  // TODO(forms): POST /frontend/insert_reviews { firstname, lastname, email, description, rating }
  // (see data-map.md "Form endpoints"; add_review.js validates each field with a SweetAlert first, then reloads).
}
</script>

<template>
  <div
    v-show="open"
    id="addreviewbox"
    class="fixed top-0 left-0 flex lg:items-center justify-center w-full h-full z-50"
    style="background-color: rgba(0, 0, 0, 0.5)"
  >
    <!-- A basic modal dialog with title, body and one button to close -->
    <div
      class="h-auto mx-2 text-left bg-white rounded-sm shadow-xl md:max-w-xl md:mx-0 flex flex-1 flex-col"
      style="max-height: 68vh"
    >
      <div class="mt-3 text-center sm:mt-0 sm:text-left flex flex-1 flex-col overflow-hidden">
        <div class="flex flex-wrap justify-between items-center gap-4 p-4 px-6 border-b border-gray-200">
          <h3 class="text-lg font-medium leading-6 text-gray-900">Write a Review</h3>

          <button class="btn-icon-circle on-light" @click.prevent="open = false">x</button>
        </div>

        <div class="py-2 px-4 flex flex-1 flex-col overflow-auto">
          <div>
            <div class="card-body p-1">
              <div class="grid grid-cols-12 gap-2">
                <div class="col-span-6">
                  <label>First name</label>
                  <div class="mb-4">
                    <input
                      id="firstname"
                      v-model="firstname"
                      class="appearance-none border rounded-sm w-full py-2 px-3 text-gray-700 leading-tight focus:outline-hidden"
                      required
                      name="firstname"
                      placeholder="David"
                      aria-label="First Name..."
                      type="text"
                    >
                  </div>
                </div>
                <div class="col-span-6">
                  <label>Last name</label>
                  <div class="mb-4">
                    <input
                      id="lastname"
                      v-model="lastname"
                      type="text"
                      class="appearance-none border rounded-sm w-full py-2 px-3 text-gray-700 leading-tight focus:outline-hidden"
                      required
                      name="lastname"
                      placeholder="Smith"
                      aria-label="Last Name..."
                    >
                  </div>
                </div>

                <div class="col-span-12">
                  <label>Email address</label>
                  <div class="mb-4">
                    <input
                      id="email"
                      v-model="email"
                      type="email"
                      class="appearance-none border rounded-sm w-full py-2 px-3 text-gray-700 leading-tight focus:outline-hidden"
                      required
                      name="email"
                      placeholder="david.smith@email.com"
                    >
                  </div>
                </div>

                <div class="col-span-12">
                  <label>Description</label>
                  <div class="mb-4">
                    <textarea
                      id="description"
                      v-model="description"
                      placeholder=""
                      name="description"
                      class="appearance-none border rounded-sm h-20 w-full py-2 px-3 text-gray-700 leading-tight focus:outline-hidden"
                      required
                    />
                  </div>
                </div>
              </div>
              <div class="col-span-12">
                <div class="form-group">
                  <label>Rating</label>
                  <input id="rating" type="hidden" class="form-control" name="rating" :value="rating" required>
                  <div class="w-full rating">
                    <label v-for="stars in 5" :key="stars">
                      <input type="radio" name="stars" :value="stars" @click.prevent="rating = stars">
                      <span
                        v-for="star in stars"
                        :key="star"
                        class="iconstar"
                        :class="{ activated: rating >= stars }"
                      >★</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div class="card-footer w-full mt-5">
              <div class="text-center">
                <button class="btn-pill btn-pill-light uppercase focus:outline-hidden" @click.prevent="submit">
                  SUBMIT
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fa.fa-star.checked {
  color: orange;
}

.rating {
  display: inline-block;
  position: relative;
  height: 50px;
  line-height: 50px;
  font-size: 50px;
}

.rating label {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  cursor: pointer;
}

.rating label:last-child {
  position: static;
}

.rating label:nth-child(1) {
  z-index: 5;
}

.rating label:nth-child(2) {
  z-index: 4;
}

.rating label:nth-child(3) {
  z-index: 3;
}

.rating label:nth-child(4) {
  z-index: 2;
}

.rating label:nth-child(5) {
  z-index: 1;
}

.rating label input {
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0;
}

.rating label .iconstar {
  float: left;
  color: transparent;
  font-size: 50px;
}

.iconstar.activated {
  color: var(--primary-base);
  text-shadow: 0 0 5px #09f;
}

.rating label:last-child .iconstar {
  color: var(--primary-base);
}

.rating:not(:hover) label input:checked ~ .iconstar,
.rating:hover label:hover input ~ .iconstar {
  color: #09f;
}

.rating > label:before {
  margin: 5px;
  font-size: 1.25em;
  font-family: FontAwesome;
  display: none !important;
  content: '\f005';
}
</style>
