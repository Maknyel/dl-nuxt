<script setup lang="ts">
/**
 * The page body while a page's data loads (App.vue's <Suspense> fallback): a hero block and a row of cards, shimmering,
 * between the nav and the footer. index.html has the same shapes (plus a nav bar) for the wait before the app mounts.
 */
</script>

<template>
  <div class="page-skeleton" role="status" aria-live="polite" aria-label="Loading">
    <div class="sk-wrap">
      <div class="sk sk-hero" />
      <div class="sk sk-title" />
      <div class="sk-grid">
        <div v-for="i in 3" :key="i" class="sk-card">
          <div class="sk sk-card-img" />
          <div class="sk sk-line" />
          <div class="sk sk-line sk-line--short" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-skeleton {
  min-height: 70vh;
  padding: 1.5rem 0 3rem;
}

.sk-wrap {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
}

.sk {
  border-radius: 1rem;
  background: linear-gradient(90deg, #ececf1 0%, #f6f6f9 40%, #ececf1 80%);
  background-size: 200% 100%;
  animation: sk-shimmer 1.3s ease-in-out infinite;
}

.sk-hero {
  height: clamp(260px, 45vw, 460px);
}

.sk-title {
  width: min(320px, 60%);
  height: 1.75rem;
  margin: 2.5rem auto 1.5rem;
  border-radius: 0.5rem;
}

.sk-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.25rem;
}

.sk-card {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.sk-card-img {
  height: 200px;
}

.sk-line {
  height: 0.9rem;
  border-radius: 0.4rem;
}

.sk-line--short {
  width: 55%;
}

@media (max-width: 767px) {
  .sk-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .sk-card:nth-child(n + 2) {
    display: none;
  }
}

@keyframes sk-shimmer {
  from { background-position: 100% 0; }
  to { background-position: -100% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .sk { animation: none; }
}
</style>
