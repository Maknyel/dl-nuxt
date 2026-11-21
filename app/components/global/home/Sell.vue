<script setup lang="ts">
/** global/home/sell.blade.php (via template-{2,3,4}/sell/layout-4): the static "we'll buy your car" band. */
const steps = [
  { img: '/media/global_images/finance1.webp', alt: 'bring in your car', label: 'Bring In Your Car' },
  { img: '/media/global_images/finance2.webp', alt: 'Appraise It!', label: 'Appraise It!' },
  { img: '/media/global_images/finance3.webp', alt: 'Get Your Offer', label: 'Get Your Offer' },
]
</script>

<template>
  <div class="flex company-secondary-base-background">
    <div class="container my-10 flex flex-col gap-8">
      <div class="flex flex-col">
        <span class="lg:text-4xl text-3xl font-semibold text-center company-primary-base-text">
          ARE YOU SELLING YOUR CAR? WE’LL BUY IT!
        </span>
        <span class="text-lg font-bold text-center text-base-content">QUICK AND EASY STEPS</span>
      </div>
      <div class="flex flex-col md:flex-row justify-evenly items-center md:items-end w-full mx-auto max-w-7xl gap-8 pb-2">
        <template v-for="(step, i) in steps" :key="step.label">
          <div v-if="i > 0" class="w-full flex md:hidden">
            <div class="mx-6 h-1 border-t border-gray-200 w-full" />
          </div>
          <div class="text-lg font-bold text-center text-base-content flex flex-col">
            <img :src="step.img" :alt="step.alt" loading="lazy" class="w-48 h-32 mb-1 mx-auto" style="padding-left: 20px" />
            <div class="flex items-center justify-center flex-wrap gap-2">
              <div class="company-primary-base-background rounded-full h-7 w-7 flex items-center justify-center text-sm">
                {{ i + 1 }}
              </div>
              <span>{{ step.label }}</span>
            </div>
          </div>
        </template>
      </div>
      <div class="flex justify-center">
        <NuxtLink
          to="/sell"
          class="place-self-end px-5 py-3 rounded-lg font-semibold company-primary-base-background text-base-content self-center capitalize text-center hover:opacity-80 hover:-translate-y-0.5 ease-in-out delay-75 duration-300"
        >
          Start Your Appraisal
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
