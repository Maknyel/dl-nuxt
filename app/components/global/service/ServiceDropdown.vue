<script setup lang="ts">
/**
 * <x-service-dropdown> (resources/views/components/service-dropdown.blade.php + App\View\Components\ServiceDropdown):
 * the multi-select of the dealer's services. A button showing the choice ("A", "A and B", "3 Services Selected" or the
 * placeholder) opens a panel of checkboxes, one per service plus "Other" when the dealer has no service of that name;
 * a click outside closes it. `v-model` is the list of chosen service titles (the Blade's `x-model`).
 */
const props = withDefaults(
  defineProps<{
    services: { id: number | string; title: string }[]
    placeholder?: string | null
    name?: string | null
    isOpen?: boolean
  }>(),
  { placeholder: null, name: null, isOpen: false },
)

const selected = defineModel<string[]>({ default: () => [] })
const open = ref(props.isOpen)
const root = ref<HTMLElement | null>(null)

const hasOther = computed(() => props.services.some((s) => String(s.title).toLowerCase() === 'other'))

const label = computed(() => {
  const v = selected.value
  if (v.length === 0) return props.placeholder ?? ''
  if (v.length === 1) return v[0]
  if (v.length === 2) return `${v[0]} and ${v[1]}`
  return `${v.length} Services Selected`
})

// Alpine's @click.away.
function onDocumentClick(e: MouseEvent) {
  if (open.value && root.value && !root.value.contains(e.target as Node)) open.value = false
}
onMounted(() => document.addEventListener('click', onDocumentClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick))
</script>

<template>
  <div ref="root" class="flex flex-col relative text-gray-500 seachable-dropdown">
    <div
      tabindex="0"
      class="h-10 border rounded-sm flex items-center justify-between p-3 relative cursor-pointer select-none seachable-dropdown-button border-gray-500"
      :class="open ? 'border-blue-500 ring-2 ring-blue-400 shadow-md' : ''"
      @click="open = !open"
    >
      <span class="truncate max-w-[90%]">{{ label }}</span>

      <Icon name="ion:chevron-down-outline" />
    </div>
    <Transition
      enter-active-class="svc-dd-enter"
      enter-from-class="svc-dd-from"
      leave-active-class="svc-dd-leave"
      leave-to-class="svc-dd-from"
    >
      <div
        v-show="open"
        class="absolute top-full w-full z-10 border border-gray-500 px-3 py-2 rounded-sm bg-gray-50 grid md:grid-cols-2 grid-cols-1 gap-2"
      >
        <label v-for="s in services" :key="s.id" class="flex gap-2 items-center">
          <input
            v-model="selected"
            type="checkbox"
            :value="s.title"
            :name="name ?? undefined"
            class="rounded-sm border"
            :class="name ?? undefined"
          />
          <span class="select-none flex-1 truncate">{{ s.title }}</span>
        </label>
        <label v-if="!hasOther" class="flex gap-2 items-center">
          <input
            v-model="selected"
            type="checkbox"
            value="Other"
            :name="name ?? undefined"
            class="rounded-sm border"
            :class="name ?? undefined"
          />
          <span class="select-none flex-1 truncate">Other</span>
        </label>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Alpine's x-transition.origin.top.left: opacity 0 → 1 and scale 0.95 → 1, 150ms in, 75ms out. */
.svc-dd-enter,
.svc-dd-leave {
  transform-origin: top left;
  transition-property: opacity, transform;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.svc-dd-enter {
  transition-duration: 150ms;
}

.svc-dd-leave {
  transition-duration: 75ms;
}

.svc-dd-from {
  opacity: 0;
  transform: scale(0.95);
}
</style>
