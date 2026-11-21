/**
 * The Nuxt helpers the components were written with, for a plain Vue 3 app (ADR-0002). Same names and the parts of
 * their behaviour the app uses, so the components didn't need rewriting:
 *  - `$fetch`: an `/api/site/...` URL runs the site's own route in the browser (site-api/dispatch.ts); any other URL
 *    goes to the network (ofetch).
 *  - `useFetch`: `$fetch` with reactive `data` / `status` / `error` / `refresh`, refetching when its URL or query
 *    changes; awaitable, as in a page's `<script setup>`.
 *  - `useState`: one app-wide ref per key.
 *  - `useRequestURL`, `navigateTo`, `definePageMeta` (route meta lives in router.ts), `useRequestEvent` (none here).
 */
import { ofetch, type FetchOptions } from 'ofetch'
import { getCurrentInstance, onBeforeUnmount, ref, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue'
import { dispatchSiteRoute, isSiteRoute } from '~/site-api/dispatch'
import { router } from '~/router'

type QueryInput = MaybeRefOrGetter<Record<string, any> | undefined>

interface SiteFetchOptions extends Omit<FetchOptions<'json'>, 'query'> {
  query?: Record<string, any>
}

/** Nuxt's $fetch: the site's own routes run here; other URLs go to the network. */
export async function $fetch<T = any>(url: string, options: SiteFetchOptions = {}): Promise<T> {
  if (isSiteRoute(url)) return dispatchSiteRoute<T>(url, options.query ?? {})
  return ofetch<T>(url, options as FetchOptions<'json'>)
}
$fetch.raw = (url: string, options: SiteFetchOptions = {}) => ofetch.raw(url, options as FetchOptions<'json'>)

export interface UseFetchOptions {
  key?: MaybeRefOrGetter<string>
  query?: QueryInput
}

export interface UseFetchReturn<T> {
  data: Ref<T | null>
  error: Ref<unknown>
  status: Ref<'idle' | 'pending' | 'success' | 'error'>
  pending: Ref<boolean>
  refresh: () => Promise<void>
}

/** Nuxt's useFetch: loads at once (awaitable), and again when the URL or the query changes. */
export async function useFetch<T = any>(url: MaybeRefOrGetter<string>, options: UseFetchOptions = {}): Promise<UseFetchReturn<T>> {
  const data = ref(null) as Ref<T | null>
  const error = ref<unknown>(null)
  const status = ref<'idle' | 'pending' | 'success' | 'error'>('idle')
  const pending = ref(false)
  let run = 0

  const refresh = async () => {
    const mine = ++run
    status.value = 'pending'
    pending.value = true
    try {
      const value = await $fetch<T>(toValue(url), { query: toValue(options.query) ?? {} })
      if (mine !== run) return
      data.value = value
      error.value = null
      status.value = 'success'
    } catch (e) {
      if (mine !== run) return
      error.value = e
      status.value = 'error'
    } finally {
      if (mine === run) pending.value = false
    }
  }

  // Registered before the first await, so it belongs to the calling component and stops with it.
  const stop = watch(
    () => [toValue(url), JSON.stringify(toValue(options.query) ?? {})],
    () => void refresh(),
  )
  if (getCurrentInstance()) onBeforeUnmount(stop)

  await refresh()
  return { data, error, status, pending, refresh }
}

const states = new Map<string, Ref<any>>()

/** Nuxt's useState: one ref per key for the whole app. */
export function useState<T>(key: string, init?: () => T): Ref<T> {
  if (!states.has(key)) states.set(key, ref(init ? init() : undefined))
  return states.get(key) as Ref<T>
}

/** Nuxt's useRequestURL: the page's URL. */
export function useRequestURL(): URL {
  return new URL(window.location.href)
}

/** Nuxt's navigateTo. */
export function navigateTo(to: string | { path: string; query?: Record<string, any> }) {
  return router.push(to as any)
}

/** Nuxt's definePageMeta: the routes' meta is in router.ts; kept so the pages read as before. */
export function definePageMeta(_meta: Record<string, unknown>): void {}

/** Nuxt's useRequestEvent: there is no server request in the browser. */
export function useRequestEvent(): null {
  return null
}
