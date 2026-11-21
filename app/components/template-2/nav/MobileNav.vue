<script setup lang="ts">
// The mobile nav (below lg) of templates 2, 3 and 4: the same markup in all three Blade navs. Logo, then the
// location, phone and menu buttons, each opening its panel under the nav (the Alpine `dropdown`: isOpenLoc,
// isOpenPhone, isOpen, each closed by a click outside it), then the search row.
// (The Blade row's `lg:container` is left out: the Laravel build has no such rule; Tailwind 4 would generate one.)
// The icons' text-2xl is size="1.5rem": <Icon> puts font-size: 1em inline, which a text-* class can't override.
import NavLogo from './Logo.vue'
import NavSearchBar from './SearchBar.vue'

const props = defineProps<{ demo?: boolean }>()
const { company, menus } = useSite()

const phone = computed(() => company.value.phone_number ?? '')
const phoneText = computed(() => formatPhone(company.value.phone_number))
const state = computed(() => capsOnly(company.value.state))
const mapUrl = computed(
  () =>
    `https://www.google.com/maps/dir/?api=1&destination=${company.value.street_address ?? ''}, ${company.value.city ?? ''}, ${state.value} ${company.value.zip_code ?? ''}`,
)

const isOpen = ref(false)
const isOpenLoc = ref(false)
const isOpenPhone = ref(false)

const menuPanel = ref<HTMLElement | null>(null)
const locPanel = ref<HTMLElement | null>(null)
const phonePanel = ref<HTMLElement | null>(null)

// Alpine's @click.away: a click outside a panel that was shown when the click started closes it. So the click that
// opens a panel doesn't close it, its button closes it again, and opening another panel closes this one. (The open
// states are taken in the capture phase: Vue has already re-rendered by the time the click bubbles to document.)
const panels: [Ref<HTMLElement | null>, Ref<boolean>][] = [
  [locPanel, isOpenLoc],
  [phonePanel, isOpenPhone],
  [menuPanel, isOpen],
]
let openAtClick: boolean[] = []
function onClickCapture() {
  openAtClick = panels.map(([, open]) => open.value)
}
function onDocumentClick(event: MouseEvent) {
  const target = event.target as Node | null
  panels.forEach(([panel, open], i) => {
    if (!openAtClick[i]) return
    if (target && panel.value?.contains(target)) return
    open.value = false
  })
}
onMounted(() => {
  document.addEventListener('click', onClickCapture, true)
  document.addEventListener('click', onDocumentClick)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onClickCapture, true)
  document.removeEventListener('click', onDocumentClick)
})
</script>

<template>
  <nav class="lg:hidden sticky z-50 h-auto bg-white" :class="props.demo ? 'top-[32px]' : 'top-0'">
    <!-- menu and navigation -->
    <div class="h-[4rem] flex-1 flex justify-between items-center gap-4">
      <NavLogo />
      <div class="flex lg:hidden items-stretch p-2">
        <button class="px-2 border-black border-l-2" @click.prevent="isOpenLoc = !isOpenLoc">
          <Icon class="p-3 box-content" size="1.5rem" name="ion:location" />
        </button>
        <button class="px-2 border-black border-l-2" @click.prevent="isOpenPhone = !isOpenPhone">
          <Icon class="p-3 box-content" size="1.5rem" name="ion:call" />
        </button>
        <button class="px-2 border-black border-l-2" @click.prevent="isOpen = !isOpen">
          <Icon class="pl-3 pt-3 pb-3 pr-1 box-content" size="1.5rem" name="ion:menu" />
        </button>

        <Transition
          enter-active-class="nav-panel-transition"
          leave-active-class="nav-panel-transition"
          enter-from-class="nav-panel-hidden"
          leave-to-class="nav-panel-hidden"
        >
          <div
            v-show="isOpenLoc"
            ref="locPanel"
            class="absolute left-0 top-full w-full bg-white shadow-lg rounded-b-lg flex flex-col gap-8 px-5 py-6"
          >
            <a target="_blank" :href="mapUrl">
              <div class="flex gap-2 items-center text-neutral-content text-lg hover:text-red-700">
                <Icon size="1.5rem" name="ion:location" />
                <span class="tracking-tight self-end">
                  {{ company.street_address }} {{ company.city }} {{ state }} {{ company.zip_code }}
                </span>
              </div>
            </a>
          </div>
        </Transition>

        <Transition
          enter-active-class="nav-panel-transition"
          leave-active-class="nav-panel-transition"
          enter-from-class="nav-panel-hidden"
          leave-to-class="nav-panel-hidden"
        >
          <div
            v-show="isOpenPhone"
            ref="phonePanel"
            class="absolute left-0 top-full w-full bg-white shadow-lg rounded-b-lg flex flex-col gap-8 px-5 py-6"
          >
            <a :href="`tel:${phone}`">
              <div class="flex gap-2 items-center text-neutral-content text-lg hover:text-red-700">
                <Icon size="1.5rem" name="ion:call" />
                <span class="tracking-tight self-end">{{ phoneText }}</span>
              </div>
            </a>
          </div>
        </Transition>

        <Transition
          enter-active-class="nav-panel-transition"
          leave-active-class="nav-panel-transition"
          enter-from-class="nav-panel-hidden"
          leave-to-class="nav-panel-hidden"
        >
          <div
            v-show="isOpen"
            ref="menuPanel"
            class="max-h-nav overflow-auto absolute left-0 top-full w-full bg-white z-50 shadow-lg rounded-b-lg flex flex-col gap-4 px-5 py-6"
          >
            <NuxtLink
              v-for="menu in menus"
              :key="menu.to"
              class="text-neutral-content tracking-tight hover:text-red-700 transition duration-150 ease-in-out text-lg"
              :to="menu.to"
              @click="isOpen = false"
            >
              {{ menu.label }}
            </NuxtLink>
          </div>
        </Transition>
      </div>
    </div>

    <!-- search -->
    <NavSearchBar />
  </nav>
</template>

<style scoped>
/* Alpine's x-transition.duration.150ms: opacity and a 95% scale, in and out. */
.nav-panel-transition {
  transition-property: opacity, transform;
  transition-duration: 150ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: center;
}

.nav-panel-hidden {
  opacity: 0;
  transform: scale(0.95);
}
</style>
