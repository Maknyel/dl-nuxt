<script setup lang="ts">
/**
 * Vehicle Not Found (Laravel global/show/vehicle-not-found.blade.php), with a 10-second countdown to the inventory.
 *
 * The Laravel controller returns this view on its own (no layout, so no nav, footer, Tailwind, fonts or Ionicons, and
 * no dealer colour: --company-primary-base is unset, so every `var(--company-primary-base, #6366f1)` is the indigo
 * fallback). The page (pages/view/[id].vue) renders it without the layout; this component reproduces the rest:
 * the browser's default font, line height, margins and content-box sizing (it has no doctype or CSS reset), the
 * body's 8px margin, and empty icon slots.
 */
const count = ref(10)
let timer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  timer = setInterval(() => {
    count.value--
    if (count.value <= 0) {
      clearInterval(timer)
      window.location.replace('/pre-owned-cars')
    }
  }, 1000)
})
onBeforeUnmount(() => clearInterval(timer))

// The bare Laravel page: the browser's 8px body margin, no forced scrollbar.
useHead({ bodyAttrs: { style: 'margin: 8px; overflow-y: auto; background: #fff;' } })
</script>

<template>
  <div class="erp-root">
    <div class="erp-page">
      <div class="erp-dots" />
      <div class="erp-blob erp-blob-1" />
      <div class="erp-blob erp-blob-2" />
      <div class="erp-ghost">404</div>

      <div class="erp-content">
        <div class="erp-icon-ring">
          <!-- The Ionicon here never loads on the Laravel page (no Ionicons script there): an empty slot. -->
          <div class="erp-icon-inner"><span class="erp-icon-slot" /></div>
        </div>

        <div class="erp-badge">Error 404</div>

        <h1 class="erp-title">Vehicle Not Found</h1>

        <p class="erp-desc">
          This vehicle may have already been sold or is<br />
          no longer in our inventory.
        </p>

        <a href="/pre-owned-cars" class="erp-btn"><span class="erp-icon-slot" /> Browse Inventory </a>

        <div class="erp-countdown">
          <p class="erp-countdown-text">
            Redirecting to inventory in <strong id="erp-vnf-count">{{ count }}</strong> seconds
          </p>
          <div class="erp-bar-track">
            <div class="erp-bar-fill" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* What the bare Laravel page has instead of the site's CSS: the browser defaults. */
.erp-root {
  --company-primary-base: initial;
  font-family: initial;
  line-height: normal;
  color: #000;
}
:where(.erp-root) p {
  margin: 1em 0;
}
/* No Tailwind preflight there: content-box sizing (min-height 70vh plus its 5rem padding). */
:where(.erp-root),
:where(.erp-root) *,
:where(.erp-root) ::before,
:where(.erp-root) ::after {
  box-sizing: content-box;
}
.erp-icon-slot {
  display: inline;
}

/* The Blade's own block, unchanged. */
.erp-page {
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #f8faff 0%, #f1f5ff 50%, #faf8ff 100%);
  padding: 5rem 1rem;
}
.erp-dots {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, color-mix(in srgb, var(--company-primary-base, #6366f1) 18%, transparent) 1px, transparent 1px);
  background-size: 26px 26px;
  pointer-events: none;
  -webkit-mask-image: radial-gradient(ellipse at center, transparent 35%, black 100%);
  mask-image: radial-gradient(ellipse at center, transparent 35%, black 100%);
}
.erp-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(72px);
  pointer-events: none;
}
.erp-blob-1 {
  width: 420px;
  height: 420px;
  background: var(--company-primary-base, #6366f1);
  opacity: 0.12;
  top: -140px;
  right: -100px;
}
.erp-blob-2 {
  width: 280px;
  height: 280px;
  background: var(--company-primary-base, #6366f1);
  opacity: 0.07;
  bottom: -80px;
  left: -60px;
}
.erp-ghost {
  position: absolute;
  font-size: min(38vw, 280px);
  font-weight: 900;
  letter-spacing: -0.04em;
  color: color-mix(in srgb, var(--company-primary-base, #6366f1) 7%, transparent);
  line-height: 1;
  user-select: none;
  white-space: nowrap;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}
.erp-content {
  position: relative;
  z-index: 2;
  text-align: center;
  max-width: 500px;
  width: 100%;
}
.erp-icon-ring {
  position: relative;
  width: 100px;
  height: 100px;
  margin: 0 auto 1.75rem;
}
.erp-icon-ring::before,
.erp-icon-ring::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  border: 2px solid color-mix(in srgb, var(--company-primary-base, #6366f1) 30%, transparent);
  animation: erp-pulse 2.2s ease-in-out infinite;
}
.erp-icon-ring::before {
  inset: -10px;
}
.erp-icon-ring::after {
  inset: -20px;
  opacity: 0.5;
  animation-delay: 0.45s;
}
@keyframes erp-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.08);
    opacity: 0.35;
  }
}
.erp-icon-inner {
  width: 100px;
  height: 100px;
  background: color-mix(in srgb, var(--company-primary-base, #6366f1) 10%, white);
  border: 1.5px solid color-mix(in srgb, var(--company-primary-base, #6366f1) 25%, transparent);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.erp-badge {
  display: inline-block;
  background: color-mix(in srgb, var(--company-primary-base, #6366f1) 10%, transparent);
  color: var(--company-primary-base, #6366f1);
  border: 1px solid color-mix(in srgb, var(--company-primary-base, #6366f1) 22%, transparent);
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 0.3rem 1rem;
  margin-bottom: 1rem;
  font-family: Poppins, sans-serif;
}
.erp-title {
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  font-weight: 800;
  color: #0f172a;
  line-height: 1.15;
  margin: 0 0 0.75rem;
  letter-spacing: -0.02em;
  font-family: Poppins, sans-serif;
}
.erp-desc {
  font-size: 0.925rem;
  color: #64748b;
  line-height: 1.75;
  margin-bottom: 2rem;
  font-family: Poppins, sans-serif;
}
.erp-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: var(--company-primary-base, #6366f1);
  color: #fff;
  border-radius: 999px;
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.7rem 1.75rem;
  text-decoration: none;
  font-family: Poppins, sans-serif;
  transition:
    opacity 0.2s,
    transform 0.15s;
  margin-bottom: 1.75rem;
  box-shadow: 0 4px 16px color-mix(in srgb, var(--company-primary-base, #6366f1) 35%, transparent);
}
.erp-btn:hover {
  opacity: 0.88;
  transform: translateY(-2px);
  color: #fff;
}
.erp-countdown {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
}
.erp-countdown-text {
  font-size: 0.76rem;
  color: #94a3b8;
  font-family: Poppins, sans-serif;
}
.erp-countdown-text strong {
  color: var(--company-primary-base, #6366f1);
  font-weight: 700;
}
.erp-bar-track {
  width: 140px;
  height: 3px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
}
.erp-bar-fill {
  height: 100%;
  width: 100%;
  background: var(--company-primary-base, #6366f1);
  border-radius: 999px;
  transform-origin: left;
  animation: erp-bar-shrink 10s linear forwards;
}
@keyframes erp-bar-shrink {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}
</style>
