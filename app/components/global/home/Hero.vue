<script lang="ts">
/**
 * The hero image paths of template-{2,3,4}/hero/layout-4.blade.php and global/home/layout-4-multi.blade.php:
 * `pre_define.v2_home.currentImage`, else `v2_hero_page` (a data: URL counts as none), with the legacy
 * `/imgs/hero-image/` paths moved to `/global_images/home_new/`. Returns null when there is no usable image.
 *
 *  - an absolute URL is used as-is for both sizes;
 *  - a site path (`/...` or `imgs/...`) is this site's: `-min.jpg` for mobile, the full `.webp` for desktop;
 *  - anything else is relative to MAIN_WEBSITE_URL (`mediaBase`): `.webp` for desktop, `-min.jpg` for mobile.
 */
export function resolveHeroImage(
  source: Record<string, any> | undefined,
  mediaBase: string,
): { bg: string; bgMin: string } | null {
  let raw: string | null = source?.pre_define?.v2_home?.currentImage ?? null
  if (!raw || raw.startsWith('data:')) raw = source?.v2_hero_page ?? null
  if (raw && raw.startsWith('/imgs/hero-image/')) {
    const suffix = raw.slice('/imgs/hero-image/'.length)
    raw = suffix.includes('/') ? `/global_images/home_new/hero-image/${suffix}` : `/global_images/home_new/${suffix}`
  }
  if (!raw || raw.startsWith('data:')) return null
  if (raw.startsWith('http://') || raw.startsWith('https://')) return { bg: raw, bgMin: raw }
  if (raw.startsWith('/') || raw.startsWith('imgs/')) {
    const bgMin = raw.startsWith('/') ? raw : `/${raw}`
    return { bg: bgMin.replaceAll('-min.jpg', '.webp'), bgMin }
  }
  return {
    bg: (mediaBase + raw).replaceAll('.png', '.webp'),
    bgMin: (mediaBase + raw).replaceAll('.png', '-min.jpg'),
  }
}
</script>

<script setup lang="ts">
/**
 * template-{2,3,4}/hero/layout-4.blade.php (the three files differ only in the default image): a full-bleed
 * background image, `calc(100vh - 12.5rem)` tall on desktop, and a short banner on mobile. The Blade's
 * `setTimeoutHero()` is never called and its <style> block styles classes this markup doesn't use, so neither is
 * ported.
 */
const { site, company, template } = useSite()

const images = computed(() => {
  const found = resolveHeroImage(company.value, site.value?.mediaBase ?? '/')
  if (found) return found
  // The Blade's default is MAIN_WEBSITE_URL's copy; the same files are in this site's public/.
  const t = template.value === 'template-1' ? 'template-2' : template.value
  return {
    bg: `/global_images/home_new/default ${t}.webp`,
    bgMin: `/global_images/home_new/default ${t}-min.jpg`,
  }
})

useHead(() => ({
  link: [
    { rel: 'preload', as: 'image', type: 'image/webp', href: images.value.bg, fetchpriority: 'high' },
    { rel: 'preload', as: 'image', type: 'image/webp', href: images.value.bgMin, fetchpriority: 'high' },
  ],
}))
</script>

<template>
  <!-- web view -->
  <section
    class="lg:block hidden w-full bg-center bg-cover bg-no-repeat relative"
    :style="{
      backgroundImage: `url('${images.bg}')`,
      height: 'calc(100vh - 12.5rem)',
      backgroundPosition: '50% top',
    }"
  />

  <!-- mobile view -->
  <section class="lg:hidden flex-1 flex flex-col text-center w-full">
    <div
      class="w-full bg-center bg-cover bg-no-repeat relative sm:h-80 h-64"
      :style="{ backgroundImage: `url('${images.bgMin}')`, backgroundPosition: '50% top' }"
    />
  </section>
</template>
