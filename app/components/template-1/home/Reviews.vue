<script setup lang="ts">
/**
 * template-1/review/layout-4.blade.php, "What Our Customers Are Saying": the rating summary with the star
 * distribution and Leave a Review at the left; the review cards in a horizontal scroll-snap track at the right, with
 * previous / next arrows. (Its dots and the global review include are commented out in the Blade.)
 * Font Awesome's stars (fa-star / fa-star-o) are FaStar.vue, the same glyphs as inline SVG.
 */
import type { T1Review } from './types'
import T1Icon from './Icon.vue'
import FaStar from './FaStar.vue'

const props = defineProps<{ reviews: T1Review[] }>()

const STAR_COLORS = ['#4f46e5', '#0891b2', '#7c3aed', '#059669', '#dc2626', '#d97706']

const total = computed(() => props.reviews.length)
const avg = computed(() => {
  if (!total.value) return 0
  const mean = props.reviews.reduce((n, r) => n + Number(r.rating ?? 0), 0) / total.value
  return Math.round(mean * 10) / 10
})
const starCounts = computed(() => {
  const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  for (const r of props.reviews) {
    const key = Math.round(Number(r.rating ?? 0))
    if (key in counts) counts[key]!++
  }
  return counts
})
const pct = (star: number) => (total.value > 0 ? Math.round(((starCounts.value[star] ?? 0) / total.value) * 100) : 0)

/** cut_string(): at most 150 characters, cut back to the last space, plus "...". */
function cutString(value: string | undefined, max: number): string {
  const s = String(value ?? '')
  if (s.length <= max) return s
  const cut = s.slice(0, max)
  const pos = cut.lastIndexOf(' ')
  return (pos === -1 ? cut : cut.slice(0, pos)) + '...'
}

/** Carbon's diffForHumans(): "3 days ago". */
function diffForHumans(date: string): string {
  const then = new Date(date.replace(' ', 'T')).getTime()
  if (Number.isNaN(then)) return ''
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000))
  const units: [string, number][] = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
    ['second', 1],
  ]
  for (const [name, size] of units) {
    const n = Math.floor(secs / size)
    if (n >= 1) return `${n} ${name}${n === 1 ? '' : 's'} ago`
  }
  return '1 second ago'
}

const cards = computed(() =>
  props.reviews.map((r, index) => ({
    rating: Number(r.rating ?? 0),
    ratingText: r.rating,
    initial: String(r.firstname ?? '?').charAt(0).toUpperCase(),
    fullName: `${r.firstname ?? ''} ${r.lastname ?? ''}`.trim(),
    avatarBg: STAR_COLORS[index % STAR_COLORS.length],
    when: r.created_at ? diffForHumans(String(r.created_at)) : '',
    text: cutString(r.description, 150),
  })),
)

const track = ref<HTMLDivElement | null>(null)
/** The previous / next arrows: one card's width (and its gap) at a time. */
function scrollByCard(dir: number) {
  const el = track.value
  if (!el) return
  const card = el.querySelector('.review-card')
  const step = card ? card.getBoundingClientRect().width + 16 : el.clientWidth
  el.scrollBy({ left: dir * step, behavior: 'smooth' })
}
</script>

<template>
  <section class="container t1-sec py-5">
    <div class="review-section t1-panel mx-auto p-6 lg:p-7">
      <div class="flex items-center justify-between gap-4">
        <h2 class="review-heading">What Our Customers Are Saying</h2>
        <div v-if="reviews.length > 0" class="flex items-center gap-2 shrink-0">
          <button type="button" class="review-nav" aria-label="Previous reviews" @click="scrollByCard(-1)">
            <T1Icon name="arrow-right" class="t1-ico-sm review-nav-prev" :stroke="2.5" />
          </button>
          <button type="button" class="review-nav review-nav--next" aria-label="Next reviews" @click="scrollByCard(1)">
            <T1Icon name="arrow-right" class="t1-ico-sm" :stroke="2.5" />
          </button>
        </div>
      </div>
      <div class="flex xl:flex-row flex-col gap-10 pt-5">
        <!-- Left: summary -->
        <div class="xl:w-80 shrink-0 flex flex-col gap-5">
          <div class="flex items-end gap-3">
            <div>
              <div class="flex flex-row items-center gap-4">
                <span class="review-score">{{ avg }}</span>
                <div class="flex gap-1">
                  <FaStar
                    v-for="i in 5"
                    :key="i"
                    :class="i <= Math.round(avg) ? 'review-star-color' : 'review-star-color-empty'"
                  />
                </div>
              </div>
              <div class="text-gray-400 text-xs">Based on {{ total.toLocaleString('en-US') }} reviews</div>
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <div v-for="star in [5, 4, 3, 2, 1]" :key="star" class="flex items-center gap-2 text-xs">
              <span class="text-gray-400 w-12 shrink-0">{{ star }} {{ star === 1 ? 'Star' : 'Stars' }}</span>
              <div class="flex-1 review-bar-bg rounded-full h-1.5">
                <div class="review-bar-fill h-1.5 rounded-full" :style="{ width: `${pct(star)}%` }"></div>
              </div>
              <span class="text-gray-400 w-10 text-right">{{ (starCounts[star] ?? 0).toLocaleString('en-US') }}</span>
            </div>
          </div>

          <NuxtLink to="/reviews" class="t1-btn t1-btn--white review-leave w-fit mt-2">
            Leave a Review
            <T1Icon name="arrow-right" class="t1-ico-sm" :stroke="2.5" />
          </NuxtLink>
        </div>

        <!-- Right: cards -->
        <div class="flex-1 relative min-w-0">
          <div
            id="reviewTrack"
            ref="track"
            class="review-cards-track flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scroll-smooth"
          >
            <div v-for="(card, index) in cards" :key="index" class="review-card snap-start shrink-0 rounded-2xl p-5 flex flex-col gap-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-semibold review-star-color">{{ card.ratingText }}</span>
                  <div class="h-4 w-0.5 review-star-divider"></div>
                  <div class="flex items-center gap-1">
                    <div class="flex gap-0.5">
                      <FaStar v-for="i in 5" :key="i" :outline="i > card.rating" class="review-star-color" />
                    </div>
                  </div>
                </div>
                <span v-if="card.when" class="text-gray-500 text-xs">{{ card.when }}</span>
              </div>

              <p class="review-text text-sm leading-relaxed flex-1">{{ card.text }}</p>

              <div class="flex items-center gap-3">
                <div
                  class="review-avatar w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                  :style="{ backgroundColor: card.avatarBg }"
                >
                  {{ card.initial }}
                </div>
                <div>
                  <div class="review-name text-sm font-semibold">{{ card.fullName }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.review-section {
  background: #fff !important;
}

.review-heading {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.25;
  color: var(--t1-ink, #16131f);
}

.review-score {
  font-family: 'Outfit', 'Inter', sans-serif;
  font-size: 2.75rem;
  font-weight: 800;
  line-height: 1;
  color: var(--t1-ink, #16131f);
}

.review-card {
  flex: 0 0 calc((100% - 2rem) / 3);
  background: color-mix(in srgb, var(--company-primary-base) 2%, #f7f7f9);
  border: 1px solid var(--t1-line, #e9e8ee);
  transition: border-color 0.2s;
}

@media (max-width: 1023px) {
  .review-card {
    flex-basis: calc((100% - 1rem) / 2);
  }
}

@media (max-width: 640px) {
  .review-card {
    flex-basis: 85%;
  }
}

.review-card:hover {
  border-color: color-mix(in srgb, var(--company-primary-base) 30%, #ffffff);
}

.review-text {
  color: #4b4858;
}

.review-name {
  color: var(--t1-ink, #16131f);
}

.review-avatar {
  box-shadow: 0 0 0 3px #fff;
}

.review-leave {
  border: 1px solid var(--t1-line, #e9e8ee);
  box-shadow: 0 6px 16px -10px rgba(22, 19, 31, 0.35);
}

.review-cards-track {
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--company-primary-base) 25%, #d9d8e0) transparent;
}

.review-cards-track::-webkit-scrollbar {
  height: 4px;
}

.review-cards-track::-webkit-scrollbar-thumb {
  border-radius: 9999px;
  background: color-mix(in srgb, var(--company-primary-base) 25%, #d9d8e0);
}

.review-nav {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--t1-ink, #16131f);
  background: color-mix(in srgb, var(--company-primary-base) 5%, #f1f1f4);
  border: 1px solid var(--t1-line, #e9e8ee);
  transition: filter 0.15s, transform 0.15s;
}

.review-nav:hover {
  filter: brightness(0.96);
}

.review-nav--next {
  color: #fff;
  background: var(--company-primary-base);
  border-color: transparent;
}

.review-nav--next:hover {
  filter: brightness(1.1);
}

.review-nav-prev {
  transform: rotate(180deg);
}

.review-star-color {
  color: #f59e0b;
}

.review-star-divider {
  background: #f59e0b;
}

.review-star-color-empty {
  color: rgba(245, 158, 11, 0.3);
}

.review-bar-bg {
  background: color-mix(in srgb, var(--company-primary-base) 8%, #ececf1);
}

.review-bar-fill {
  background: linear-gradient(90deg, var(--company-primary-base), color-mix(in srgb, var(--company-primary-base) 65%, #ffffff));
}
</style>
