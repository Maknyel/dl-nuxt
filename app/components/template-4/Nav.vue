<script setup lang="ts">
// Template 4's nav (template-4/nav/layout-4.blade.php). Desktop (lg+): the blue #sub-header bar with the phone and
// address (template4.min.css), the logo row with the centred menu (12px bold uppercase), then the search row; 12.5rem
// in all, sticky. Below lg: the mobile nav, the same as templates 2 and 3 (template-2/nav/MobileNav.vue).
// The Blade's `lg:container` and `zoom-75` are left out, as in template-2/Nav.vue.
import NavDemoBanner from '../template-2/nav/DemoBanner.vue'
import NavLogo from '../template-2/nav/Logo.vue'
import NavSearchBar from '../template-2/nav/SearchBar.vue'
import NavMobile from '../template-2/nav/MobileNav.vue'

const { company, menus, isSales } = useSite()
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
    <div id="sub-header" class="h-[4.5rem] lg:flex hidden">
      <div class="container">
        <div class="right-info">
          <ul class="flex justify-end items-center text-slate-400">
            <!-- Sales site: "Call us:" and the number. -->
            <li v-if="isSales">Call us: <a :href="`tel:${company.phone_number ?? ''}`">{{ formatPhone(company.phone_number) }}</a></li>
            <li v-else>
              <a :href="`tel:${company.phone_number ?? ''}`" class="flex items-center gap-1">
                <Icon name="ion:call" /> {{ formatPhone(company.phone_number) }}
              </a>
            </li>
            <li>
              Address:
              <a target="_blank" :href="mapUrl">
                {{ company.street_address }} {{ company.city }} {{ state }} {{ company.zip_code }}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div class="h-[6.75rem] flex flex-col px-0 lg:px-5 xl:px-5 py-0 lg:py-3 xl:py-3 shadow-lg bg-neutral-base">
      <div class="flex-1 flex justify-between items-center gap-4">
        <NavLogo />

        <div class="lg:flex hidden gap-6 uppercase items-center h-[2.75rem] py-2.5 justify-center" style="top: 6rem">
          <NuxtLink
            v-for="menu in menus"
            :key="menu.to"
            class="menu-text transition duration-150 ease-in-out menu-items-desktop tracking-wide"
            :to="menu.to"
          >
            {{ menu.label }}
          </NuxtLink>
        </div>

        <!-- Its menu copy is hidden in the Blade too. -->
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
/* template4.min.css (its live nav rules). The Blade's own .menu-text comes after it in the page, so it wins. */
#sub-header {
  width: 100%;
  height: 42px;
  background-image: linear-gradient(-45deg, #2f5e8e 40%, #336699 40%);
}

@media (max-width: 991px) {
  #sub-header {
    background-image: none;
    background-color: #336699;
  }
}

#sub-header .right-info ul {
  padding: 0;
  margin: 0;
  list-style: none;
}

#sub-header ul {
  padding: 0;
  margin: 0;
  list-style: none;
}

#sub-header .right-info ul li {
  color: #ffffff;
  font-size: 11px;
  font-family: 'Montserrat', sans-serif;
  border-right: 1px solid #2b5782;
}

.menu-items-desktop {
  font-size: 12px;
  color: #222222;
  text-transform: uppercase;
  font-weight: 700;
}

#sub-header ul li {
  display: inline-block;
  padding: 10px 5px;
}

#sub-header .right-info ul li a {
  color: #ffffff;
  font-size: 11px;
  font-family: 'Montserrat', sans-serif;
  font-weight: normal !important;
}

#sub-header ul li a {
  color: #ffffff;
  font-size: 13px;
}

/* The Blade's inline style. */
.menu-text {
  color: black;
}

.menu-text:hover {
  font-weight: 700;
}
</style>
