<script setup lang="ts">
/** template-1/trust-bar/layout-4.blade.php: a white card, four trust points, each with its icon in a soft tile. */
import T1Icon from './Icon.vue'

const items = [
  { icon: 'shield-check', title: 'Quality You Can Trust', text: 'Every vehicle is inspected and road-tested.' },
  { icon: 'dollar', title: 'Financing Made Simple', text: 'Competitive rates and quick approvals.' },
  { icon: 'refresh', title: 'Top Dollar for Trades', text: 'Get an instant offer on your vehicle.' },
  { icon: 'users', title: 'Real People. Real Help.', text: "We're here before, during, and after the sale." },
]
</script>

<template>
  <div class="container t1-sec mt-4 px-10">
    <div class="trust-bar t1-panel mx-auto">
      <div class="xl:flex grid md:grid-cols-2 grid-cols-1 justify-between gap-6 py-6 px-6">
        <div v-for="item in items" :key="item.title" class="flex items-center gap-3 min-w-0">
          <div class="t1-tile t1-tile--soft">
            <T1Icon :name="item.icon" class="t1-ico" />
          </div>
          <div class="min-w-0">
            <div class="trust-title">{{ item.title }}</div>
            <div class="trust-text">{{ item.text }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.trust-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--t1-ink, #16131f);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.trust-text {
  margin-top: 0.125rem;
  font-size: 0.75rem;
  color: var(--t1-muted, #6b6880);
}

@media (min-width: 1280px) {
  .trust-text {
    white-space: nowrap;
  }
}
</style>
