<script setup lang="ts">
// An address the site doesn't have.
useHead({ title: 'Page Not Found' })
</script>

<template>
  <main class="container py-24 text-center">
    <h1 class="font-display text-4xl font-extrabold text-gray-900">Page not found</h1>
    <p class="mt-3 text-gray-600">The page you're looking for doesn't exist.</p>
    <NuxtLink to="/" class="btn-pill btn-pill-solid mt-8">Back to the home page</NuxtLink>
  </main>
</template>
