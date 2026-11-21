<script setup lang="ts">
// The navs' search row (templates 2-4, desktop and mobile): a GET form to the inventory page. The input shows only
// when the dealer shows View Inventory, as in the Blade.
// The Blade's `zoom-75` class is left out in these navs and the footer: it's an empty rule on the Laravel site, but
// Tailwind 4 makes it `zoom: .75`.
const route = useRoute()
const { templateNav } = useSite()
const showInput = computed(() => String(templateNav.value?.show_view_inventory ?? '') === '1')
const search = computed(() => (typeof route.query.search === 'string' ? route.query.search : ''))
</script>

<template>
  <div
    class="h-[3.25rem] flex gap-4 uppercase items-center company-secondary-base-background text-base-content w-full shadow-lg py-1 lg:py-3 px-3 lg:px-5 justify-end search-box-header"
  >
    <div class="flex gap-4 uppercase justify-around items-center w-full">
      <div class="relative w-full max-w-4xl text-gray-600 block">
        <form method="get" action="/pre-owned-cars">
          <input
            v-if="showInput"
            id="search"
            class="border-2 w-full border-gray-300 bg-white h-9 pl-8 pr-8 rounded-lg text-sm focus:outline-hidden"
            type="search"
            name="search"
            :value="search"
            placeholder="SEARCH OUR ENTIRE SITE"
          >
          <button type="submit" class="absolute right-0 top-0 mt-[.65rem] mr-4">
            <svg
              class="text-gray-600 h-4 w-4 fill-current"
              xmlns="http://www.w3.org/2000/svg"
              version="1.1"
              x="0px"
              y="0px"
              viewBox="0 0 56.966 56.966"
              style="enable-background: new 0 0 56.966 56.966"
              xml:space="preserve"
              width="512px"
              height="512px"
            >
              <path
                d="M55.146,51.887L41.588,37.786c3.486-4.144,5.396-9.358,5.396-14.786c0-12.682-10.318-23-23-23s-23,10.318-23,23  s10.318,23,23,23c4.761,0,9.298-1.436,13.177-4.162l13.661,14.208c0.571,0.593,1.339,0.92,2.162,0.92  c0.779,0,1.518-0.297,2.079-0.837C56.255,54.982,56.293,53.08,55.146,51.887z M23.984,6c9.374,0,17,7.626,17,17s-7.626,17-17,17  s-17-7.626-17-17S14.61,6,23.984,6z"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
#search::-webkit-input-placeholder {
  text-align: center;
}

#search:-moz-placeholder {
  text-align: center;
}

@media (min-width: 1024px) {
  .search-box-header {
    top: 9rem;
  }
}
</style>
