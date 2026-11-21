<script setup lang="ts">
/**
 * <x-demo-notice-modal> (the sales site's resources/views/components/demo-notice-modal.blade.php): the "Demo Only"
 * pop-up the sales site's forms open instead of sending. Open it with v-model; a click on the backdrop, Escape, the
 * × or Close shuts it.
 *
 * `bodyFont`: where the Blade puts the notice outside the page's own block (Sell Us Your Car), it has the Laravel
 * <body>'s font (frontend-tw's Poppins stack) and black text; the Nuxt <body> has Inter.
 */
withDefaults(defineProps<{ title?: string; message?: string; bodyFont?: boolean }>(), {
  title: 'Demo Only',
  message: 'This form is for demo purposes only. Your message has not been sent.',
  bodyFont: false,
})
const open = defineModel<boolean>({ default: false })

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div
    v-show="open"
    class="demo-notice fade-in fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
    :class="{ 'demo-notice--body-font': bodyFont }"
    @click.self="open = false"
  >
    <div class="bg-white rounded-lg max-w-[90vw] shadow-lg overflow-hidden">
      <div class="relative border-b border-gray-200 px-4 py-3 flex items-center justify-center h-[50px]">
        <span class="text-lg font-semibold">{{ title }}</span>
        <button
          type="button"
          class="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-800 text-2xl leading-none"
          @click="open = false"
        >
          &times;
        </button>
      </div>
      <div class="p-6 flex flex-col items-center gap-3 text-center">
        <Icon
          name="ion:information-circle-outline"
          style="font-size: 3rem; color: var(--company-primary-base)"
        />
        <p class="text-base">{{ message }}</p>
      </div>
      <div class="px-6 pb-6 flex justify-center">
        <button
          type="button"
          class="px-5 py-2 company-primary-base-background rounded-sm text-white focus:outline-hidden focus:ring-2 focus:ring-pink-300"
          @click="open = false"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.demo-notice--body-font {
  font-family: Poppins, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
  color: #000;
}

.fade-in {
  opacity: 1;
  animation-name: fadeInOpacity;
  animation-iteration-count: 1;
  animation-timing-function: ease-in;
  animation-duration: 0.5s;
}

@keyframes fadeInOpacity {
  0% {
    opacity: 0;
  }

  100% {
    opacity: 1;
  }
}
</style>
