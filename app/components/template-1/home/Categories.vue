<script setup lang="ts">
/**
 * template-1/cars/layout-4.blade.php, "Popular Categories": four cards (Under $20K, SUVs, Trucks, Sedans) with their
 * counts, each linking to the inventory. (The Blade's vehicle cards include is commented out, so none here.)
 */
import type { T1HomeData } from './types'
import T1Icon from './Icon.vue'

const props = defineProps<{ data: T1HomeData }>()

const bodyTypes = computed(() => {
  const unfiltered = props.data.unfiltered_body_type_counts
  return unfiltered && unfiltered.length ? unfiltered : (props.data.vehiclebodytype ?? [])
})
const typeOf = (b: { body_type?: string }) => String(b.body_type ?? '').toLowerCase()
const countOf = (name: string) => Number(bodyTypes.value.find((b) => typeOf(b) === name)?.count ?? 0)
const truckCount = computed(() =>
  bodyTypes.value
    .filter((b) => ['truck', 'pickup truck', 'pickup'].includes(typeOf(b)))
    .reduce((n, b) => n + Number(b.count ?? 0), 0),
)

const bodyUrl = (type: string) =>
  '/pre-owned-cars?list=&page=1&grid=&search=&per_page=&sort_by=&last_updated_value=body_type&is_make_active=&is_model_active=&is_year_active=&is_internet_price_active=&is_mileage_active=&internet_price_from=&internet_price_to=&body_type%5B%5D=' +
  type +
  '&year_from=&year_to=&mileage_from=&mileage_to='

const categories = computed(() => [
  {
    name: 'Vehicles Under $20K',
    browse: 'Browse Vehicles Under $20K',
    icon: 'tag',
    count: Number(props.data.under_20k_count ?? 0),
    text: 'Quality vehicles at affordable prices.',
    href: '/pre-owned-cars?max_price=20000',
  },
  { name: 'SUVs', browse: 'Browse SUVs', icon: 'car', count: countOf('suv'), text: 'Explore our wide selection of SUVs.', href: bodyUrl('SUV') },
  { name: 'Trucks', browse: 'Browse Trucks', icon: 'truck', count: truckCount.value, text: 'Power, capability, and performance.', href: bodyUrl('Truck') },
  { name: 'Sedans', browse: 'Browse Sedans', icon: 'car', count: countOf('sedan'), text: 'Comfortable rides for every journey.', href: bodyUrl('Sedan') },
])
</script>

<template>
  <section class="container t1-sec mx-auto px-10 py-5 category-section">
    <h2 class="categories-heading">Popular Categories</h2>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <NuxtLink v-for="cat in categories" :key="cat.name" :to="cat.href" class="category-card">
        <span class="category-watermark"><T1Icon :name="cat.icon" class="category-watermark-ico" :stroke="1.25" /></span>

        <div class="flex items-start justify-between gap-2">
          <div class="t1-tile t1-tile--soft category-tile">
            <T1Icon :name="cat.icon" class="t1-ico" />
          </div>
          <span v-if="cat.count > 0" class="category-count">{{ cat.count.toLocaleString('en-US') }} Vehicles</span>
        </div>
        <div class="category-name">{{ cat.name }}</div>
        <div class="category-text">{{ cat.text }}</div>
        <div class="flex-1"></div>
        <div class="category-foot">
          <span>{{ cat.browse }}</span>
          <span class="category-arrow"><T1Icon name="arrow-right" class="t1-ico-sm" :stroke="2.5" /></span>
        </div>
      </NuxtLink>
    </div>
  </section>
</template>

<style scoped>
.category-section {
  padding-top: 2rem;
  padding-bottom: 2rem;
}

.categories-heading {
  margin-bottom: 1.875rem;
  text-align: center;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--t1-ink, #16131f);
}

@media (min-width: 1024px) {
  .category-section .grid {
    gap: 1.25rem;
  }
}

.category-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 12.5rem;
  padding: 1.1rem 1.1rem 1rem;
  border-radius: 1rem;
  overflow: hidden;
  background: #fff;
  border: 1px solid var(--t1-line, #e9e8ee);
  box-shadow: var(--t1-card-shadow, 0 12px 30px -20px rgba(22, 19, 31, 0.28));
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
}

.category-card:hover {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--company-primary-base) 30%, #ffffff);
  box-shadow: 0 18px 36px -20px rgba(22, 19, 31, 0.35);
}

.category-tile {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.75rem;
}

.category-count {
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--t1-muted, #6b6880);
  background: color-mix(in srgb, var(--company-primary-base) 5%, #f4f4f7);
  border: 1px solid var(--t1-line, #e9e8ee);
  white-space: nowrap;
}

.category-name {
  position: relative;
  margin-top: 1.25rem;
  font-family: 'Outfit', 'Inter', sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--t1-ink, #16131f);
}

.category-text {
  position: relative;
  margin-top: 0.3rem;
  font-size: 0.8125rem;
  color: var(--t1-muted, #6b6880);
}

.category-foot {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: 1rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--t1-ink, #16131f);
}

.category-arrow {
  width: 1.9rem;
  height: 1.9rem;
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--company-primary-base);
  background: color-mix(in srgb, var(--company-primary-base) 9%, #ffffff);
  transition: background 0.15s, color 0.15s, transform 0.15s;
}

.category-card:hover .category-arrow {
  color: #fff;
  background: var(--company-primary-base);
  transform: translateX(2px);
}

.category-watermark {
  display: none;
  position: absolute;
  right: -0.75rem;
  bottom: -0.5rem;
  color: color-mix(in srgb, var(--company-primary-base) 4%, #f3f3f6);
  pointer-events: none;
}

.category-watermark-ico {
  width: 7.5rem;
  height: 7.5rem;
}

@media (max-width: 640px) {
  .categories-heading {
    font-size: 1.375rem;
  }

  .category-name {
    font-size: 1.0625rem;
  }

  .category-watermark-ico {
    width: 5rem;
    height: 5rem;
  }
}
</style>
