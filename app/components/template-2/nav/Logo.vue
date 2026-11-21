<script setup lang="ts">
// The navs' logo block (templates 2-4, desktop and mobile): the dealer's logo, Dealer Lion's when it fails to load
// (the Blade's onerror).
const { company, logoUrl } = useSite()
const img = ref<HTMLImageElement | null>(null)

function fallback() {
  if (img.value && !img.value.src.endsWith(DEALER_LION_LOGO)) img.value.src = DEALER_LION_LOGO
}

// An image that failed before hydration never fires @error again.
onMounted(() => {
  if (img.value?.complete && img.value.naturalWidth === 0) fallback()
})
</script>

<template>
  <div id="logo" class="w-40 flex items-start justify-center flex-1 flex-col">
    <NuxtLink class="flex flex-1 flex-col items-center" to="/">
      <img
        ref="img"
        class="pl-2 lg:p-0 w-auto lg:max-h-[75px] max-h-[60px]"
        :src="logoUrl()"
        :alt="company.name"
        @error="fallback"
      >
    </NuxtLink>
  </div>
</template>
