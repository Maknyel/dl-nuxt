<script setup lang="ts">
/**
 * An Ionicon as inline SVG (the Nuxt project's @nuxt/icon, ADR-0002): `<Icon name="ion:call-outline" />`, 1em square
 * (class `ion-icon`, main.css), or `size="1.5rem"`. Only the icons the app names are bundled (vite.config.ts,
 * `virtual:ion-icons`), so none is fetched and none pops in after load. Other attributes (class, style, aria-hidden)
 * land on the <svg>.
 */
import icons from 'virtual:ion-icons'

const props = defineProps<{ name: string; size?: string | number }>()

const icon = computed(() => icons[props.name.replace(/^ion:/, '')] ?? null)
const sizeStyle = computed(() => {
  if (props.size === undefined || props.size === '') return undefined
  const size = typeof props.size === 'number' ? `${props.size}px` : props.size
  return { width: size, height: size, fontSize: size }
})
</script>

<template>
  <svg
    v-if="icon"
    xmlns="http://www.w3.org/2000/svg"
    class="ion-icon iconify iconify--ion"
    :viewBox="`0 0 ${icon.width} ${icon.height}`"
    :style="sizeStyle"
    role="img"
    aria-hidden="true"
    v-html="icon.body"
  />
</template>
