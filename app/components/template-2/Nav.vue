<script setup lang="ts">
// Template 2's nav (template-2/nav/layout-4.blade.php). Desktop (lg+): a white top bar with the phone and address, the
// logo row with the menu, then the search row; 12.5rem in all, sticky. Below lg: the mobile nav (same in T2-T4).
// The Blade's `lg:container` (logo row) and `zoom-75` are left out: the Laravel build has no lg:container rule and an
// empty zoom-75, but Tailwind 4 generates both (a breakpoint-capped container; zoom: .75).
import NavDemoBanner from './nav/DemoBanner.vue'
import NavLogo from './nav/Logo.vue'
import NavSearchBar from './nav/SearchBar.vue'
import NavMobile from './nav/MobileNav.vue'

const { company, menus, isSales } = useSite()
const demo = isDemoHost(useRequestURL().hostname)

const state = computed(() => capsOnly(company.value.state))
const mapUrl = computed(
  () =>
    `https://www.google.com/maps/dir/?api=1&destination=${company.value.street_address ?? ''}, ${company.value.city ?? ''}, ${state.value} ${company.value.zip_code ?? ''}`,
)
</script>

<template>
  <!-- for demo site -->
  <NavDemoBanner v-if="demo" />

  <!-- web view -->
  <nav class="lg:block hidden sticky z-50 bg-white h-[12.5rem]" :class="demo ? 'top-[32px]' : 'top-0'">
    <div class="h-[3rem] bg-white border-b border-gray-200">
      <div class="container">
        <div class="right-info">
          <ul class="flex justify-start gap-4 items-center p-2">
            <!-- Sales site: the icon beside the link, not in it. -->
            <li v-if="isSales" class="flex items-center gap-1">
              <Icon name="ion:call-outline" /> <a :href="`tel:${company.phone_number ?? ''}`">{{ formatPhone(company.phone_number) }}</a>
            </li>
            <li v-else class="flex items-center gap-1">
              <a :href="`tel:${company.phone_number ?? ''}`" class="flex items-center gap-1">
                <Icon name="ion:call-outline" /> {{ formatPhone(company.phone_number) }}
              </a>
            </li>
            <li class="flex items-center gap-1">
              <Icon name="ion:location-outline" />
              <a target="_blank" :href="mapUrl">
                {{ company.street_address }} {{ company.city }} {{ state }} {{ company.zip_code }}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div class="h-[6.25rem] flex flex-col px-0 lg:px-5 xl:px-5 py-0 lg:py-3 xl:py-3 shadow-lg bg-neutral-base">
      <div class="flex-1 flex justify-between items-center gap-4">
        <NavLogo />

        <div
          class="lg:flex hidden gap-4 uppercase items-center text-base-content h-[2.75rem] py-2.5 justify-center"
          style="top: 6rem"
        >
          <NuxtLink
            v-for="menu in menus"
            :key="menu.to"
            class="menu-text hover:text-red-700 font-normal tracking-tight transition duration-150 ease-in-out menu-items-desktop"
            :to="menu.to"
          >
            {{ menu.label }}
          </NuxtLink>
        </div>

        <!-- The Blade's "Responsive Nav" here is lg:hidden inside this lg-only nav, so it never shows: not ported. -->

        <!-- Block Nav (its menu copy is hidden in the Blade too) -->
        <div class="hidden lg:flex flex-col gap-2">
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

    <!-- search -->
    <NavSearchBar />
  </nav>

  <!-- mobile view -->
  <NavMobile :demo="demo" />
</template>

<style scoped>
.menu-text {
  color: black;
}

.menu-text:hover {
  color: var(--company-primary-base);
  font-weight: 700;
}
</style>
