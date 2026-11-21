<script setup lang="ts">
/**
 * template-1/hero/layout-4.blade.php: a white card in two columns. The rating pill, the heading, a line, the search and
 * the quick chips at the left; the photo at the right, faded into the card.
 */
import type { T1Review } from './types'
import T1Icon from './Icon.vue'

const props = defineProps<{ reviews: T1Review[] }>()

const { company, site } = useSite()

/** The hero photo: pre_define.v2_home.currentImage, else v2_hero_page (with the legacy /imgs/hero-image/ paths moved). */
const bg = computed(() => {
  const mainUrl = String(site.value?.mediaBase ?? '')
  let raw: string | null = company.value.pre_define?.v2_home?.currentImage ?? null
  if (!raw || raw.startsWith('data:')) raw = company.value.v2_hero_page ?? null
  if (raw && raw.startsWith('/imgs/hero-image/')) {
    const suffix = raw.slice('/imgs/hero-image/'.length)
    raw = suffix.includes('/') ? `/global_images/home_new/hero-image/${suffix}` : `/global_images/home_new/${suffix}`
  }
  if (raw && !raw.startsWith('data:')) {
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
    if (raw.startsWith('/') || raw.startsWith('imgs/')) {
      const min = raw.startsWith('/') ? raw : `/${raw}`
      return min.replace('-min.jpg', '.webp')
    }
    return (mainUrl + raw).replace('.png', '.webp')
  }
  return `${mainUrl}global_images/home_new/template-1 - layout-1 - Desktop.webp`
})

useHead(() => ({
  link: [{ rel: 'preload', as: 'image', type: 'image/webp', href: bg.value, fetchpriority: 'high' }],
}))

// The rating pill: the dealer's own reviews; hidden with none.
const reviewCount = computed(() => props.reviews.length)
const rating = computed(() => {
  if (!reviewCount.value) return null
  const avg = props.reviews.reduce((n, r) => n + Number(r.rating ?? 0), 0) / reviewCount.value
  return (Math.round(avg * 10) / 10).toFixed(1)
})

const bodyUrl = (type: string) =>
  '/pre-owned-cars?list=&page=1&grid=&search=&per_page=&sort_by=&last_updated_value=body_type&is_make_active=&is_model_active=&is_year_active=&is_internet_price_active=&is_mileage_active=&internet_price_from=&internet_price_to=&body_type%5B%5D=' +
  type +
  '&year_from=&year_to=&mileage_from=&mileage_to='

const chips = [
  { label: 'SUVs', href: bodyUrl('SUV') },
  { label: 'Trucks', href: bodyUrl('Truck') },
  { label: 'Sedans', href: bodyUrl('Sedan') },
  { label: 'Under $20K', href: '/pre-owned-cars?max_price=20000' },
  { label: 'AWD & 4WD', href: '/pre-owned-cars?page=1&last_updated_value=drivetrain&drivetrain%5B%5D=AWD&drivetrain%5B%5D=4WD' },
]

const search = ref('')
function onSearch() {
  navigateTo(`/pre-owned-cars?${new URLSearchParams({ search: search.value })}`)
}
</script>

<template>
  <section class="container t1-sec t1-hero-wrap">
    <div class="t1-hero">
      <div v-if="rating" class="t1-hero-top">
        <div class="t1-hero-pill">
          <span class="t1-hero-stars" aria-hidden="true">★★★★★</span>
          <strong>{{ rating }}</strong>
          <span>from {{ reviewCount }} {{ reviewCount === 1 ? 'review' : 'reviews' }}</span>
          <span class="t1-hero-pill-sep"></span>
          <span>Local &amp; trusted</span>
        </div>
      </div>

      <div class="t1-hero-content">
        <h1 class="t1-hero-title">Your next ride<br />starts here.</h1>
        <p class="t1-hero-lead">
          Hand-picked pre-owned vehicles, honest prices,<br class="t1-hero-lead-br" /> and financing for every credit
          situation.
        </p>

        <form action="/pre-owned-cars" method="GET" class="t1-hero-search" @submit.prevent="onSearch">
          <T1Icon name="search" class="t1-ico-sm t1-hero-search-icon" />
          <input
            v-model="search"
            type="text"
            name="search"
            placeholder="Search by make, model, or keyword"
            required
            class="t1-hero-search-input"
          />
          <button type="submit" class="t1-hero-search-btn">Search</button>
        </form>

        <div class="t1-hero-chips">
          <NuxtLink v-for="chip in chips" :key="chip.label" :to="chip.href" class="t1-hero-chip">{{ chip.label }}</NuxtLink>
        </div>
      </div>

      <div class="t1-hero-photo">
        <img :src="bg" :alt="company.name" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.t1-hero-wrap {
  padding-top: 1rem;
}

.t1-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
  gap: 0;
  align-items: center;
  padding: 0;
  overflow: hidden;
  border-radius: 1.5rem;
  background: #fff;
  border: 1px solid var(--t1-line, #ebeaf0);
  box-shadow: 0 24px 50px -32px rgba(22, 19, 31, 0.35), 0 1px 2px rgba(22, 19, 31, 0.05);
}

.t1-hero-content {
  padding: 3.5rem 2rem 3.5rem 3rem;
}

.t1-hero-top {
  grid-column: 1 / -1;
  position: relative;
  z-index: 2;
  padding: 3.5rem 2rem 0 3rem;
}

.t1-hero-top + .t1-hero-content {
  padding-top: 0;
}

.t1-hero-pill {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem;
  padding: 0.35rem 0.8rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  color: var(--t1-ink, #16131f);
  background: #f4f4f6;
  border: 1px solid var(--t1-line, #ebeaf0);
}

.t1-hero-pill strong {
  color: var(--t1-ink, #16131f);
}

.t1-hero-stars {
  color: #f59e0b;
  letter-spacing: 0.05em;
}

.t1-hero-pill-sep {
  width: 1px;
  height: 0.85rem;
  background: #d6d5de;
}

.t1-hero-title {
  margin-top: 1rem;
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1.04;
  letter-spacing: -0.02em;
  color: var(--t1-ink, #16131f);
  max-width: 32rem;
}

.t1-hero-lead {
  margin-top: 1.1rem;
  max-width: 28rem;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--t1-ink, #16131f);
}

.t1-hero-search {
  margin-top: 2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  max-width: 31rem;
  padding: 0.35rem 0.35rem 0.35rem 1.1rem;
  border-radius: 9999px;
  background: #fff;
  border: 1.5px solid var(--t1-line, #e7e5ee);
  box-shadow: 0 10px 24px -16px rgba(22, 19, 31, 0.35);
}

.t1-hero-search-icon {
  color: var(--t1-ink, #16131f);
}

.t1-hero-search-input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  font-size: 0.875rem;
  color: #1f1b2d;
  padding: 0.45rem 0;
}

.t1-hero-search-input::placeholder {
  color: var(--t1-ink, #16131f);
  opacity: 1;
}

.t1-hero-search-input:focus {
  outline: none;
  box-shadow: none;
}

.t1-hero-search-btn {
  flex-shrink: 0;
  padding: 0.65rem 1.4rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #fff;
  background: var(--company-primary-base);
  transition: filter 0.15s;
}

.t1-hero-search-btn:hover {
  filter: brightness(1.1);
}

.t1-hero-chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 0.4rem;
  max-width: 31rem;
  margin-top: 1.25rem;
}

.t1-hero-chip {
  padding: 0.3rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--t1-ink, #16131f);
  background: #fff;
  border: 1px solid #dddce4;
  transition: border-color 0.15s, background 0.15s;
}

.t1-hero-chip:hover {
  color: var(--t1-ink, #16131f);
  background: #f6f6f8;
  border-color: #c8c7d2;
}

.t1-hero-photo {
  align-self: stretch;
  min-height: 34rem;
  height: 34rem;
  border-radius: 0;
  overflow: hidden;
  background: #ececf0;
}

.t1-hero-photo img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
}

.t1-hero-content {
  position: relative;
  z-index: 2;
}

.t1-hero-photo {
  position: relative;
  margin-left: 0;
}

.t1-hero-photo::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 -1px;
  z-index: 1;
  width: 22rem;
  pointer-events: none;
  background: linear-gradient(90deg,
      #fff 0%,
      #fff 35%,
      rgba(255, 255, 255, 0.85) 50%,
      rgba(255, 255, 255, 0.6) 65%,
      rgba(255, 255, 255, 0.35) 78%,
      rgba(255, 255, 255, 0.15) 90%,
      rgba(255, 255, 255, 0) 100%);
}

@media (min-width: 1024px) {
  .t1-hero {
    position: relative;
    min-height: 34rem;
    grid-template-columns: minmax(0, 4fr) minmax(0, 6fr);
    align-content: center;
  }

  .t1-hero-photo {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 90%;
    height: auto;
    min-height: 0;
  }
}

@media (max-width: 1023px) {
  .t1-hero {
    position: relative;
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
  }

  .t1-hero-content {
    padding: 2rem 1.5rem 1.5rem;
  }

  .t1-hero-top {
    padding: 2rem 1.5rem 0;
  }

  .t1-hero-title {
    font-size: 2.5rem;
  }

  .t1-hero-photo {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 70%;
    height: auto;
    min-height: 0;
    margin: 0;
  }

  .t1-hero-photo img {
    object-position: 20% top;
  }

  /* The fade made on the photo itself (a mask), not a white layer over it (ADR-0179). */
  .t1-hero-photo::before {
    content: none;
  }

  .t1-hero-photo {
    -webkit-mask-image: linear-gradient(90deg,
        transparent 0%,
        rgba(0, 0, 0, 0.25) 13.5%,
        rgba(0, 0, 0, 0.5) 31.5%,
        rgba(0, 0, 0, 0.7) 49.5%,
        rgba(0, 0, 0, 0.85) 67.5%,
        #000 90%);
    mask-image: linear-gradient(90deg,
        transparent 0%,
        rgba(0, 0, 0, 0.25) 13.5%,
        rgba(0, 0, 0, 0.5) 31.5%,
        rgba(0, 0, 0, 0.7) 49.5%,
        rgba(0, 0, 0, 0.85) 67.5%,
        #000 90%);
  }
}

@media (max-width: 640px) {
  .t1-hero-content {
    padding: 1.5rem 1.125rem 1.25rem;
  }

  .t1-hero-top {
    padding: 1.5rem 1.125rem 0;
  }

  .t1-hero-title {
    font-size: 2.125rem;
  }

  .t1-hero-lead {
    font-size: 0.9375rem;
  }
}
</style>
