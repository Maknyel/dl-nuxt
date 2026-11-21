<script setup lang="ts">
/**
 * A copy button (the Laravel vdp-theme `vdpCopy()`): copies `text`, ticks for 1.4s (`is-copied`, the check icon).
 * Classes come from the parent (`vdp-copy vdp-copy--inline` / `--pill`).
 */
const props = defineProps<{ text: string; label: string }>()

const copied = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

function done() {
  copied.value = true
  clearTimeout(timer)
  timer = setTimeout(() => (copied.value = false), 1400)
}

function fallback() {
  const ta = document.createElement('textarea')
  ta.value = props.text
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  try {
    document.execCommand('copy')
    done()
  } catch {
    // Nothing to copy with.
  }
  ta.remove()
}

function copy() {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(props.text).then(done, fallback)
  } else {
    fallback()
  }
}

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <button type="button" :class="{ 'is-copied': copied }" :aria-label="label" @click="copy">
    <Icon :name="copied ? 'ion:checkmark-outline' : 'ion:copy-outline'" />
  </button>
</template>
