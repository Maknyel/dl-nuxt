<script setup lang="ts">
// Template 3's nav (template-3/nav/layout-4.blade.php). Desktop (lg+): the logo row with the phone and address on the
// right, a black menu row (white, spaced uppercase links), then the search row; 12.5rem in all, sticky. Below lg: the
// mobile nav, the same as templates 2 and 4 (template-2/nav/MobileNav.vue).
// The Blade's `lg:container` and `zoom-75` are left out, as in template-2/Nav.vue.
import NavDemoBanner from '../template-2/nav/DemoBanner.vue'
import NavLogo from '../template-2/nav/Logo.vue'
import NavSearchBar from '../template-2/nav/SearchBar.vue'
import NavMobile from '../template-2/nav/MobileNav.vue'

const { company, menus } = useSite()
const demo = isDemoHost(useRequestURL().hostname)

const state = computed(() => capsOnly(company.value.state))
const mapUrl = computed(
  () =>
    `https://www.google.com/maps/dir/?api=1&destination=${company.value.street_address ?? ''}, ${company.value.city ?? ''}, ${state.value} ${company.value.zip_code ?? ''}`,
)
</script>

<template>
  <NavDemoBanner v-if="demo" />

  <!-- web view -->
  <nav class="lg:block hidden sticky z-50 bg-white h-[12.5rem]" :class="demo ? 'top-[32px]' : 'top-0'">
    <div class="h-[6.5rem] flex flex-col px-0 lg:px-5 xl:px-5 py-0 lg:py-3 xl:py-3 shadow-lg bg-neutral-base">
      <div class="flex-1 flex justify-between items-center gap-4">
        <NavLogo />

        <!-- The Blade's "Responsive Nav" here is lg:hidden inside this lg-only nav, so it never shows: not ported. -->

        <!-- Block Nav -->
        <div class="hidden lg:flex flex-col gap-2">
          <span class="text-neutral-content tracking-tight self-end flex flex-col text-right">
            <a
              v-if="company.phone_number"
              class="py-1.5 font-bold flex items-center gap-1 self-end"
              :href="`tel:${company.phone_number}`"
            >
              <Icon name="ion:call" />
              <span>{{ formatPhone(company.phone_number) }}</span>
            </a>
            <a
              v-if="company.street_address"
              class="py-1.5 font-bold flex items-center gap-1 self-end"
              target="_blank"
              :href="mapUrl"
            >
              <Icon name="ion:location" />
              <span>{{ company.street_address }} {{ company.city }} {{ state }} {{ company.zip_code }}</span>
            </a>
          </span>

          <div class="hidden gap-4 uppercase items-center">
            <NuxtLink
              v-for="menu in menus"
              :key="menu.to"
              class="text-neutral-content font-semibold tracking-tight transition duration-150 ease-in-out text-lg"
              :to="menu.to"
            >
              {{ menu.label }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <div class="h-[2.75rem] lg:flex hidden gap-10 uppercase items-center bg-black w-full shadow-lg py-2.5 px-5 justify-center">
      <NuxtLink
        v-for="menu in menus"
        :key="menu.to"
        class="menu-text font-bold tracking-tight transition duration-150 ease-in-out text-sm"
        :to="menu.to"
      >
        {{ menu.label }}
      </NuxtLink>
    </div>

    <NavSearchBar />
  </nav>

  <!-- mobile view -->
  <NavMobile :demo="demo" />
</template>

<style scoped>
.menu-text {
  color: white;
  letter-spacing: 2px;
}

.menu-text:hover {
  color: #fff;
  font-weight: 700;
}
</style>
