<script setup lang="ts">
/**
 * Template 1's home page body, between the nav and the footer (wip-template-builder/index.blade.php for template 1):
 * the theme (template-1/theme/layout-4: the fonts, the page colour and the shared pieces, the global <style> below),
 * the hero (or the multi-location hero for a Multi dealer), the search widget, the trust bar, the budget slider,
 * then Popular Categories (show_view_inventory), Financing / Sell (show_credit) and the reviews (show_review).
 *
 * The index's `img.lazy` loader isn't needed: no template-1 home section uses `img.lazy`.
 */
import type { T1Home } from './types'
import MultiHero from '~/components/global/home/MultiHero.vue'
import Hero from './Hero.vue'
import Search from './Search.vue'
import TrustBar from './TrustBar.vue'
import Budget from './Budget.vue'
import Categories from './Categories.vue'
import Finance from './Finance.vue'
import Reviews from './Reviews.vue'

const props = defineProps<{ home: T1Home | null | undefined }>()

const { isMulti, templateNav } = useSite()
const on = (flag: string) => String(templateNav.value?.[flag] ?? '') === '1'

const data = computed(() => props.home?.data ?? {})
const reviews = computed(() => props.home?.reviews ?? [])

// The theme's page colour, fonts and variables apply to the whole page (nav and footer too) while the home shows.
useHead({ bodyAttrs: { class: 't1-home' } })
</script>

<template>
  <MultiHero v-if="isMulti" :home="home" />
  <Hero v-else :reviews="reviews" />
  <Search :data="data" />
  <TrustBar />
  <Budget :data="data" />
  <Categories v-if="on('show_view_inventory')" :data="data" />
  <Finance v-if="on('show_credit')" />
  <Reviews v-if="on('show_review')" :reviews="reviews" />
</template>

<style>
/*
 * template-1/theme/layout-4.blade.php, on the home only: under `body.t1-home` (set above), through :where() so every
 * selector keeps the Blade's specificity.
 *
 * --t1-primary: the Blade sets it on :root as var(--company-primary-base, #6d28d9), but the dealer's colour is set on
 * <body>, so on the Laravel site it always resolves to the fallback #6d28d9. Kept, so the page matches.
 */
:where(body.t1-home) {
  --t1-primary: #6d28d9;
  --t1-primary-light: color-mix(in srgb, var(--t1-primary) 62%, #ffffff);
  --t1-primary-soft: color-mix(in srgb, var(--t1-primary) 78%, #ffffff);
  --t1-page: color-mix(in srgb, var(--t1-primary) 3%, #f6f6f8);
  --t1-line: color-mix(in srgb, var(--t1-primary) 12%, #e9e8ee);
  --t1-deep: color-mix(in srgb, var(--t1-primary) 70%, #0b0817);
  --t1-deep-2: color-mix(in srgb, var(--t1-primary) 45%, #0b0817);
  --t1-soft-bg: color-mix(in srgb, var(--t1-primary) 8%, #ffffff);
  --t1-dark: color-mix(in srgb, var(--t1-primary) 24%, #0e0a1f);
  --t1-dark-2: color-mix(in srgb, var(--t1-primary) 14%, #0b0817);
  --t1-ink: #16131f;
  --t1-muted: #6b6880;
  --t1-btn-radius: 0.5rem;
  --t1-glow: color-mix(in srgb, var(--t1-primary) 45%, transparent);
  --t1-card-shadow: 0 12px 30px -20px rgba(22, 19, 31, 0.28), 0 1px 2px rgba(22, 19, 31, 0.05);
}

/*
 * The Laravel site's `container` (resources/css/frontend-tw.css: `2xl:px-0 md:px-16 px-3`, capped at 80rem from
 * 1280px), which also beats the sections' own px-10 there. main.css's shared `container` has other steps (576-1200
 * caps, 1-3rem padding), so the home sections (.t1-sec) set the Laravel ones until that shared utility matches.
 */
.t1-sec.container {
  max-width: none;
  padding-left: 0.75rem;
  padding-right: 0.75rem;
}

@media (min-width: 768px) {
  .t1-sec.container {
    padding-left: 4rem;
    padding-right: 4rem;
  }
}

@media (min-width: 1280px) {
  .t1-sec.container {
    max-width: 80rem;
  }
}

@media (min-width: 1350px) {
  .t1-sec.container {
    padding-left: 0;
    padding-right: 0;
  }
}

body.t1-home {
  background: var(--t1-page) !important;
  font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
}

:where(body.t1-home) .t1-btn.t1-btn--deep {
  color: #fff;
  background: #141626;
  box-shadow: 0 10px 22px -12px rgba(20, 22, 38, 0.8);
}

:where(body.t1-home) .t1-btn.t1-btn--deep:hover {
  color: #fff;
  filter: brightness(1.15);
}

:where(body.t1-home) .t1-tile.t1-tile--soft {
  color: var(--t1-primary);
  background: var(--t1-soft-bg);
  border: 1px solid color-mix(in srgb, var(--t1-primary) 14%, #ffffff);
  box-shadow: none;
}

:where(body.t1-home) .t1-arrow.t1-arrow--deep {
  color: #fff;
  background: var(--t1-deep);
  box-shadow: none;
}

:where(body.t1-home) .t1-panel {
  background: #fff;
  border-radius: 1rem;
  border: 1px solid var(--t1-line);
  box-shadow: var(--t1-card-shadow);
}

:where(body.t1-home) .t1-display,
:where(body.t1-home) h1,
:where(body.t1-home) h2 {
  font-family: 'Outfit', 'Inter', ui-sans-serif, system-ui, sans-serif;
  letter-spacing: -0.01em;
}

:where(body.t1-home) .t1-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: var(--t1-btn-radius);
  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1.25rem;
  white-space: nowrap;
  color: #fff;
  background: linear-gradient(90deg, var(--t1-primary-soft) 0%, var(--t1-primary) 100%);
  box-shadow: 0 10px 24px -8px var(--t1-glow), inset 0 1px 0 rgba(255, 255, 255, 0.18);
  transition: transform 0.15s, filter 0.15s, box-shadow 0.15s;
}

:where(body.t1-home) .t1-btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.06);
  color: #fff;
}

:where(body.t1-home) .t1-btn--white {
  color: var(--t1-primary);
  background: #fff;
  box-shadow: 0 10px 24px -10px rgba(0, 0, 0, 0.45), 0 0 0 3px rgba(255, 255, 255, 0.14);
}

:where(body.t1-home) .t1-btn--white:hover {
  color: var(--t1-primary);
}

:where(body.t1-home) .t1-btn--outline {
  padding: 0.5rem 1.1rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  color: var(--t1-primary);
  background: #fff;
  border: 1.5px solid var(--t1-primary);
  box-shadow: none;
}

:where(body.t1-home) .t1-btn--outline:hover {
  color: var(--t1-primary);
  background: color-mix(in srgb, var(--t1-primary) 6%, #fff);
}

:where(body.t1-home) .t1-ico {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

:where(body.t1-home) .t1-ico-sm {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

:where(body.t1-home) .t1-ico-lg {
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
}

:where(body.t1-home) .t1-tile {
  width: 3rem;
  height: 3rem;
  border-radius: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
  background: linear-gradient(135deg, var(--t1-primary-soft) 0%, var(--t1-primary) 100%);
  box-shadow: 0 10px 22px -8px var(--t1-glow), inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

:where(body.t1-home) .t1-tile--glass {
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

:where(body.t1-home) .t1-arrow {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #fff;
  color: var(--t1-primary);
  box-shadow: 0 6px 14px -4px rgba(0, 0, 0, 0.35);
  transition: transform 0.15s;
}

:where(body.t1-home) a:hover .t1-arrow {
  transform: translateX(2px);
}

:where(body.t1-home) .t1-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 600;
  color: #fff;
  background: rgba(255, 255, 255, 0.16);
}

:where(body.t1-home) .t1-card {
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 12px 32px -18px color-mix(in srgb, var(--t1-primary) 40%, transparent), 0 1px 2px rgba(16, 12, 40, 0.04);
}

:where(body.t1-home) .t1-dark-card {
  border-radius: 1rem;
  background: linear-gradient(180deg, var(--t1-dark) 0%, var(--t1-dark-2) 100%);
  box-shadow: 0 18px 40px -20px rgba(14, 10, 31, 0.7);
}
</style>
