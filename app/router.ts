/**
 * The site's pages, at the Laravel sites' addresses (the Nuxt project's file routes, ADR-0002). An unknown address shows
 * the Not Found page inside the site's frame.
 */
import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: () => import('~/pages/index.vue'), meta: { alwaysShell: true } },
    { path: '/pre-owned-cars', component: () => import('~/pages/pre-owned-cars.vue') },
    // The vehicle page draws its own frame (the vehicle in the site's frame, Vehicle Not Found on its own).
    { path: '/view/:id', component: () => import('~/pages/view/[id].vue'), meta: { layout: false } },
    { path: '/sell', component: () => import('~/pages/sell.vue') },
    { path: '/finance', component: () => import('~/pages/finance.vue') },
    { path: '/services', component: () => import('~/pages/services.vue') },
    { path: '/aboutus', component: () => import('~/pages/aboutus.vue') },
    { path: '/contactus', component: () => import('~/pages/contactus.vue') },
    { path: '/privacy_policy', component: () => import('~/pages/privacy_policy.vue') },
    { path: '/termsof_service', component: () => import('~/pages/termsof_service.vue') },
    { path: '/:pathMatch(.*)*', component: () => import('~/pages/not-found.vue') },
  ],
  // A new page opens at the top; back / forward return to where the visitor was.
  scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
})
