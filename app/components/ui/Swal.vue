<script setup lang="ts">
/**
 * The SweetAlert2 pop-up the forms show (Sell Us Your Car and Book Service, after a VIN decode) (`Swal.fire({ icon: 'success', title:
 * 'Success!', text: 'Vin Successfully Decoded', confirmButtonText: 'Continue' })`), re-created without the library:
 * the dimmed backdrop, the popup with its icon, title, text and confirm button (the Laravel layout's `.swal2-confirm`
 * override: the dealer's primary colour, 0.25rem corners, 0.65rem 1.5rem padding, 0.875rem bold).
 *
 * The button emits `confirm` (the Blade's `result.isConfirmed`); Escape or a click on the backdrop only closes it.
 * One shared pop-up: measured against :8002.
 */
export interface SwalOptions {
  icon: 'success' | 'error'
  title: string
  text: string
  confirmButtonText?: string
}

const state = defineModel<SwalOptions | null>({ default: null })
const emit = defineEmits<{ confirm: [] }>()
const button = ref<HTMLButtonElement | null>(null)

const close = () => {
  state.value = null
}
const confirm = () => {
  state.value = null
  emit('confirm')
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && state.value) close()
}

watch(state, async (v) => {
  if (v) {
    await nextTick()
    button.value?.focus()
  }
})
onMounted(() => document.addEventListener('keydown', onKey))
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <Transition name="sell-swal">
      <div v-if="state" class="sell-swal-container" @click.self="close">
        <div class="sell-swal-popup" role="dialog" aria-modal="true" :aria-label="state.title">
          <div v-if="state.icon === 'success'" class="sell-swal-icon sell-swal-success">
            <svg viewBox="0 0 52 52" aria-hidden="true"><path d="M14 27 l8 8 l16 -18" /></svg>
          </div>
          <div v-else class="sell-swal-icon sell-swal-error">
            <svg viewBox="0 0 52 52" aria-hidden="true"><path d="M16 16 L36 36 M36 16 L16 36" /></svg>
          </div>
          <h2 class="sell-swal-title">{{ state.title }}</h2>
          <div class="sell-swal-text">{{ state.text }}</div>
          <div class="sell-swal-actions">
            <button ref="button" type="button" class="sell-swal-confirm" @click="confirm">
              {{ state.confirmButtonText || 'OK' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sell-swal-container {
  position: fixed;
  inset: 0;
  z-index: 1060;
  display: grid;
  place-items: center;
  padding: 0.625em;
  background: rgba(0, 0, 0, 0.4);
  overflow-y: auto;
}

.sell-swal-popup {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 32em;
  max-width: 100%;
  padding: 1.25em;
  border-radius: 5px;
  background: #fff;
  color: #595959;
  font-size: 1rem;
  font-family: inherit;
  text-align: center;
}

.sell-swal-icon {
  position: relative;
  box-sizing: content-box;
  width: 5em;
  height: 5em;
  margin: 1.25em auto 1.875em;
  border: 0.25em solid;
  border-radius: 50%;
}

.sell-swal-icon svg {
  width: 100%;
  height: 100%;
  fill: none;
  stroke-width: 4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.sell-swal-success {
  border-color: rgba(165, 220, 134, 0.3);
}

.sell-swal-success svg {
  stroke: #a5dc86;
}

.sell-swal-error {
  border-color: #f27474;
}

.sell-swal-error svg {
  stroke: #f27474;
}

.sell-swal-title {
  margin: 0 0 0.4em;
  padding: 0;
  font-size: 1.875em;
  line-height: 1.5;
  font-weight: 600;
  color: inherit;
  word-wrap: break-word;
}

.sell-swal-text {
  margin: 0;
  font-size: 1.125em;
  line-height: normal;
  word-wrap: break-word;
}

.sell-swal-actions {
  display: flex;
  justify-content: center;
  margin: 1.25em auto 0;
  padding: 0 1.6em;
}

.sell-swal-confirm {
  margin: 0.3125em;
  border: 0;
  border-radius: 0.25rem;
  padding: 0.65rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: #fff;
  background: var(--company-primary-base);
  cursor: pointer;
}

.sell-swal-enter-active,
.sell-swal-leave-active {
  transition: opacity 0.1s;
}

.sell-swal-enter-active .sell-swal-popup {
  animation: sell-swal-show 0.3s;
}

.sell-swal-enter-from,
.sell-swal-leave-to {
  opacity: 0;
}

@keyframes sell-swal-show {
  0% {
    transform: scale(0.7);
  }

  45% {
    transform: scale(1.05);
  }

  80% {
    transform: scale(0.95);
  }

  100% {
    transform: scale(1);
  }
}
</style>
