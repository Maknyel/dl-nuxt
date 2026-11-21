import type { InjectionKey, Ref } from 'vue'

/**
 * The inventory page's search (the Laravel `vehicleSearch` Alpine component + the sidebar form `#submitFilter` and
 * its vanilla helpers: postThisForm, rngSubmit_*, priceRangeLive.submit, sfRestorePriceSelection).
 *
 * The Laravel page reads its filters off the sidebar's native form (FormData) and swaps server-rendered HTML in. Here
 * the form is the reactive `form` below, rebuilt from the URL after every load (as the sidebar was re-rendered after
 * every swap), and every search is a route change: the URL keeps the Laravel query string (make[]=, body_type[]=,
 * page, sort_by, search, qbt[], ...), the page refetches /api/site/inventory, and back / forward work.
 */

export interface FacetRow {
  count?: number | string
  [key: string]: any
}

export interface InventoryResponse {
  vehicles: Record<string, any>[]
  paging: { current_page: number; last_page: number; per_page: number; total: number }
  inventory_data_count: number
  inventory_all_data_count: number
  get: Record<string, any>
  filters: {
    getavailabletransmission: FacetRow[]
    getavailableyear: FacetRow[]
    getavailablemake: FacetRow[]
    getavailablemodel: FacetRow[]
    getavailabletrim: FacetRow[]
    vehiclebodytype: FacetRow[]
    getavailabledrivetrain: FacetRow[]
    getavailableexterior: FacetRow[]
    getavailableinterior: FacetRow[]
    getavailableinternetprice: FacetRow[]
    getavailablemileage: FacetRow[]
    getavailablecompanies: FacetRow[]
  }
  under_20k_count: number
  unfiltered_body_type_counts: FacetRow[]
}

export type Pairs = [string, string][]

type RangeId = 'internet_price' | 'year' | 'mileage'

/** The multi-select filters: the checkbox's id (postThisForm's id), its param, its facet and the facet's value key. */
export const MULTI_FIELDS = {
  body_type: { param: 'body_type', facet: 'vehiclebodytype', key: 'body_type' },
  make: { param: 'make', facet: 'getavailablemake', key: 'make' },
  model: { param: 'model', facet: 'getavailablemodel', key: 'model' },
  trim: { param: 'trim', facet: 'getavailabletrim', key: 'trim' },
  drivetrain: { param: 'drivetrain', facet: 'getavailabledrivetrain', key: 'drivetrain' },
  exterior: { param: 'exterior_color', facet: 'getavailableexterior', key: 'exterior' },
  interior: { param: 'interior_color', facet: 'getavailableinterior', key: 'interior' },
  transmission: { param: 'transmission', facet: 'getavailabletransmission', key: 'transmission' },
} as const

export type MultiId = keyof typeof MULTI_FIELDS

/** A range filter's bounds and starting values, as the Blade components compute them. */
export function rangeBounds(
  choices: FacetRow[],
  key: string,
  from: string,
  to: string,
  opts: { extraMax?: number; step?: number } = {},
) {
  const lo = Math.trunc(Number(choices[choices.length - 1]?.[key] ?? 0)) || 0
  const hi = (Math.trunc(Number(choices[0]?.[key] ?? 0)) || 0) + (opts.extraMax ?? 0)
  let vLo = from !== '' ? Math.trunc(Number(from)) || 0 : lo
  let vHi = to !== '' ? Math.trunc(Number(to)) || 0 : hi - (opts.extraMax ?? 0)
  // A native range input snaps its value to min + n*step within [min, max]; the year / mileage scripts read it back.
  if (opts.step) {
    const snap = (v: number) => {
      if (hi < lo) return lo
      const n = Math.round((v - lo) / opts.step!)
      return Math.min(Math.max(lo + n * opts.step!, lo), lo + Math.floor((hi - lo) / opts.step!) * opts.step!)
    }
    vLo = snap(vLo)
    vHi = snap(vHi)
  }
  return { lo, hi, vLo, vHi }
}

/** The 24-bucket histogram the range components print. */
export function histogram(choices: FacetRow[], key: string, lo: number, hi: number) {
  const bucketCount = 24
  const span = hi - lo || 1
  const bktSize = span / bucketCount
  const buckets = new Array(bucketCount).fill(0) as number[]
  for (const item of choices) {
    const v = Math.trunc(Number(item[key] ?? 0)) || 0
    const idx = Math.max(0, Math.min(Math.floor((v - lo) / bktSize), bucketCount - 1))
    buckets[idx]! += Math.trunc(Number(item.count ?? 0)) || 0
  }
  const peak = Math.max(...buckets) || 1
  return { bktSize, bars: buckets.map((cnt) => (cnt > 0 ? Math.max(Math.round((cnt / peak) * 100), 8) : 2)) }
}

const DESKTOP = 992

export function createInventorySearch(data: Ref<InventoryResponse | null | undefined>, refresh: () => Promise<void>) {
  const route = useRoute()
  const router = useRouter()

  /** `request('x')` (a single value; '' when absent). */
  const q = (key: string): string => {
    const v = route.query[key]
    const last = Array.isArray(v) ? v[v.length - 1] : v
    return last === null || last === undefined ? '' : String(last)
  }
  /** `(array) request('x')`: `x[]=a&x[]=b`, or a lone `x=a`. Empty values dropped (array_filter). */
  const qa = (key: string): string[] => {
    const out: string[] = []
    const indexed = Object.keys(route.query).filter((k) => k.startsWith(`${key}[`) && /^\[\d+\]$/.test(k.slice(key.length)))
    for (const k of [`${key}[]`, ...indexed, key]) {
      const v = route.query[k]
      for (const item of Array.isArray(v) ? v : v === undefined ? [] : [v]) {
        if (item !== null && item !== undefined && String(item) !== '') out.push(String(item))
      }
    }
    return out
  }

  const filters = computed(() => data.value?.filters)
  const facet = (name: keyof InventoryResponse['filters']): FacetRow[] => filters.value?.[name] ?? []

  // ── The sidebar form ────────────────────────────────────────────────────────────────────────────────
  function freshForm() {
    const active = (k: string) => (q(k) === 'true' ? 'true' : '')
    const price = rangeBounds(facet('getavailableinternetprice'), 'internet_price', q('internet_price_from'), q('internet_price_to'))
    const year = rangeBounds(facet('getavailableyear'), 'year', q('year_from'), q('year_to'), { step: 1 })
    const miles = rangeBounds(facet('getavailablemileage'), 'mileage', q('mileage_from'), q('mileage_to'), {
      extraMax: 10000,
      step: 1000,
    })
    const multi = {} as Record<MultiId, string[]>
    for (const id of Object.keys(MULTI_FIELDS) as MultiId[]) multi[id] = qa(MULTI_FIELDS[id].param)
    return {
      list: q('list'),
      grid: q('grid'),
      search: q('search'),
      per_page: q('per_page'),
      sort_by: q('sort_by'),
      max_price: q('max_price'),
      qbt: qa('qbt'),
      last_updated_value: '',
      is_make_active: active('is_make_active'),
      is_model_active: active('is_model_active'),
      is_trim_active: active('is_trim_active'),
      is_year_active: active('is_year_active'),
      is_internet_price_active: active('is_internet_price_active'),
      is_mileage_active: active('is_mileage_active'),
      company_id: qa('company_id'),
      multi,
      internet_price_from: String(price.vLo),
      internet_price_to: String(price.vHi),
      year_from: String(year.vLo),
      year_to: String(year.vHi),
      mileage_from: String(miles.vLo),
      mileage_to: String(miles.vHi),
      // The sliders' own positions (the Alpine / vanilla state), apart from the hidden fields the form sends.
      priceValue: [price.vLo, price.vHi] as [number, number],
      priceBounds: [price.lo, price.hi] as [number, number],
      yearValue: [year.vLo, year.vHi] as [number, number],
      mileageValue: [miles.vLo, miles.vHi] as [number, number],
    }
  }

  const form = reactive(freshForm())
  /** Bumped on every load: the sidebar re-renders from it, as the Laravel swap re-rendered the sidebar's HTML. */
  const version = ref(0)
  /** window._sfLastTouchedField: the field whose zero-count rows stay visible. */
  const lastTouched = ref('')
  const loading = ref(false)

  watch(
    data,
    () => {
      Object.assign(form, freshForm())
      version.value++
    },
    { deep: false },
  )

  /** The form's FormData, in the form's order. */
  function currentParams(): Pairs {
    const p: Pairs = []
    const f = form
    p.push(['list', f.list], ['page', '1'])
    for (const v of f.qbt) p.push(['qbt[]', v], ['body_type[]', v])
    p.push(
      ['grid', f.grid],
      ['search', f.search],
      ['per_page', f.per_page],
      ['sort_by', f.sort_by],
      ['max_price', f.max_price],
      ['last_updated_value', f.last_updated_value],
      ['is_make_active', f.is_make_active],
      ['is_model_active', f.is_model_active],
      ['is_trim_active', f.is_trim_active],
      ['is_year_active', f.is_year_active],
      ['is_internet_price_active', f.is_internet_price_active],
      ['is_mileage_active', f.is_mileage_active],
    )
    if (facet('getavailablecompanies').length > 1) for (const v of f.company_id) p.push(['company_id[]', v])
    if (facet('getavailableinternetprice').length) {
      p.push(['internet_price_from', f.internet_price_from], ['internet_price_to', f.internet_price_to])
    }
    const multiPairs = (id: MultiId) => {
      const { param, facet: name, key } = MULTI_FIELDS[id]
      const choices = facet(name)
      if (!choices.length) return
      const values = choices.map((c) => String(c[key] ?? '')).filter((v) => v !== '')
      const isColor = id === 'exterior' || id === 'interior'
      // Values in the request that aren't choices: hidden inputs (not for the colours, whose request key differs).
      if (!isColor) for (const v of f.multi[id]) if (!values.includes(v)) p.push([`${param}[]`, v])
      for (const v of values) if (f.multi[id].includes(v)) p.push([`${param}[]`, v])
    }
    if (facet('vehiclebodytype').length) {
      multiPairs('body_type')
      multiPairs('make')
      multiPairs('model')
      multiPairs('trim')
      if (facet('getavailableyear').length) p.push(['year_from', f.year_from], ['year_to', f.year_to])
      if (facet('getavailablemileage').length) p.push(['mileage_from', f.mileage_from], ['mileage_to', f.mileage_to])
      multiPairs('drivetrain')
    }
    multiPairs('exterior')
    multiPairs('interior')
    multiPairs('transmission')
    return p
  }

  /** The URL's query: the params without the empty ones, and a range's values only once it's been used. */
  function toQuery(pairs: Pairs): Record<string, string | string[]> {
    const has = (k: string) => pairs.some(([key, v]) => key === k && v === 'true')
    const skip: Record<string, string> = {
      internet_price_from: 'is_internet_price_active',
      internet_price_to: 'is_internet_price_active',
      year_from: 'is_year_active',
      year_to: 'is_year_active',
      mileage_from: 'is_mileage_active',
      mileage_to: 'is_mileage_active',
    }
    const out: Record<string, string | string[]> = {}
    for (const [key, value] of pairs) {
      if (value === '' || (skip[key] && !has(skip[key]!))) continue
      if (key.endsWith('[]')) ((out[key] ??= []) as string[]).push(value)
      else out[key] = value
    }
    return out
  }

  const setParam = (p: Pairs, key: string, value: string | number | null | undefined): Pairs => {
    const rest = p.filter(([k]) => k !== key)
    if (value === null || value === undefined || value === '') return rest
    // URLSearchParams.set keeps the first occurrence's place.
    const at = p.findIndex(([k]) => k === key)
    if (at < 0) return [...rest, [key, String(value)]]
    const before = p.slice(0, at).filter(([k]) => k !== key)
    return [...before, [key, String(value)], ...p.slice(at + 1).filter(([k]) => k !== key)]
  }

  /** vehicleSearch.applyFilters(overrides): run the search for the form (or freshParams) with the overrides. */
  async function applyFilters(overrides: Record<string, string | number | null> = {}, freshParams?: Pairs) {
    let params = freshParams ?? currentParams()
    for (const [key, value] of Object.entries(overrides)) params = setParam(params, key, value)
    const query = toQuery(params)
    const same = JSON.stringify(query) === JSON.stringify(normalised(route.query))
    if (same) {
      loading.value = true
      await refresh().finally(() => (loading.value = false))
      return
    }
    await router.push({ path: route.path, query })
  }

  function normalised(query: Record<string, any>) {
    const out: Record<string, string | string[]> = {}
    for (const [k, v] of Object.entries(query)) {
      if (k.endsWith('[]')) out[k] = (Array.isArray(v) ? v : [v]).map(String)
      else out[k] = String(Array.isArray(v) ? v[v.length - 1] : v)
    }
    return out
  }

  function goToPage(page: number) {
    lastTouched.value = ''
    applyFilters({ page })
    if ((typeof window !== 'undefined')) window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  function changePerPage(perPage: string) {
    lastTouched.value = ''
    applyFilters({ per_page: perPage, page: 1 })
  }
  function changeSort(sortBy: string) {
    lastTouched.value = ''
    applyFilters({ sort_by: sortBy, page: 1 })
  }
  function submitSearch(term: string) {
    lastTouched.value = ''
    applyFilters({ search: term, page: 1 })
  }
  /** A Popular chip: select = only that body type; the active chip again = remove just it. */
  function toggleChip(key: string, value: string) {
    lastTouched.value = ''
    const name = `${key}[]`
    const params = currentParams()
    const current = params.filter(([k]) => k === name).map(([, v]) => v)
    if (current.length === 1 && current[0] === value) applyFilters({}, params.filter(([k]) => k !== name))
    else applyFilters({}, [[name, value]])
  }
  function toggleMaxPrice(value: string) {
    lastTouched.value = ''
    const params = currentParams()
    if (params.find(([k]) => k === 'max_price')?.[1] === value) applyFilters({}, params.filter(([k]) => k !== 'max_price'))
    else applyFilters({}, [['max_price', value]])
  }
  /** Remove one active-filter chip (the Active Filters modal). */
  function removeFilterValue(key: string, value: string) {
    lastTouched.value = ''
    const name = `${key}[]`
    let params = currentParams()
    const kept = params.filter(([k, v]) => k === name && v !== value).map(([, v]) => v)
    params = params.filter(([k]) => k !== name)
    for (const v of kept) params.push([name, v])
    params = setParam(params, 'page', 1)
    applyFilters({}, params)
  }
  function clearAll() {
    lastTouched.value = ''
    applyFilters({}, [])
  }

  // ── The sidebar's vanilla helpers ──────────────────────────────────────────────────────────────────
  const isDesktop = () => (typeof window !== 'undefined') && window.innerWidth >= DESKTOP

  /** sfRestorePriceSelection(): a narrowed price slider survives the other filters' clearing. */
  function restorePriceSelection() {
    if (!facet('getavailableinternetprice').length) return
    const [lo, hi] = form.priceBounds
    const [a, b] = form.priceValue
    if (!(a > lo || b < hi)) return
    form.internet_price_from = String(a)
    form.internet_price_to = String(b)
    form.is_internet_price_active = 'true'
  }

  /** The `customEventTriggered` listener: the search runs at once on a wide screen; a phone waits for Apply. */
  function customEventTriggered() {
    restorePriceSelection()
    if (isDesktop()) applyFilters()
  }

  /** postThisForm(id): a filter checkbox was clicked. */
  function postThisForm(id: string) {
    form.last_updated_value = id
    lastTouched.value = id
    if (id === 'make') form.is_make_active = 'true'
    else if (id === 'model') form.is_model_active = 'true'
    else if (id === 'trim') form.is_trim_active = 'true'
    form.is_internet_price_active = ''
    form.is_mileage_active = ''
    if (!form.is_year_active) {
      form.year_from = ''
      form.year_to = ''
    } else form.is_year_active = 'true'
    form.mileage_from = ''
    form.mileage_to = ''
    form.internet_price_from = ''
    form.internet_price_to = ''
    customEventTriggered()
  }

  const timers: Partial<Record<RangeId, ReturnType<typeof setTimeout>>> = {}
  /** rngSubmit_year / rngSubmit_mileage / priceRangeLive.submit: 400ms after a slider settles. */
  function submitRange(id: RangeId) {
    clearTimeout(timers[id])
    timers[id] = setTimeout(() => {
      form.last_updated_value = id
      const clearYear = () => {
        if (!form.is_year_active) form.year_from = form.year_to = ''
      }
      const clearMileage = () => {
        if (!form.is_mileage_active) form.mileage_from = form.mileage_to = ''
      }
      const clearPrice = () => {
        if (!form.is_internet_price_active) form.internet_price_from = form.internet_price_to = ''
      }
      if (id === 'internet_price') {
        form.is_internet_price_active = 'true'
        clearYear()
        clearMileage()
      } else if (id === 'year') {
        form.is_year_active = 'true'
        clearMileage()
        clearPrice()
      } else {
        form.is_mileage_active = 'true'
        clearYear()
        clearPrice()
      }
      customEventTriggered()
    }, 400)
  }

  // ── The phone's off-canvas filters, the Active Filters modal, the inquiry modal ─────────────────────
  const mobileOpen = ref(false)
  const filterModalOpen = ref(false)
  const inquiryVehicle = ref<Record<string, any> | null>(null)

  function setMobileOpen(open: boolean) {
    mobileOpen.value = open
    if ((typeof window !== 'undefined') && (window.innerWidth < DESKTOP || !open)) document.body.style.overflow = open ? 'hidden' : ''
  }

  return {
    route,
    q,
    qa,
    facet,
    form,
    version,
    lastTouched,
    loading,
    currentParams,
    applyFilters,
    goToPage,
    changePerPage,
    changeSort,
    submitSearch,
    toggleChip,
    toggleMaxPrice,
    removeFilterValue,
    clearAll,
    postThisForm,
    submitRange,
    mobileOpen,
    setMobileOpen,
    filterModalOpen,
    inquiryVehicle,
  }
}

export type InventorySearch = ReturnType<typeof createInventorySearch>
// Symbol.for: one key for the whole app, even if this module were ever loaded twice (provide and inject must match).
export const INVENTORY_SEARCH: InjectionKey<InventorySearch> = Symbol.for('dealer-lion:inventory-search')

/** The page's search, for the inventory components. */
export function useInventorySearch(): InventorySearch {
  const ctx = inject(INVENTORY_SEARCH)
  if (!ctx) throw new Error('useInventorySearch() outside the inventory page')
  return ctx
}
